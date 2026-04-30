import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { riskProfileAnswers, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { analyzeRiskProfile } from "@/lib/ai";
import { generateId } from "@/lib/utils";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { answers, initialCapital } = await req.json();
  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
  }

  // Analyze risk profile via AI
  const { profile, explanation } = await analyzeRiskProfile(answers);

  const virtualBalance = initialCapital || 100_000_000;

  await db.transaction(async (tx) => {
    // Save answers
    const answerEntries = Object.entries(answers as Record<string, string>);
    if (answerEntries.length > 0) {
      await tx.insert(riskProfileAnswers).values(
        answerEntries.map(([key, value]) => ({
          id: generateId(),
          userId: session.user.id,
          questionKey: key,
          answer: value as string,
          answeredAt: new Date(),
        }))
      );
    }

    // Update user profile
    await tx.update(user)
      .set({
        riskProfile: profile,
        initialCapital: virtualBalance,
        virtualBalance: virtualBalance,
        onboardingCompleted: true,
      })
      .where(eq(user.id, session.user.id));
  });

  return NextResponse.json({ profile, explanation, virtualBalance });
}
