import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStockQuotes, IDX_STOCKS } from "@/lib/yahoo-finance";
import { predictStockMovement } from "@/lib/ai";
import { headers } from "next/headers";

// Daily server-side cache
let cache: { data: unknown; date: string } | null = null;

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];
  if (cache?.date === today) {
    return NextResponse.json({ predictions: cache.data, cached: true });
  }

  // Sample 25 random IDX stocks for analysis
  const sample = [...IDX_STOCKS].sort(() => Math.random() - 0.5).slice(0, 25);
  const quotes = await getStockQuotes(sample);

  const stockData = quotes.map((q) => ({
    symbol: q.symbol,
    price: q.regularMarketPrice,
    changePercent: q.regularMarketChangePercent,
    pe: q.trailingPE,
    fiftyTwoWeekLow: q.fiftyTwoWeekLow,
    fiftyTwoWeekHigh: q.fiftyTwoWeekHigh,
    nearLowPct: q.fiftyTwoWeekLow > 0
      ? ((q.regularMarketPrice - q.fiftyTwoWeekLow) / (q.fiftyTwoWeekHigh - q.fiftyTwoWeekLow)) * 100
      : 50,
    beta: q.beta,
    volume: q.regularMarketVolume,
    dividendYield: q.dividendYield,
  }));

  const picks = await predictStockMovement(stockData);
  if (!picks.length) return NextResponse.json({ predictions: [], cached: false });

  // Enrich with real quote data
  const pickSymbols = picks.map((p) => p.symbol);
  const pickQuotes = await getStockQuotes(pickSymbols);
  const quoteMap = Object.fromEntries(pickQuotes.map((q) => [q.symbol, q]));

  const enriched = picks.map((p) => ({ ...p, quote: quoteMap[p.symbol] || null }));

  cache = { data: enriched, date: today };
  return NextResponse.json({ predictions: enriched, cached: false });
}
