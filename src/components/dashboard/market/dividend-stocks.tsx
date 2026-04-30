"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coins, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DividendStock {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  dividendYield: number | null;
  dividendRate: number | null;
  trailingPE: number | null;
  marketCap: number;
}

export function DividendStocks() {
  const [stocks, setStocks] = useState<DividendStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stocks/dividends")
      .then((r) => r.json())
      .then((d) => setStocks(d.stocks || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <Coins className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Top Dividend Stocks</h2>
          <p className="text-xs text-muted-foreground">IDX stocks with highest dividend yield</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : stocks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No dividend data available.</p>
      ) : (
        <div className="overflow-y-auto max-h-[320px] space-y-1 pr-1 scrollbar-thin">
          {stocks.map((s, i) => {
            const isUp = s.regularMarketChangePercent >= 0;
            const yieldPct = ((s.dividendYield || 0) * 100).toFixed(2);

            return (
              <Link key={s.symbol} href={`/stock/${encodeURIComponent(s.symbol)}`}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted/50 transition-colors group">
                {/* Rank */}
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0",
                  i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-300 text-slate-700" : i === 2 ? "bg-orange-300 text-white" : "bg-muted text-muted-foreground"
                )}>
                  {i + 1}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs group-hover:text-primary transition-colors">
                      {s.symbol.replace(".JK", "")}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate hidden sm:block">{s.shortName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">Rp {s.regularMarketPrice.toLocaleString("id-ID")}</span>
                    <span className={cn("text-[10px] font-medium flex items-center gap-0.5", isUp ? "text-emerald-600" : "text-rose-500")}>
                      {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                      {Math.abs(s.regularMarketChangePercent).toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Yield */}
                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-amber-600">{yieldPct}%</div>
                  <div className="text-[10px] text-muted-foreground">yield/yr</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t">
        Yield = dividen tahunan ÷ harga saham. Tidak menjamin pembayaran masa depan.
      </p>
    </div>
  );
}
