import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, portfolioHoldings, user } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getStockQuotes } from "@/lib/yahoo-finance";
import { generatePreOrderWarning } from "@/lib/ai";
import { generateId } from "@/lib/utils";
import { headers } from "next/headers";
import { z } from "zod";

const orderSchema = z.object({
  symbol: z.string().min(1),
  type: z.enum(["buy", "sell"]),
  orderType: z.enum(["market", "limit"]),
  lots: z.number().int().min(1),
  limitPrice: z.number().optional(),
  goalId: z.string().optional(),
});

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const txList = await db.select().from(orders)
    .where(eq(orders.userId, session.user.id))
    .orderBy(desc(orders.executedAt));

  return NextResponse.json({ orders: txList });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { symbol, type, orderType, lots, limitPrice, goalId } = parsed.data;

  // Get current price
  const quotes = await getStockQuotes([symbol]);
  const quote = quotes[0];
  if (!quote) return NextResponse.json({ error: "Stock not found" }, { status: 404 });

  const pricePerShare = orderType === "limit" && limitPrice ? limitPrice : quote.regularMarketPrice;
  const totalValue = Math.round(pricePerShare * lots * 100);

  // Get user data
  const [userData] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);
  if (!userData) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Check balance for buy
  if (type === "buy" && (userData.virtualBalance ?? 0) < totalValue) {
    return NextResponse.json({ error: "Insufficient virtual balance" }, { status: 400 });
  }

  // Check holdings for sell
  if (type === "sell") {
    const [holding] = await db.select().from(portfolioHoldings)
      .where(and(eq(portfolioHoldings.userId, session.user.id), eq(portfolioHoldings.symbol, symbol)))
      .limit(1);
    if (!holding || holding.lots < lots) {
      return NextResponse.json({ error: "Not enough lots to sell" }, { status: 400 });
    }
  }

  // AI pre-order warning
  let aiWarning: string | null = null;
  try {
    aiWarning = await generatePreOrderWarning(
      symbol, quote, userData.riskProfile || "moderate", type, lots
    );
  } catch { /* Non-blocking */ }

  // Execute order in transaction
  const orderId = generateId();
  await db.transaction(async (tx) => {
    await tx.insert(orders).values({
      id: orderId,
      userId: session.user.id,
      goalId: goalId || null,
      symbol,
      type,
      orderType,
      lots,
      pricePerShare: Math.round(pricePerShare),
      totalValue,
      status: "executed",
      aiWarning,
      executedAt: new Date(),
    });

    const balanceChange = type === "buy" ? -totalValue : totalValue;
    await tx.update(user)
      .set({ virtualBalance: (userData.virtualBalance || 0) + balanceChange })
      .where(eq(user.id, session.user.id));

    const [existingHolding] = await tx.select().from(portfolioHoldings)
      .where(and(eq(portfolioHoldings.userId, session.user.id), eq(portfolioHoldings.symbol, symbol)))
      .limit(1);

    if (type === "buy") {
      if (existingHolding) {
        const newLots = existingHolding.lots + lots;
        const newTotalInvested = existingHolding.totalInvested + totalValue;
        const newAvgPrice = Math.round(newTotalInvested / (newLots * 100));
        await tx.update(portfolioHoldings)
          .set({ lots: newLots, avgBuyPrice: newAvgPrice, totalInvested: newTotalInvested, updatedAt: new Date() })
          .where(eq(portfolioHoldings.id, existingHolding.id));
      } else {
        await tx.insert(portfolioHoldings).values({
          id: generateId(),
          userId: session.user.id,
          goalId: goalId || null,
          symbol,
          lots,
          avgBuyPrice: Math.round(pricePerShare),
          totalInvested: totalValue,
          updatedAt: new Date(),
        });
      }
    } else if (existingHolding) {
      const newLots = existingHolding.lots - lots;
      if (newLots <= 0) {
        await tx.delete(portfolioHoldings).where(eq(portfolioHoldings.id, existingHolding.id));
      } else {
        const soldRatio = lots / existingHolding.lots;
        const remainingInvested = Math.round(existingHolding.totalInvested * (1 - soldRatio));
        await tx.update(portfolioHoldings)
          .set({ lots: newLots, totalInvested: remainingInvested, updatedAt: new Date() })
          .where(eq(portfolioHoldings.id, existingHolding.id));
      }
    }
  });

  return NextResponse.json({
    success: true,
    orderId,
    pricePerShare: Math.round(pricePerShare),
    totalValue,
    aiWarning,
  });
}
