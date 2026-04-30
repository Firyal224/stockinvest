"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Wallet, Plus, BarChart3, Loader2, ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PriceChart } from "@/components/dashboard/stock-detail/price-chart";
import { cn, formatIDR, formatIDRCompact, formatPercent, getPnLBg } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface Holding {
  id: string;
  symbol: string;
  stockName: string;
  lots: number;
  avgBuyPrice: number;
  totalInvested: number;
  currentPrice: number;
  currentValue: number;
  pnl: number;
  pnlPct: number;
  changePercent: number;
}

interface PortfolioData {
  holdings: Holding[];
  totalValue: number;
  totalInvested: number;
  pnl: number;
  pnlPct: number;
  virtualBalance: number;
  transactions: unknown[];
}

interface TopupRecord {
  id: string;
  amount: number;
  note: string | null;
  createdAt: string;
}

const TOPUP_OPTIONS = [1_000_000, 5_000_000, 10_000_000, 50_000_000, 100_000_000];

export default function PortfolioPage() {
  const { toast } = useToast();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState(10_000_000);
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupHistory, setTopupHistory] = useState<TopupRecord[]>([]);

  async function fetchPortfolio() {
    try {
      const r = await fetch("/api/portfolio");
      const d = await r.json();
      setData(d);
    } catch {}
  }

  async function fetchTopupHistory() {
    try {
      const r = await fetch("/api/topup");
      const d = await r.json();
      setTopupHistory(d.history || []);
    } catch {}
  }

  useEffect(() => {
    Promise.all([fetchPortfolio(), fetchTopupHistory()]).finally(() => setLoading(false));
  }, []);

  async function handleTopup() {
    setTopupLoading(true);
    try {
      const r = await fetch("/api/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: topupAmount, note: `Top up` }),
      });
      const d = await r.json();
      if (r.ok) {
        toast({ title: "Virtual top-up successful!", description: `Added ${formatIDR(topupAmount)} to your balance.` });
        setTopupOpen(false);
        fetchPortfolio();
        fetchTopupHistory();
      } else {
        toast({ title: "Error", description: d.error, variant: "destructive" });
      }
    } finally {
      setTopupLoading(false);
    }
  }

  if (loading) return <div className="p-6 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;

  const totalPortfolio = (data?.totalValue || 0) + (data?.virtualBalance || 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Portfolio</h1>
          <p className="text-muted-foreground text-sm mt-1">Shadow portfolio performance & holdings</p>
        </div>
        <Button onClick={() => setTopupOpen(true)} className="gradient-brand border-0 gap-2">
          <Plus className="w-4 h-4" /> Top Up Virtual Balance
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Virtual Balance</span>
            </div>
            <p className="text-2xl font-black">{formatIDRCompact(data?.virtualBalance || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Cash available</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-accent" />
              </div>
              <span className="text-sm text-muted-foreground">Portfolio Value</span>
            </div>
            <p className="text-2xl font-black">{formatIDRCompact(data?.totalValue || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">{data?.holdings.length || 0} stocks</p>
          </CardContent>
        </Card>

        <Card className={data?.pnl && data.pnl > 0 ? "border-emerald-500/20" : "border-rose-500/20"}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", data?.pnl && data.pnl >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10")}>
                {data?.pnl && data.pnl >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-500" /> : <TrendingDown className="w-5 h-5 text-rose-500" />}
              </div>
              <span className="text-sm text-muted-foreground">Unrealized P&L</span>
            </div>
            <p className={cn("text-2xl font-black", data?.pnl && data.pnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
              {data?.pnl ? (data.pnl >= 0 ? "+" : "") + formatIDRCompact(data.pnl) : "Rp 0"}
            </p>
            <p className={cn("text-xs mt-1", data?.pnl && data.pnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
              {data?.pnlPct ? formatPercent(data.pnlPct) : "0.00%"} total return
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                <Wallet className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Total Assets</span>
            </div>
            <p className="text-2xl font-black">{formatIDRCompact(totalPortfolio)}</p>
            <p className="text-xs text-muted-foreground mt-1">Balance + Portfolio</p>
          </CardContent>
        </Card>
      </div>

      {/* Holdings table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Holdings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!data?.holdings.length ? (
            <div className="text-center py-16 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium mb-2">No holdings yet</p>
              <p className="text-sm mb-4">Browse the market board and make your first shadow trade.</p>
              <Link href="/dashboard">
                <Button className="gradient-brand border-0">Explore Market</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Lots</TableHead>
                  <TableHead className="text-right">Avg Buy</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">P&L</TableHead>
                  <TableHead className="text-right">Return</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.holdings.map((h) => (
                  <TableRow key={h.id} className="cursor-pointer hover:bg-muted/30">
                    <TableCell>
                      <Link href={`/stock/${encodeURIComponent(h.symbol)}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{h.symbol.replace(".JK", "").slice(0, 2)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-sm hover:text-primary">{h.symbol.replace(".JK", "")}</p>
                          <p className="text-xs text-muted-foreground">{h.stockName}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-medium">{h.lots}</TableCell>
                    <TableCell className="text-right text-sm">{h.avgBuyPrice.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      <div>
                        {h.currentPrice.toLocaleString("id-ID")}
                        <div className={cn("text-xs", h.changePercent >= 0 ? "text-emerald-500" : "text-rose-500")}>
                          {h.changePercent >= 0 ? "+" : ""}{h.changePercent.toFixed(2)}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold">{formatIDRCompact(h.currentValue)}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn("text-sm font-semibold", h.pnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
                        {h.pnl >= 0 ? "+" : ""}{formatIDRCompact(h.pnl)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={h.pnlPct >= 0 ? "success" : "danger"}>
                        {formatPercent(h.pnlPct)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Top-up History */}
      {topupHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowDownToLine className="w-4 h-4 text-primary" />
              Riwayat Top Up
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-y-auto max-h-[280px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topupHistory.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </TableCell>
                      <TableCell className="text-sm">{t.note || "—"}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">
                        +{formatIDR(t.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="px-4 py-3 border-t bg-muted/30 flex justify-between items-center">
              <span className="text-xs text-muted-foreground">{topupHistory.length} transaksi</span>
              <span className="text-sm font-bold text-primary">
                Total: {formatIDR(topupHistory.reduce((s, t) => s + t.amount, 0))}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top-up Dialog */}
      <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Virtual Top-Up</DialogTitle>
            <DialogDescription>Add virtual money to practice more trades. No real money involved.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TOPUP_OPTIONS.map((opt) => (
                <button key={opt} onClick={() => setTopupAmount(opt)}
                  className={cn("p-3 rounded-xl border text-sm font-semibold transition-colors",
                    topupAmount === opt ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50")}>
                  {formatIDRCompact(opt)}
                </button>
              ))}
            </div>
            <div className="p-4 rounded-xl bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground mb-1">Adding to balance</p>
              <p className="text-2xl font-black text-primary">{formatIDR(topupAmount)}</p>
            </div>
            <Button className="w-full gradient-brand border-0 h-11" onClick={handleTopup} disabled={topupLoading}>
              {topupLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Processing…</> : `Top Up ${formatIDR(topupAmount)}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
