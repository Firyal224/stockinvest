"use client";

import { useEffect, useState } from "react";
import { Brain, TrendingUp, Eye, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatIDR } from "@/lib/utils";
import Link from "next/link";

interface Highlight {
  symbol: string;
  reason: string;
  type: "buy" | "watch";
  quote?: {
    shortName: string;
    regularMarketPrice: number;
    regularMarketChangePercent: number;
  };
}

export function AIHighlights({ riskProfile }: { riskProfile: string }) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai/screener")
      .then((r) => r.json())
      .then((d) => setHighlights(d.stocks || d.highlights || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-xl border bg-gradient-to-r from-primary/5 to-accent/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">AI Market Highlights</h2>
          <p className="text-xs text-muted-foreground">Top picks for your {riskProfile} profile today</p>
        </div>
        <Badge variant="purple" className="ml-auto">AI Powered</Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {highlights.map((h) => (
            <Link key={h.symbol} href={`/stock/${encodeURIComponent(h.symbol)}`}
              className="p-4 rounded-lg bg-background border hover:border-primary/50 hover:shadow-sm transition-all group">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors">{h.symbol.replace(".JK", "")}</p>
                  <p className="text-xs text-muted-foreground truncate">{h.quote?.shortName || h.symbol}</p>
                </div>
                <Badge variant={h.type === "buy" ? "success" : "info"} className="shrink-0">
                  {h.type === "buy" ? <TrendingUp className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                  {h.type}
                </Badge>
              </div>
              {h.quote && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">Rp {h.quote.regularMarketPrice.toLocaleString("id-ID")}</span>
                  <span className={cn("text-xs font-medium", h.quote.regularMarketChangePercent >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    {h.quote.regularMarketChangePercent >= 0 ? "+" : ""}{h.quote.regularMarketChangePercent.toFixed(2)}%
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground line-clamp-2">{h.reason}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
