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

  let pnlSummary = null;
  let goalProgress: unknown[] = [];
  let recommendations: unknown[] = [];
  let weekSummary = "";
  let topPerformer = null;
  let worstPerformer = null;

  try {
    pnlSummary = latest.pnlSummary ? JSON.parse(latest.pnlSummary) : null;
    if (pnlSummary && (isNaN(pnlSummary.totalValue) || isNaN(pnlSummary.netPnl) || isNaN(pnlSummary.netPnlPct))) {
      pnlSummary = null;
    }
  } catch { pnlSummary = null; }

  try {
    const raw = latest.goalProgress ? JSON.parse(latest.goalProgress) : [];
    goalProgress = Array.isArray(raw) ? raw.filter((g: { name?: string; progressPct?: number }) => g.name && g.progressPct !== undefined) : [];
  } catch { goalProgress = []; }

  try {
    const raw = latest.recommendations ? JSON.parse(latest.recommendations) : [];
    recommendations = Array.isArray(raw) ? raw : [];
  } catch { recommendations = []; }

  if (latest.coachingNotes?.startsWith("__meta__:")) {
    try {
      const [metaLine, ...rest] = latest.coachingNotes.split("\n\n");
      const meta = JSON.parse(metaLine.replace("__meta__:", ""));
      weekSummary = meta.weekSummary || "";
      topPerformer = meta.topPerformer || null;
      worstPerformer = meta.worstPerformer || null;
      latest.coachingNotes = rest.join("\n\n");
    } catch { /* skip */ }
  }

  return NextResponse.json({
    report: {
      id: latest.id,
      createdAt: latest.createdAt,
      weekSummary,
      topPerformer,
      worstPerformer,
      pnlSummary,
      coachingNotes: latest.coachingNotes || "",
      goalProgress,
      recommendations,
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
  const netPnlPct = totalInvested > 0 ? (netPnl / totalInvested) * 100 : 0;

  // Hitung top & worst dari data real
  const sorted = [...portfolioDetail].sort((a, b) => b.pnlPct - a.pnlPct);
  const topPerformer = sorted[0] ? { symbol: sorted[0].symbol, pnlPct: sorted[0].pnlPct } : null;
  const worstPerformer = sorted[sorted.length - 1]
    ? { symbol: sorted[sorted.length - 1].symbol, pnlPct: sorted[sorted.length - 1].pnlPct }
    : null;

  const goalsInfo = userGoals.map((g) => ({
    name: g.name,
    targetAmount: g.targetAmount,
    currentAmount: g.currentAmount || 0,
    progressPct: g.targetAmount > 0 ? ((g.currentAmount || 0) / g.targetAmount) * 100 : 0,
  }));

  const systemPrompt = `You are an Indonesian stock portfolio coach writing a weekly performance report.
You MUST respond ONLY with raw valid JSON, no markdown, no backticks, no explanation.
Use this exact structure:
{
  "weekSummary": "2-3 sentence week overview in Indonesian",
  "coachingNotes": "2-3 sentences behavioral feedback in Indonesian",
  "goalProgress": [{ "name": "string", "progressPct": number, "status": "on_track"|"behind"|"ahead" }],
  "recommendations": [{ "symbol": "BBCA.JK", "action": "buy"|"watch"|"hold", "reason": "string" }]
}`;

  const userMessage = `Portfolio:
${JSON.stringify(portfolioDetail, null, 2)}
Total value: IDR ${totalValue.toLocaleString()}
Net PnL: IDR ${netPnl.toLocaleString()} (${netPnlPct.toFixed(2)}%)
Orders this week: ${weekOrders.length}
Goals: ${JSON.stringify(goalsInfo)}
Risk profile: ${userData?.riskProfile || "moderate"}
Generate my weekly report.`;

  console.log("[Weekly] Generating...");
  const text = await generateAIText(systemPrompt, userMessage, 2000);
  console.log("[Weekly] RAW:", text);

  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const reportData = JSON.parse(cleaned);

    // Simpan pnlSummary dari data real (bukan dari AI)
    const pnlSummary = { totalValue, totalInvested, netPnl, netPnlPct };

    // Simpan weekSummary + performers sebagai metadata prefix di coachingNotes
    // karena schema tidak punya kolom terpisah
    const meta = { weekSummary: reportData.weekSummary, topPerformer, worstPerformer };
    const coachingNotesWithMeta = `__meta__:${JSON.stringify(meta)}\n\n${reportData.coachingNotes || ""}`;

    await db.insert(aiWeeklyReports).values({
      id: generateId(),
      userId: session.user.id,
      weekStart: weekAgo,
      pnlSummary: JSON.stringify(pnlSummary),
      coachingNotes: coachingNotesWithMeta,
      goalProgress: JSON.stringify(reportData.goalProgress || []),
      recommendations: JSON.stringify(reportData.recommendations || []),
      createdAt: new Date(),
    });

    return NextResponse.json({
      report: {
        weekSummary: reportData.weekSummary || "",
        topPerformer,
        worstPerformer,
        pnlSummary,
        coachingNotes: reportData.coachingNotes || "",
        goalProgress: reportData.goalProgress || [],
        recommendations: reportData.recommendations || [],
        createdAt: new Date().toISOString(),
      },
    });
  } catch (e) {
    console.error("[Weekly] Failed:", e, "\nRAW:", text);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}