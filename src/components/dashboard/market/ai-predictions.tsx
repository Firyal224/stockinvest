"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Brain, TrendingUp, Loader2, RefreshCw, Zap, RotateCcw, Sparkles, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Prediction {
  symbol: string;
  reason: string;
  targetGainPct: number;
  timeframe: string;
  category: "momentum" | "recovery" | "ipo_candidate" | "dividend_growth";
  quote: {
    shortName: string;
    regularMarketPrice: number;
    regularMarketChangePercent: number;
    fiftyTwoWeekLow: number;
    fiftyTwoWeekHigh: number;
  } | null;
}

const CATEGORY_CONFIG = {
  momentum:       { label: "Momentum",        icon: TrendingUp,  color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  recovery:       { label: "Recovery Play",   icon: RotateCcw,   color: "bg-blue-100 text-blue-700",       dot: "bg-blue-500" },
  ipo_candidate:  { label: "IPO Candidate",   icon: Sparkles,    color: "bg-violet-100 text-violet-700",   dot: "bg-violet-500" },
  dividend_growth:{ label: "Dividend Growth", icon: BarChart3,   color: "bg-amber-100 text-amber-700",     dot: "bg-amber-500" },
};

export function AIPredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [cached, setCached] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/ai/predictions");
      const d = await r.json();
      setPredictions(d.predictions || []);
      setCached(d.cached || false);
    } catch {
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="rounded-xl border bg-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">AI Stock Predictions</h2>
            <p className="text-xs text-muted-foreground">
              {cached ? "Cached today" : "Fresh analysis"} — stocks likely to rise
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs text-violet-600 border-violet-300 bg-violet-50">
            <Zap className="w-3 h-3 mr-1" />AI Powered
          </Badge>
          <Button size="icon" variant="ghost" className="w-7 h-7" onClick={load} disabled={loading}>
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">AI is analyzing IDX stocks…</span>
        </div>
      ) : predictions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">No predictions available. Try refreshing.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {predictions.map((p) => {
            const cat = CATEGORY_CONFIG[p.category] || CATEGORY_CONFIG.momentum;
            const CatIcon = cat.icon;
            const change = p.quote?.regularMarketChangePercent ?? 0;
            const isUp = change >= 0;

            return (
              <Link key={p.symbol} href={`/stock/${encodeURIComponent(p.symbol)}`}
                className="group flex flex-col p-4 rounded-xl border-2 border-border hover:border-violet-300 bg-background hover:bg-violet-50/30 transition-all duration-200">
                {/* Category badge */}
                <div className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium w-fit mb-3", cat.color)}>
                  <CatIcon className="w-3 h-3" />
                  {cat.label}
                </div>

                {/* Symbol & name */}
                <div className="mb-2">
                  <p className="font-black text-base group-hover:text-violet-700 transition-colors">
                    {p.symbol.replace(".JK", "")}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{p.quote?.shortName || p.symbol}</p>
                </div>

                {/* Price */}
                {p.quote && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold">Rp {p.quote.regularMarketPrice.toLocaleString("id-ID")}</span>
                    <span className={cn("text-xs font-semibold", isUp ? "text-emerald-600" : "text-rose-500")}>
                      {isUp ? "+" : ""}{change.toFixed(2)}%
                    </span>
                  </div>
                )}

                {/* Target gain */}
                <div className="mt-auto pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{p.timeframe}</span>
                    <span className="text-xs font-bold text-emerald-600">+{p.targetGainPct}% target</span>
                  </div>
                </div>

                {/* Reason tooltip-style */}
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{p.reason}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
