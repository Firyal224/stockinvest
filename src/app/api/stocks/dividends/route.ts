import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStockQuotes, IDX_STOCKS } from "@/lib/yahoo-finance";
import { headers } from "next/headers";

// Cache for ~1 hour
let cache: { data: unknown; ts: number } | null = null; // set to null to bust on deploy
const TTL = 60 * 60 * 1000;

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json({ stocks: cache.data });
  }

  // Known high-dividend IDX stocks + random sample
  const DIVIDEND_FOCUS = [
    "BBCA.JK", "BBRI.JK", "BMRI.JK", "TLKM.JK", "UNVR.JK",
    "PTBA.JK", "ADRO.JK", "ITMG.JK", "AALI.JK", "LSIP.JK",
    "HMSP.JK", "GGRM.JK", "ANTM.JK", "PGAS.JK", "JSMR.JK",
    "SIDO.JK", "KLBF.JK", "ICBP.JK", "INDF.JK", "AKRA.JK",
  ];

  const extra = IDX_STOCKS.filter((s) => !DIVIDEND_FOCUS.includes(s)).slice(0, 15);
  const quotes = await getStockQuotes([...DIVIDEND_FOCUS, ...extra]);

  const withDividend = quotes
    .filter((q) => (q.dividendYield ?? 0) > 0 || (q.dividendRate ?? 0) > 0)
    .sort((a, b) => (b.dividendYield || 0) - (a.dividendYield || 0))
    .slice(0, 10)
    .map((q) => ({
      symbol: q.symbol,
      shortName: q.shortName,
      regularMarketPrice: q.regularMarketPrice,
      regularMarketChangePercent: q.regularMarketChangePercent,
      dividendYield: q.dividendYield,
      dividendRate: q.dividendRate,
      trailingPE: q.trailingPE,
      marketCap: q.marketCap,
    }));

  cache = { data: withDividend, ts: Date.now() };
  return NextResponse.json({ stocks: withDividend });
}
