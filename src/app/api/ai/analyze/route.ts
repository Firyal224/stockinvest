import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStockDetail } from "@/lib/yahoo-finance";
import { analyzeStockAI } from "@/lib/ai";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "Symbol required" }, { status: 400 });

  const stockData = await getStockDetail(symbol);
  if (!stockData) return NextResponse.json({ error: "Stock not found" }, { status: 404 });

  const analysis = await analyzeStockAI(symbol, stockData);
  return NextResponse.json({ analysis });
}
