import { NextRequest, NextResponse } from "next/server";
import { getStockDetail, getHistoricalData } from "@/lib/yahoo-finance";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const decodedSymbol = decodeURIComponent(symbol);
    const { searchParams } = new URL(req.url);
    const period = (searchParams.get("period") || "1mo") as "1d" | "5d" | "1mo" | "3mo" | "1y";

    const [detail, history] = await Promise.all([
      getStockDetail(decodedSymbol),
      getHistoricalData(decodedSymbol, period),
    ]);

    if (!detail) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    return NextResponse.json({ stock: detail, history });
  } catch (error) {
    console.error("Stock detail API error:", error);
    return NextResponse.json({ error: "Failed to fetch stock detail" }, { status: 500 });
  }
}
