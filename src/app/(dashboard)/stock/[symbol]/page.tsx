"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft, TrendingUp, TrendingDown, Bookmark, BookmarkCheck,
  Brain, BarChart3, FileText, Users, ShoppingCart, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceChart } from "@/components/dashboard/stock-detail/price-chart";
import { OrderDialog } from "@/components/dashboard/portfolio/order-dialog";
import { AIAnalysisCard } from "@/components/dashboard/stock-detail/ai-analysis-card";
import { cn, formatIDRCompact, formatPercent } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Period = "1d" | "5d" | "1mo" | "3mo" | "1y";

interface StockData {
  symbol: string;
  shortName: string;
  longName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  marketCap: number;
  trailingPE: number | null;
  forwardPE: number | null;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  fiftyDayAverage: number;
  twoHundredDayAverage: number;
  sector: string;
  industry: string;
  longBusinessSummary: string;
  totalRevenue: number | null;
  returnOnEquity: number | null;
  debtToEquity: number | null;
  dividendYield: number | null;
  dividendRate: number | null;
  beta: number | null;
}

export default function StockDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: rawSymbol } = use(params);
  const symbol = decodeURIComponent(rawSymbol);
  const { toast } = useToast();
  const [stock, setStock] = useState<StockData | null>(null);
  const [history, setHistory] = useState<{ date: string; close: number }[]>([]);
  const [period, setPeriod] = useState<Period>("1mo");
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stocks/${encodeURIComponent(symbol)}?period=${period}`)
      .then((r) => r.json())
      .then((d) => {
        setStock(d.stock);
        setHistory((d.history || []).map((h: { date: string; close: number }) => ({ date: h.date, close: h.close })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [symbol, period]);

  async function toggleWatchlist() {
    setWatchlistLoading(true);
    try {
      if (inWatchlist) {
        await fetch(`/api/watchlist?symbol=${encodeURIComponent(symbol)}`, { method: "DELETE" });
        setInWatchlist(false);
        toast({ title: "Removed from watchlist" });
      } else {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol }),
        });
        setInWatchlist(true);
        toast({ title: "Added to watchlist", variant: "success" as unknown as undefined });
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setWatchlistLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="p-6">
        <Link href="/dashboard"><Button variant="ghost"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
        <p className="mt-4 text-muted-foreground">Stock not found.</p>
      </div>
    );
  }

  const up = stock.regularMarketChangePercent >= 0;

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <Link href="/dashboard">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Market Board
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <span className="font-bold text-primary">{symbol.replace(".JK", "").slice(0, 2)}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{symbol.replace(".JK", "")}</h1>
              <p className="text-muted-foreground text-sm">{stock.shortName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black">Rp {stock.regularMarketPrice.toLocaleString("id-ID")}</span>
            <div className={cn("flex items-center gap-1", up ? "text-emerald-500" : "text-rose-500")}>
              {up ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span className="text-lg font-bold">{formatPercent(stock.regularMarketChangePercent)}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {stock.sector && stock.sector !== "Unknown" && <Badge variant="secondary">{stock.sector}</Badge>}
            {stock.industry && stock.industry !== "Unknown" && <Badge variant="secondary">{stock.industry}</Badge>}
            {stock.beta && <Badge variant="secondary">Beta: {stock.beta.toFixed(2)}</Badge>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 items-start">
          <Button
            variant="outline"
            onClick={toggleWatchlist}
            disabled={watchlistLoading}
            className="gap-2"
          >
            {inWatchlist ? <BookmarkCheck className="w-4 h-4 text-primary" /> : <Bookmark className="w-4 h-4" />}
            {inWatchlist ? "Watchlisted" : "Add to Watchlist"}
          </Button>
          <Button className="gradient-brand border-0 gap-2 hover:opacity-90" onClick={() => setOrderOpen(true)}>
            <ShoppingCart className="w-4 h-4" />
            Buy in Shadow
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Market Cap", value: formatIDRCompact(stock.marketCap) },
          { label: "PE Ratio", value: stock.trailingPE ? `${stock.trailingPE.toFixed(1)}x` : "—" },
          { label: "Day Range", value: `${stock.regularMarketDayLow.toLocaleString("id-ID")} – ${stock.regularMarketDayHigh.toLocaleString("id-ID")}` },
          { label: "52W Range", value: `${stock.fiftyTwoWeekLow.toLocaleString("id-ID")} – ${stock.fiftyTwoWeekHigh.toLocaleString("id-ID")}` },
        ].map(({ label, value }) => (
          <div key={label} className="p-4 rounded-xl border bg-card">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-sm font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="chart">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="chart" className="gap-1.5"><BarChart3 className="w-4 h-4" />Chart</TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5"><Brain className="w-4 h-4" />AI Analysis</TabsTrigger>
          <TabsTrigger value="financials" className="gap-1.5"><FileText className="w-4 h-4" />Financials</TabsTrigger>
          <TabsTrigger value="about" className="gap-1.5"><Users className="w-4 h-4" />About</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Price History</CardTitle>
                <div className="flex gap-1">
                  {(["1d", "5d", "1mo", "3mo", "1y"] as Period[]).map((p) => (
                    <button key={p} onClick={() => setPeriod(p)}
                      className={cn("px-2.5 py-1 rounded text-xs font-medium transition-colors",
                        period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}>
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <PriceChart history={history} color={up ? "#10b981" : "#ef4444"} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <AIAnalysisCard symbol={symbol} />
        </TabsContent>

        <TabsContent value="financials">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "PE Ratio (Trailing)", value: stock.trailingPE ? `${stock.trailingPE.toFixed(2)}x` : "—" },
              { label: "PE Ratio (Forward)", value: stock.forwardPE ? `${stock.forwardPE.toFixed(2)}x` : "—" },
              { label: "Return on Equity", value: stock.returnOnEquity ? formatPercent(stock.returnOnEquity * 100) : "—" },
              { label: "Debt to Equity", value: stock.debtToEquity ? `${stock.debtToEquity.toFixed(2)}x` : "—" },
              { label: "Dividend Yield", value: stock.dividendYield ? formatPercent(stock.dividendYield * 100) : "—" },
              { label: "Beta", value: stock.beta ? stock.beta.toFixed(2) : "—" },
              { label: "50-Day Avg", value: `Rp ${stock.fiftyDayAverage.toLocaleString("id-ID")}` },
              { label: "200-Day Avg", value: `Rp ${stock.twoHundredDayAverage.toLocaleString("id-ID")}` },
              { label: "Day Volume", value: stock.regularMarketVolume.toLocaleString("id-ID") },
              { label: "Market Cap", value: formatIDRCompact(stock.marketCap) },
            ].map(({ label, value }) => (
              <div key={label} className="p-4 rounded-xl border bg-card flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="font-semibold text-sm">{value}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {stock.longBusinessSummary || "No description available for this stock."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <OrderDialog
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        symbol={symbol}
        stockName={stock.shortName}
        currentPrice={stock.regularMarketPrice}
        dividendYield={stock.dividendYield}
        dividendRate={stock.dividendRate}
      />
    </div>
  );
}
