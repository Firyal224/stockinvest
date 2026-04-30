import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, portfolioHoldings, goals, aiWeeklyReports, user } from "@/lib/db/schema";
import { eq, desc, gte, and } from "drizzle-orm";
import { getStockQuotes } from "@/lib/yahoo-finance";
import { generateAIText } from "@/lib/ai";
import { generateId } from "@/lib/utils";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [latest] = await db.select().from(aiWeeklyReports)
    .where(eq(aiWeeklyReports.userId, session.user.id))
    .orderBy(desc(aiWeeklyReports.createdAt))
    .limit(1);

  if (!latest) return NextResponse.json({ report: null });

  return NextResponse.json({
    report: {
      ...latest,
      pnlSummary: latest.pnlSummary ? JSON.parse(latest.pnlSummary) : null,
      goalProgress: latest.goalProgress ? JSON.parse(latest.goalProgress) : null,
      recommendations: latest.recommendations ? JSON.parse(latest.recommendations) : null,
    },
  });
}

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const weekAgo = new Date(Date.now() - 7 * 86400000);

  const [[userData], holdings, userGoals, weekOrders] = await Promise.all([
    db.select().from(user).where(eq(user.id, session.user.id)).limit(1),
    db.select().from(portfolioHoldings).where(eq(portfolioHoldings.userId, session.user.id)),
    db.select().from(goals).where(eq(goals.userId, session.user.id)),
    db.select().from(orders).where(
      and(eq(orders.userId, session.user.id), gte(orders.executedAt, weekAgo))
    ),
  ]);

  const symbols = holdings.map((h) => h.symbol);
  const quotes = symbols.length ? await getStockQuotes(symbols) : [];
  const quoteMap = Object.fromEntries(quotes.map((q) => [q.symbol, q]));

  const portfolioDetail = holdings.map((h) => {
    const price = quoteMap[h.symbol]?.regularMarketPrice || h.avgBuyPrice;
    const currentValue = price * h.lots * 100;
    const pnl = currentValue - h.totalInvested;
    return {
      symbol: h.symbol,
      lots: h.lots,
      currentValue,
      totalInvested: h.totalInvested,
      pnl,
      pnlPct: h.totalInvested > 0 ? (pnl / h.totalInvested) * 100 : 0,
    };
  });

  const totalValue = portfolioDetail.reduce((s, h) => s + h.currentValue, 0);
  const totalInvested = portfolioDetail.reduce((s, h) => s + h.totalInvested, 0);
  const netPnl = totalValue - totalInvested;

  const goalsInfo = userGoals.map((g) => ({
    name: g.name,
    targetAmount: g.targetAmount,
    currentAmount: g.currentAmount || 0,
    status: g.status,
  }));

  const prompt = `You are an Indonesian stock portfolio coach writing a weekly performance report.

Portfolio holdings this week:
${JSON.stringify(portfolioDetail, null, 2)}
Total portfolio value: IDR ${totalValue.toLocaleString()}
Total invested: IDR ${totalInvested.toLocaleString()}
Net PnL: IDR ${netPnl.toLocaleString()} (${totalInvested > 0 ? ((netPnl / totalInvested) * 100).toFixed(2) : 0}%)

Orders this week: ${weekOrders.length} transactions
Financial goals: ${JSON.stringify(goalsInfo)}
User risk profile: ${userData?.riskProfile || "moderate"}

Respond ONLY in valid JSON:
{
  "weekSummary": "2-3 sentence week overview",
  "pnlSummary": { "totalValue": number, "totalInvested": number, "netPnl": number, "netPnlPct": number },
  "topPerformer": { "symbol": "string", "pnlPct": number },
  "worstPerformer": { "symbol": "string", "pnlPct": number },
  "coachingNotes": "2-3 sentences behavioral feedback",
  "goalProgress": [{ "name": "string", "progressPct": number, "status": "on_track"|"behind"|"ahead" }],
  "recommendations": [{ "symbol": "string", "action": "buy"|"watch"|"hold", "reason": "string" }]
}`;

  const text = await generateAIText(prompt, "Generate my weekly report", 1000);
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const reportData = JSON.parse(cleaned);

    const reportId = generateId();
    await db.insert(aiWeeklyReports).values({
      id: reportId,
      userId: session.user.id,
      weekStart: weekAgo,
      pnlSummary: JSON.stringify(reportData.pnlSummary),
      coachingNotes: reportData.coachingNotes,
      goalProgress: JSON.stringify(reportData.goalProgress),
      recommendations: JSON.stringify(reportData.recommendations),
      createdAt: new Date(),
    });

    return NextResponse.json({ report: reportData });
  } catch {
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
