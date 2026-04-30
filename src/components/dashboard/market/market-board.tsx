"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Search, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatIDRCompact, formatNumber } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Stock {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  marketCap: number;
  trailingPE: number | null;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
}

type FilterType = "all" | "gainers" | "losers" | "active";

export function MarketBoard() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  async function fetchStocks() {
    try {
      const r = await fetch(`/api/stocks?limit=50&t=${Date.now()}`, { cache: "no-store" });
      const d = await r.json();
      setStocks(d.stocks || []);
    } catch {}
  }

  useEffect(() => {
    fetchStocks().finally(() => setLoading(false));
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchStocks();
    setRefreshing(false);
  }

  const filtered = useMemo(() => {
    let list = stocks;
    if (search) {
      list = list.filter(
        (s) =>
          s.symbol.toLowerCase().includes(search.toLowerCase()) ||
          s.shortName.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filter === "gainers") list = [...list].sort((a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent).slice(0, 20);
    if (filter === "losers") list = [...list].sort((a, b) => a.regularMarketChangePercent - b.regularMarketChangePercent).slice(0, 20);
    if (filter === "active") list = [...list].sort((a, b) => b.regularMarketVolume - a.regularMarketVolume).slice(0, 20);
    return list;
  }, [stocks, filter, search]);

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all", label: "All Stocks" },
    { key: "gainers", label: "Top Gainers" },
    { key: "losers", label: "Top Losers" },
    { key: "active", label: "Most Active" },
  ];

  return (
    <div className="rounded-xl border bg-card">
      {/* Toolbar */}
      <div className="p-4 border-b flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                filter === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symbol…"
              className="pl-9 pr-3 py-2 text-sm bg-muted rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Stock</TableHead>
              <TableHead className="text-right">Price (IDR)</TableHead>
              <TableHead className="text-right">Change</TableHead>
              <TableHead className="text-right hidden md:table-cell">Volume</TableHead>
              <TableHead className="text-right hidden lg:table-cell">Market Cap</TableHead>
              <TableHead className="text-right hidden lg:table-cell">PE Ratio</TableHead>
              <TableHead className="text-right hidden xl:table-cell">52W Range</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : filtered.map((stock) => {
                  const up = stock.regularMarketChangePercent >= 0;
                  const rangePos = stock.fiftyTwoWeekHigh > stock.fiftyTwoWeekLow
                    ? ((stock.regularMarketPrice - stock.fiftyTwoWeekLow) / (stock.fiftyTwoWeekHigh - stock.fiftyTwoWeekLow)) * 100
                    : 50;

                  return (
                    <TableRow key={stock.symbol} className="group cursor-pointer">
                      <TableCell>
                        <Link href={`/stock/${encodeURIComponent(stock.symbol)}`} className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0 group-hover:from-primary/30 group-hover:to-accent/30 transition-all">
                            <span className="text-xs font-bold text-primary">{stock.symbol.replace(".JK", "").slice(0, 2)}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm group-hover:text-primary transition-colors">{stock.symbol.replace(".JK", "")}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[120px]">{stock.shortName}</p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-sm">
                        {stock.regularMarketPrice.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {up ? (
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                          )}
                          <span className={cn("text-sm font-semibold", up ? "text-emerald-500" : "text-rose-500")}>
                            {up ? "+" : ""}{stock.regularMarketChangePercent.toFixed(2)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground hidden md:table-cell">
                        {formatNumber(stock.regularMarketVolume)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground hidden lg:table-cell">
                        {formatIDRCompact(stock.marketCap)}
                      </TableCell>
                      <TableCell className="text-right hidden lg:table-cell">
                        {stock.trailingPE ? (
                          <Badge variant={stock.trailingPE > 30 ? "danger" : stock.trailingPE > 15 ? "warning" : "success"}>
                            {stock.trailingPE.toFixed(1)}x
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-16 text-right">{formatIDRCompact(stock.fiftyTwoWeekLow)}</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[60px]">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, Math.max(0, rangePos))}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-16">{formatIDRCompact(stock.fiftyTwoWeekHigh)}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No stocks found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
