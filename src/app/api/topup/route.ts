import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { topupHistory, user } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import { headers } from "next/headers";
import { z } from "zod";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const history = await db
    .select()
    .from(topupHistory)
    .where(eq(topupHistory.userId, session.user.id))
    .orderBy(desc(topupHistory.createdAt));

  return NextResponse.json({ history });
}

const topupSchema = z.object({
  amount: z.number().int().min(1000000).max(100000000),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = topupSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { amount, note } = parsed.data;

  const [userData] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);
  if (!userData) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await db.transaction(async (tx) => {
    await tx.insert(topupHistory).values({
      id: generateId(),
      userId: session.user.id,
      amount,
      note: note || `Top up #${Date.now()}`,
      createdAt: new Date(),
    });
    await tx.update(user)
      .set({ virtualBalance: (userData.virtualBalance || 0) + amount })
      .where(eq(user.id, session.user.id));
  });

  return NextResponse.json({ success: true, newBalance: (userData.virtualBalance || 0) + amount });
}
