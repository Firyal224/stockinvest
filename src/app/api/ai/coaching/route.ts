import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, portfolioHoldings, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getStockQuotes } from "@/lib/yahoo-finance";
import { generateAIText } from "@/lib/ai";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [allOrders, holdings, [userData]] = await Promise.all([
    db.select().from(orders).where(eq(orders.userId, session.user.id)),
    db.select().from(portfolioHoldings).where(eq(portfolioHoldings.userId, session.user.id)),
    db.select().from(user).where(eq(user.id, session.user.id)).limit(1),
  ]);

  if (!allOrders.length) {
    return NextResponse.json({ coaching: null, message: "No orders yet to analyze" });
  }

  const symbols = holdings.map((h) => h.symbol);
  const quotes = symbols.length ? await getStockQuotes(symbols) : [];
  const quoteMap = Object.fromEntries(quotes.map((q) => [q.symbol, q]));

  const totalValue = holdings.reduce((sum, h) => {
    const price = quoteMap[h.symbol]?.regularMarketPrice || h.avgBuyPrice;
    return sum + price * h.lots * 100;
  }, 0);

  const concentration = holdings.map((h) => {
    const price = quoteMap[h.symbol]?.regularMarketPrice || h.avgBuyPrice;
    return {
      symbol: h.symbol,
      pct: totalValue > 0 ? (price * h.lots * 100) / totalValue : 0,
    };
  });

  const buyOrders = allOrders.filter((o) => o.type === "buy");
  const sellOrders = allOrders.filter((o) => o.type === "sell");

  // FOMO: same stock bought 3+ times within 7 days
  const symbolBuys: Record<string, Date[]> = {};
  buyOrders.forEach((o) => {
    if (!symbolBuys[o.symbol]) symbolBuys[o.symbol] = [];
    symbolBuys[o.symbol].push(new Date(o.executedAt));
  });

  const fomoPatterns: string[] = [];
  Object.entries(symbolBuys).forEach(([sym, dates]) => {
    if (dates.length >= 3) {
      const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
      for (let i = 2; i < sorted.length; i++) {
        const span = (sorted[i].getTime() - sorted[i - 2].getTime()) / 86400000;
        if (span <= 7) { fomoPatterns.push(`${sym} (${dates.length} buys)`); break; }
      }
    }
  });

  // Panic sell: sold within 3 days of buying
  const panicSells: string[] = [];
  sellOrders.forEach((sell) => {
    const buys = buyOrders
      .filter((b) => b.symbol === sell.symbol && new Date(b.executedAt) < new Date(sell.executedAt))
      .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());
    if (buys.length) {
      const days = (new Date(sell.executedAt).getTime() - new Date(buys[0].executedAt).getTime()) / 86400000;
      if (days <= 3) panicSells.push(`${sell.symbol} (${days.toFixed(0)}d after buy)`);
    }
  });

  const overConcentrated = concentration
    .filter((c) => c.pct > 0.4)
    .map((c) => `${c.symbol} (${(c.pct * 100).toFixed(1)}%)`);

  const recentOrders = allOrders
    .slice(-30)
    .map((o) => ({ symbol: o.symbol, type: o.type, lots: o.lots, date: o.executedAt }));

  const prompt = `You are a behavioral finance coach for Indonesian retail investors (IDX market).
Analyze this investor's trading behavior and provide personalized coaching.

Summary:
- Total orders: ${allOrders.length}, Buys: ${buyOrders.length}, Sells: ${sellOrders.length}
- Risk profile: ${userData?.riskProfile || "moderate"}
- FOMO patterns detected: ${fomoPatterns.join(", ") || "none"}
- Panic selling detected: ${panicSells.join(", ") || "none"}
- Over-concentration (>40%): ${overConcentrated.join(", ") || "none"}

Recent 30 orders: ${JSON.stringify(recentOrders)}

Respond ONLY in valid JSON:
{
  "patterns": [
    { "type": "fomo"|"panic_sell"|"over_concentration"|"positive", "title": "string", "description": "string (specific, actionable)", "affected": ["SYMBOL.JK"] }
  ],
  "tips": ["tip 1", "tip 2", "tip 3"],
  "overallScore": number (0-100),
  "overallFeedback": "2-3 sentence overall assessment"
}`;

  const text = await generateAIText(prompt, "Analyze my trading behavior", 800);
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return NextResponse.json({ coaching: JSON.parse(cleaned) });
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }
}
