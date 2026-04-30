import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { goals, goalStocks, user } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { generateGoalAllocation } from "@/lib/ai";
import { generateId } from "@/lib/utils";
import { headers } from "next/headers";
import { z } from "zod";

const goalSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  targetAmount: z.number().int().min(1),
  deadline: z.string(),
  allocatedBalance: z.number().int().min(0).optional(),
});

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userGoals = await db.select().from(goals).where(eq(goals.userId, session.user.id));
  const goalIds = userGoals.map((g) => g.id);

  const allStocks = goalIds.length
    ? await db.select().from(goalStocks).where(inArray(goalStocks.goalId, goalIds))
    : [];

  // Goals with no stocks yet — auto-generate AI allocation in background
  const [userData] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);
  const riskProfile = userData?.riskProfile || "moderate";

  const goalsWithStocks = await Promise.all(userGoals.map(async (g) => {
    let stocks = allStocks.filter((s) => s.goalId === g.id);
    let aiNote = g.aiNote;

    if (stocks.length === 0) {
      try {
        const daysLeft = Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000);
        const allocation = await generateGoalAllocation(g.category, riskProfile, g.targetAmount, daysLeft);
        if (allocation.length > 0) {
          const newStocks = allocation.map((a) => ({
            id: generateId(),
            goalId: g.id,
            symbol: a.symbol,
            allocationPct: a.allocationPct,
            aiReason: a.reason,
          }));
          await db.insert(goalStocks).values(newStocks);
          stocks = newStocks;
          aiNote = `AI merekomendasikan ${allocation.length} saham berdasarkan profil risiko ${riskProfile} dan timeline ${daysLeft} hari.`;
          await db.update(goals).set({ aiNote }).where(eq(goals.id, g.id));
        }
      } catch { /* silent */ }
    }

    return { ...g, aiNote, stocks };
  }));

  return NextResponse.json({ goals: goalsWithStocks });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = goalSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { name, category, targetAmount, deadline, allocatedBalance } = parsed.data;
  const deadlineDate = new Date(deadline);
  const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - Date.now()) / 86400000);

  // Get user risk profile
  const [userData] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);
  const riskProfile = userData?.riskProfile || "moderate";

  // AI allocation
  let allocation: Awaited<ReturnType<typeof generateGoalAllocation>> = [];
  let aiNote = "";
  try {
    allocation = await generateGoalAllocation(category, riskProfile, targetAmount, daysUntilDeadline);
    aiNote = `AI recommends ${allocation.length} stocks based on your ${riskProfile} risk profile and ${daysUntilDeadline} days timeline.`;
  } catch {
    aiNote = "AI analysis pending.";
  }

  const goalId = generateId();
  await db.transaction(async (tx) => {
    await tx.insert(goals).values({
      id: goalId,
      userId: session.user.id,
      name,
      category,
      targetAmount,
      currentAmount: 0,
      deadline: deadlineDate,
      allocatedBalance: allocatedBalance || 0,
      status: "active",
      aiNote,
      createdAt: new Date(),
    });

    if (allocation.length > 0) {
      await tx.insert(goalStocks).values(
        allocation.map((a) => ({
          id: generateId(),
          goalId,
          symbol: a.symbol,
          allocationPct: a.allocationPct,
          aiReason: a.reason,
        }))
      );
    }
  });

  return NextResponse.json({ success: true, goalId, aiNote, allocation });
}
