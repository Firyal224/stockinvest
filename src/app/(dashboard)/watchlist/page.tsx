"use client";

import { useEffect, useState } from "react";
import { Bookmark, TrendingUp, TrendingDown, Trash2, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatIDRCompact, formatPercent } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface WatchlistItem {
  id: string;
  symbol: string;
  addedAt: number;
  quote: {
    shortName: string;
    regularMarketPrice: number;
    regularMarketChangePercent: number;
    regularMarketChange: number;
    marketCap: number;
    trailingPE: number | null;
  } | null;
}

export default function WatchlistPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  async function fetchWatchlist() {
    try {
      const r = await fetch("/api/watchlist");
      const d = await r.json();
      setItems(d.watchlist || []);
    } catch {}
  }

  useEffect(() => { fetchWatchlist().finally(() => setLoading(false)); }, []);

  async function removeFromWatchlist(symbol: string) {
    setRemoving(symbol);
    try {
      await fetch(`/api/watchlist?symbol=${encodeURIComponent(symbol)}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.symbol !== symbol));
      toast({ title: `${symbol.replace(".JK", "")} removed from watchlist` });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Watchlist</h1>
        <p className="text-muted-foreground text-sm mt-1">Stocks you&apos;re monitoring. Click a stock to view details and trade.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : !items.length ? (
        <div className="text-center py-20">
          <Bookmark className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h3 className="text-lg font-semibold mb-2">Your watchlist is empty</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Browse the market board and click &quot;Add to Watchlist&quot; on any stock.
          </p>
          <Link href="/dashboard">
            <Button className="gradient-brand border-0 gap-2">
              <Search className="w-4 h-4" /> Browse Market
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => {
            const up = (item.quote?.regularMarketChangePercent || 0) >= 0;
            return (
              <Card key={item.id} className="group hover:border-primary/50 transition-colors overflow-hidden">
                <CardContent className="p-0">
                  <Link href={`/stock/${encodeURIComponent(item.symbol)}`} className="block p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-primary">{item.symbol.replace(".JK", "").slice(0, 2)}</span>
                        </div>
                        <div>
                          <p className="font-bold text-sm group-hover:text-primary transition-colors">
                            {item.symbol.replace(".JK", "")}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                            {item.quote?.shortName || item.symbol}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); removeFromWatchlist(item.symbol); }}
                        disabled={removing === item.symbol}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-all"
                      >
                        {removing === item.symbol ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {item.quote ? (
                      <>
                        <div className="flex items-end justify-between mb-3">
                          <div>
                            <p className="text-xl font-black">Rp {item.quote.regularMarketPrice.toLocaleString("id-ID")}</p>
                            <div className={cn("flex items-center gap-1 mt-0.5", up ? "text-emerald-500" : "text-rose-500")}>
                              {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                              <span className="text-sm font-semibold">{formatPercent(item.quote.regularMarketChangePercent)}</span>
                            </div>
                          </div>
                          <Badge variant={up ? "success" : "danger"} className="text-xs">
                            {item.quote.regularMarketChange >= 0 ? "+" : ""}{item.quote.regularMarketChange.toLocaleString("id-ID")}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Cap: {formatIDRCompact(item.quote.marketCap)}</span>
                          {item.quote.trailingPE && <span>PE: {item.quote.trailingPE.toFixed(1)}x</span>}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Price unavailable</p>
                    )}
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
