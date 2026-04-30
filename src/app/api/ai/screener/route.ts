import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateAIText } from "@/lib/ai";
import { getStockQuotes, IDX_STOCKS } from "@/lib/yahoo-finance";
import { headers } from "next/headers";

// Server-side daily cache
let screenerCache: { data: unknown; date: string } | null = null;

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];

  if (screenerCache?.date === today) {
    return NextResponse.json({ stocks: screenerCache.data, cached: true });
  }

  const [userData] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);
  const riskProfile = userData?.riskProfile || "moderate";

  // Sample 20 random IDX stocks to get real market data
  const sample = [...IDX_STOCKS].sort(() => Math.random() - 0.5).slice(0, 20);
  const quotes = await getStockQuotes(sample);

  const stockData = quotes.map((q) => ({
    symbol: q.symbol,
    price: q.regularMarketPrice,
    change: q.regularMarketChangePercent,
    pe: q.trailingPE,
    fiftyTwoWeekLow: q.fiftyTwoWeekLow,
    fiftyTwoWeekHigh: q.fiftyTwoWeekHigh,
    nearLowPct: q.fiftyTwoWeekLow > 0
      ? ((q.regularMarketPrice - q.fiftyTwoWeekLow) / q.fiftyTwoWeekLow) * 100
      : null,
    beta: q.beta,
    marketCap: q.marketCap,
  }));

  const prompt = `You are an IDX stock screener AI for Indonesian retail investors.
Based on the following real market data and the user's risk profile (${riskProfile}),
select the top 5 stocks worth watching today.

Criteria: favorable PE, price near 52-week low (potential upside), reasonable beta for risk profile.

Stock data:
${JSON.stringify(stockData, null, 2)}

Respond ONLY in valid JSON array (exactly 5 items):
[
  {
    "symbol": "BBCA.JK",
    "reason": "brief 1-sentence reason",
    "type": "buy"|"watch",
    "highlight": "PE attractive"|"Near 52W low"|"Strong momentum"|"Defensive pick"
  }
]`;

  const text = await generateAIText(prompt, "Screen top stocks today", 500);
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const picks = JSON.parse(cleaned);

    const pickSymbols = picks.map((p: { symbol: string }) => p.symbol);
    const pickQuotes = await getStockQuotes(pickSymbols);
    const quoteMap = Object.fromEntries(pickQuotes.map((q) => [q.symbol, q]));

    const enriched = picks.map((p: { symbol: string; reason: string; type: string; highlight: string }) => ({
      ...p,
      quote: quoteMap[p.symbol] || null,
    }));

    screenerCache = { data: enriched, date: today };
    return NextResponse.json({ stocks: enriched, cached: false });
  } catch {
    return NextResponse.json({ error: "Failed to run screener" }, { status: 500 });
  }
}
