import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { watchlist } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getStockQuotes } from "@/lib/yahoo-finance";
import { generateId } from "@/lib/utils";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await db.select().from(watchlist).where(eq(watchlist.userId, session.user.id));
  if (!items.length) return NextResponse.json({ watchlist: [] });

  const symbols = items.map((i) => i.symbol);
  const quotes = await getStockQuotes(symbols);
  const quoteMap = Object.fromEntries(quotes.map((q) => [q.symbol, q]));

  const enriched = items.map((item) => ({
    ...item,
    quote: quoteMap[item.symbol] || null,
  }));

  return NextResponse.json({ watchlist: enriched });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symbol } = await req.json();
  if (!symbol) return NextResponse.json({ error: "Symbol required" }, { status: 400 });

  const existing = await db.select().from(watchlist)
    .where(and(eq(watchlist.userId, session.user.id), eq(watchlist.symbol, symbol)))
    .limit(1);

  if (existing.length) {
    return NextResponse.json({ error: "Already in watchlist" }, { status: 409 });
  }

  await db.insert(watchlist).values({
    id: generateId(),
    userId: session.user.id,
    symbol,
    addedAt: new Date(),
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "Symbol required" }, { status: 400 });

  await db.delete(watchlist)
    .where(and(eq(watchlist.userId, session.user.id), eq(watchlist.symbol, symbol)));

  return NextResponse.json({ success: true });
}
