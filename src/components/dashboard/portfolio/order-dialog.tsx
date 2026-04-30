"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertTriangle, Loader2, TrendingUp, TrendingDown,
  Target, Coins, Brain, ArrowUpRight, ShieldAlert, RefreshCw,
} from "lucide-react";
import { cn, formatIDR } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Goal { id: string; name: string; category: string; status: string }
interface SellPrediction {
  targetPrice: number;
  timeframe: string;
  confidence: "low" | "medium" | "high";
  reasoning: string;
  stopLoss: number;
}

interface OrderDialogProps {
  open: boolean;
  onClose: () => void;
  symbol: string;
  stockName: string;
  currentPrice: number;
  dividendYield?: number | null;
  dividendRate?: number | null;
}

const CONFIDENCE_COLOR = {
  low: "text-rose-500",
  medium: "text-amber-500",
  high: "text-emerald-600",
};

export function OrderDialog({ open, onClose, symbol, stockName, currentPrice, dividendYield, dividendRate }: OrderDialogProps) {
  const { toast } = useToast();
  const [type, setType] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [lots, setLots] = useState(1);
  const [limitPrice, setLimitPrice] = useState(currentPrice);
  const [goalId, setGoalId] = useState<string>("none");
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);

  // AI sell prediction state
  const [prediction, setPrediction] = useState<SellPrediction | null>(null);
  const [predLoading, setPredLoading] = useState(false);

  const price = orderType === "market" ? currentPrice : limitPrice;
  const totalValue = price * lots * 100;

  // Dividend estimate (annual)
  // Prefer dividendRate (IDR/share/year) over yield × price — more accurate for IDX stocks
  const annualDividendPerShare = (dividendRate ?? 0) > 0
    ? dividendRate!
    : (dividendYield ?? 0) > 0 ? currentPrice * dividendYield! : 0;
  const annualDividendTotal = annualDividendPerShare * lots * 100;
  const hasDividend = annualDividendPerShare > 0;

  useEffect(() => {
    if (!open) return;
    fetch("/api/goals")
      .then((r) => r.json())
      .then((d) => setGoals((d.goals || []).filter((g: Goal) => g.status === "active")))
      .catch(() => {});
  }, [open]);

  // Auto-fetch sell prediction whenever buy dialog opens
  useEffect(() => {
    if (open && type === "buy") {
      setPrediction(null);
      fetchPrediction();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type]);

  async function fetchPrediction() {
    setPredLoading(true);
    setPrediction(null);
    try {
      const res = await fetch("/api/ai/sell-prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, lots, avgBuyPrice: price }),
      });
      const data = await res.json();
      if (data.prediction) setPrediction(data.prediction);
    } catch { /* silent */ }
    finally { setPredLoading(false); }
  }

  async function handleSubmit() {
    setLoading(true);
    setWarning(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          type,
          orderType,
          lots,
          limitPrice: orderType === "limit" ? limitPrice : undefined,
          goalId: goalId && goalId !== "none" ? goalId : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Order failed", description: data.error, variant: "destructive" });
        return;
      }
      if (data.aiWarning) setWarning(data.aiWarning);

      toast({
        title: `${type === "buy" ? "Bought" : "Sold"} ${lots} lot(s) of ${symbol.replace(".JK", "")}`,
        description: `Total: ${formatIDR(data.totalValue)} at Rp ${data.pricePerShare.toLocaleString("id-ID")}/share`,
      });
      onClose();
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Shadow Trade — {symbol.replace(".JK", "")}
            <Badge variant="secondary" className="font-normal text-xs">{stockName}</Badge>
          </DialogTitle>
          <DialogDescription>Practice with virtual money. No real money involved.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Buy / Sell toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
            {(["buy", "sell"] as const).map((t) => (
              <button key={t} onClick={() => setType(t)} disabled={loading}
                className={cn(
                  "py-2.5 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                  type === t
                    ? t === "buy" ? "bg-emerald-500 text-white shadow-sm" : "bg-rose-500 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}>
                {t === "buy" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Order type */}
          <div className="grid grid-cols-2 gap-2">
            {(["market", "limit"] as const).map((ot) => (
              <button key={ot} onClick={() => setOrderType(ot)} disabled={loading}
                className={cn("py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                  orderType === ot ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent")}>
                {ot.charAt(0).toUpperCase() + ot.slice(1)} Order
              </button>
            ))}
          </div>

          {/* Price info */}
          <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Price</span>
            <span className="font-bold">Rp {currentPrice.toLocaleString("id-ID")}</span>
          </div>

          {/* Limit price */}
          {orderType === "limit" && (
            <div className="space-y-1.5">
              <Label>Limit Price (IDR per share)</Label>
              <Input type="number" value={limitPrice} onChange={(e) => setLimitPrice(Number(e.target.value))} min={1} disabled={loading} />
            </div>
          )}

          {/* Lots */}
          <div className="space-y-1.5">
            <Label>Number of Lots (1 lot = 100 shares)</Label>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={() => setLots(Math.max(1, lots - 1))} disabled={loading}>−</Button>
              <Input type="number" value={lots}
                onChange={(e) => setLots(Math.max(1, parseInt(e.target.value) || 1))}
                className="text-center font-bold text-lg" min={1} disabled={loading} />
              <Button variant="outline" size="icon" onClick={() => setLots(lots + 1)} disabled={loading}>+</Button>
            </div>
          </div>

          {/* Goal selector (optional, buy only) */}
          {type === "buy" && goals.length > 0 && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-muted-foreground" />
                Attach to Goal <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Select value={goalId} onValueChange={setGoalId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="No goal selected" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No goal</SelectItem>
                  {goals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                      <span className="text-muted-foreground ml-1 text-xs capitalize">({g.category})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Total */}
          <div className="p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Transaction Value</span>
              <span className="text-xl font-black text-primary">{formatIDR(totalValue)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{lots} lot × 100 shares × Rp {price.toLocaleString("id-ID")}</p>
          </div>

          {/* === BUY EXTRAS === */}
          {type === "buy" && (
            <>
              {/* Dividend estimate */}
              {hasDividend && (
                <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <Coins className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-semibold">Estimasi Dividen</span>
                    {(dividendYield ?? 0) > 0 && (
                      <Badge className="ml-auto text-xs bg-amber-200 text-amber-800 hover:bg-amber-200">
                        {(dividendYield! * 100).toFixed(2)}% yield/yr
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Per Tahun ({lots} lot = {lots * 100} saham)</p>
                      <p className="font-bold text-amber-700 dark:text-amber-400">{formatIDR(Math.round(annualDividendTotal))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Per Kuartal (est.)</p>
                      <p className="font-bold text-amber-700 dark:text-amber-400">{formatIDR(Math.round(annualDividendTotal / 4))}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Per Bulan (est.)</p>
                      <p className="font-semibold text-amber-600 dark:text-amber-500">{formatIDR(Math.round(annualDividendTotal / 12))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Per Saham / Tahun</p>
                      <p className="font-semibold text-amber-600 dark:text-amber-500">Rp {Math.round(annualDividendPerShare).toLocaleString("id-ID")}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Berdasarkan dividen 12 bulan terakhir. Tidak dijamin sama setiap tahun.</p>
                </div>
              )}

              {/* AI Sell Prediction */}
              <div className="rounded-xl border border-violet-200 bg-violet-50/50 dark:bg-violet-500/10 dark:border-violet-500/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-violet-700 dark:text-violet-400">
                    <Brain className="w-4 h-4" />
                    <span className="text-sm font-semibold">AI Sell Prediction</span>
                  </div>
                  <Button size="sm" variant="outline"
                    className="h-7 w-7 p-0 border-violet-300 text-violet-700 hover:bg-violet-100"
                    onClick={fetchPrediction} disabled={predLoading}
                    title="Refresh prediction">
                    {predLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  </Button>
                </div>

                {!prediction && !predLoading && (
                  <p className="text-xs text-muted-foreground">
                    Tidak ada prediksi tersedia. Klik refresh untuk coba lagi.
                  </p>
                )}

                {predLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs py-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />Analyzing market conditions…
                  </div>
                )}

                {prediction && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/10">
                        <div className="flex items-center gap-1 mb-1">
                          <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Target Sell</span>
                        </div>
                        <p className="font-black text-emerald-700 dark:text-emerald-400">Rp {prediction.targetPrice.toLocaleString("id-ID")}</p>
                        <p className="text-xs text-muted-foreground">{prediction.timeframe}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-rose-100 dark:bg-rose-500/10">
                        <div className="flex items-center gap-1 mb-1">
                          <ShieldAlert className="w-3 h-3 text-rose-600" />
                          <span className="text-xs text-rose-700 dark:text-rose-400 font-medium">Stop Loss</span>
                        </div>
                        <p className="font-black text-rose-700 dark:text-rose-400">Rp {prediction.stopLoss.toLocaleString("id-ID")}</p>
                        <p className={cn("text-xs font-semibold capitalize", CONFIDENCE_COLOR[prediction.confidence])}>
                          {prediction.confidence} confidence
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{prediction.reasoning}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* AI Warning */}
          {warning && (
            <div className="flex gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-300">{warning}</p>
            </div>
          )}

          <Button
            className={cn("w-full h-11 font-semibold", type === "buy" ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-rose-500 hover:bg-rose-600 text-white")}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing...</>
              : `${type === "buy" ? "Buy" : "Sell"} ${lots} Lot(s) — ${formatIDR(totalValue)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
