import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStockQuotes } from "@/lib/yahoo-finance";
import { predictSellTiming } from "@/lib/ai";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symbol, lots, avgBuyPrice } = await req.json();
  if (!symbol) return NextResponse.json({ error: "Symbol required" }, { status: 400 });

  const quotes = await getStockQuotes([symbol]);
  const quote = quotes[0];
  if (!quote) return NextResponse.json({ error: "Stock not found" }, { status: 404 });

  const prediction = await predictSellTiming(symbol, quote, lots || 1, avgBuyPrice || quote.regularMarketPrice);
  return NextResponse.json({ prediction, currentPrice: quote.regularMarketPrice, dividendYield: quote.dividendYield });
}
