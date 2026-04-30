import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { portfolioHoldings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getStockQuotes } from "@/lib/yahoo-finance";
import { generateAIText } from "@/lib/ai";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { scenario } = await req.json();
  if (!scenario?.trim()) return NextResponse.json({ error: "Scenario is required" }, { status: 400 });

  // Get portfolio
  const holdings = await db.select().from(portfolioHoldings)
    .where(eq(portfolioHoldings.userId, session.user.id));

  if (!holdings.length) {
    return NextResponse.json({ error: "No portfolio holdings to analyze" }, { status: 400 });
  }

  const symbols = holdings.map((h) => h.symbol);
  const quotes = await getStockQuotes(symbols);
  const quoteMap = Object.fromEntries(quotes.map((q) => [q.symbol, q]));

  const portfolioData = holdings.map((h) => {
    const q = quoteMap[h.symbol];
    return {
      symbol: h.symbol,
      lots: h.lots,
      avgBuyPrice: h.avgBuyPrice,
      currentPrice: q?.regularMarketPrice || h.avgBuyPrice,
      currentValue: (q?.regularMarketPrice || h.avgBuyPrice) * h.lots * 100,
      totalInvested: h.totalInvested,
      beta: q?.beta || 1,
    };
  });

  const totalPortfolioValue = portfolioData.reduce((s, h) => s + h.currentValue, 0);

  const prompt = `You are a professional portfolio risk analyst specializing in Indonesian stocks (IDX).
The user has this portfolio:
${JSON.stringify(portfolioData, null, 2)}
Total portfolio value: IDR ${totalPortfolioValue.toLocaleString()}

Analyze the scenario: "${scenario}"

Respond ONLY in valid JSON with this exact structure:
{
  "scenarioSummary": "brief description of the scenario",
  "totalImpact": { "amount": number, "percent": number },
  "stockImpacts": [
    { "symbol": "BBCA.JK", "estimatedLoss": number, "estimatedLossPercent": number, "reason": "string" }
  ],
  "hedgingStrategies": ["strategy 1", "strategy 2", "strategy 3"],
  "overallAssessment": "2-3 sentence summary"
}`;

  const text = await generateAIText(prompt, scenario, 1000);
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const analysis = JSON.parse(cleaned);
    return NextResponse.json({ analysis, portfolioValue: totalPortfolioValue });
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }
}
