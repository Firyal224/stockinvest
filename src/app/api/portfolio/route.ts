import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { portfolioHoldings, orders, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getStockQuotes } from "@/lib/yahoo-finance";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [holdings, userData, txHistory] = await Promise.all([
    db.select().from(portfolioHoldings).where(eq(portfolioHoldings.userId, session.user.id)),
    db.select().from(user).where(eq(user.id, session.user.id)).limit(1),
    db.select().from(orders).where(eq(orders.userId, session.user.id)).orderBy(),
  ]);

  if (!holdings.length) {
    return NextResponse.json({
      holdings: [],
      totalValue: 0,
      totalInvested: 0,
      pnl: 0,
      pnlPct: 0,
      virtualBalance: userData[0]?.virtualBalance || 0,
      transactions: txHistory,
    });
  }

  const symbols = [...new Set(holdings.map((h) => h.symbol))];
  const quotes = await getStockQuotes(symbols);
  const quoteMap = Object.fromEntries(quotes.map((q) => [q.symbol, q]));

  let totalValue = 0;
  let totalInvested = 0;

  const enrichedHoldings = holdings.map((h) => {
    const quote = quoteMap[h.symbol];
    const currentPrice = quote?.regularMarketPrice || h.avgBuyPrice;
    const currentValue = currentPrice * h.lots * 100;
    const invested = h.totalInvested;
    const pnl = currentValue - invested;
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
    totalValue += currentValue;
    totalInvested += invested;
    return {
      ...h,
      currentPrice,
      currentValue,
      pnl,
      pnlPct,
      stockName: quote?.shortName || h.symbol,
      changePercent: quote?.regularMarketChangePercent || 0,
    };
  });

  const pnl = totalValue - totalInvested;
  const pnlPct = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

  return NextResponse.json({
    holdings: enrichedHoldings,
    totalValue,
    totalInvested,
    pnl,
    pnlPct,
    virtualBalance: userData[0]?.virtualBalance || 0,
    transactions: txHistory,
  });
}
