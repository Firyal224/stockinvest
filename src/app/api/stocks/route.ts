import { NextRequest, NextResponse } from "next/server";
import { getStockQuotes, IDX_STOCKS } from "@/lib/yahoo-finance";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const symbols = IDX_STOCKS.slice(0, limit);
    const quotes = await getStockQuotes(symbols);

    const sorted = quotes.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
    const res = NextResponse.json({ stocks: sorted });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (error) {
    console.error("Stocks API error:", error);
    return NextResponse.json({ error: "Failed to fetch stocks" }, { status: 500 });
  }
}
