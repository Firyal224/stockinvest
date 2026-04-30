"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Brain, TrendingDown, AlertTriangle, CheckCircle,
  Loader2, RefreshCw, Lightbulb, Target, BarChart3, Zap,
  ArrowUp, ArrowDown, Minus, Star,
} from "lucide-react";
import { cn, formatIDR } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScenarioResult {
  scenarioSummary: string;
  totalImpact: { amount: number; percent: number };
  stockImpacts: { symbol: string; estimatedLoss: number; estimatedLossPercent: number; reason: string }[];
  hedgingStrategies: string[];
  overallAssessment: string;
}

interface CoachingPattern {
  type: "fomo" | "panic_sell" | "over_concentration" | "positive";
  title: string;
  description: string;
  affected: string[];
}

interface CoachingResult {
  patterns: CoachingPattern[];
  tips: string[];
  overallScore: number;
  overallFeedback: string;
}

interface WeeklyReport {
  weekSummary: string;
  pnlSummary: { totalValue: number; totalInvested: number; netPnl: number; netPnlPct: number };
  topPerformer: { symbol: string; pnlPct: number };
  worstPerformer: { symbol: string; pnlPct: number };
  coachingNotes: string;
  goalProgress: { name: string; progressPct: number; status: string }[];
  recommendations: { symbol: string; action: string; reason: string }[];
  createdAt?: string;
}

interface ScreenerStock {
  symbol: string;
  reason: string;
  type: "buy" | "watch";
  highlight: string;
  quote: {
    regularMarketPrice: number;
    regularMarketChangePercent: number;
    trailingPE: number | null;
    fiftyTwoWeekLow: number;
    fiftyTwoWeekHigh: number;
  } | null;
}

// ─── Pattern icon/color helpers ───────────────────────────────────────────────

function patternStyle(type: CoachingPattern["type"]) {
  switch (type) {
    case "fomo":               return { color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30",   icon: Zap };
    case "panic_sell":         return { color: "text-rose-600 dark:text-rose-400",     bg: "bg-rose-500/10 border-rose-500/30",     icon: TrendingDown };
    case "over_concentration": return { color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", icon: AlertTriangle };
    case "positive":           return { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: CheckCircle };
  }
}

// ─── Scenario Planner ─────────────────────────────────────────────────────────

function ScenarioPlanner() {
  const [scenario, setScenario] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [error, setError] = useState("");
  const [rewrittenScenario, setRewrittenScenario] = useState<string | null>(null);

  const examples = [
    "What if IHSG drops 20% in a market crash?",
    "What if the rupiah weakens 15% against USD?",
    "What if Bank Indonesia raises interest rates by 100bps?",
    "What if global commodity prices fall 30%?",
  ];

  async function analyze() {
    if (!scenario.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setRewrittenScenario(null);
    try {
      const res = await fetch("/api/ai/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      setResult(data.analysis);
      setPortfolioValue(data.portfolioValue);
      setRewrittenScenario(data.rewrittenScenario || null);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Describe a Market Scenario</CardTitle>
          <CardDescription>Ask how a market event would impact your current portfolio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="e.g. What if IHSG drops 20% due to a global recession?"
            value={scenario}
            onChange={(e) => { setScenario(e.target.value); setRewrittenScenario(null); }}
            rows={3}
            className="resize-none"
          />
          <div className="flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button key={ex} onClick={() => setScenario(ex)}
                className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
                {ex}
              </button>
            ))}
          </div>
          <Button onClick={analyze} disabled={loading || !scenario.trim()} className="w-full">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Analyzing...</>
              : <><Brain className="w-4 h-4 mr-2" />Analyze Scenario</>}
          </Button>

          {/* Notif rewrite */}
          {rewrittenScenario && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Pertanyaan kamu dikonversi ke scenario:</p>
                <p className="text-amber-700 dark:text-amber-300 font-medium italic">&ldquo;{rewrittenScenario}&rdquo;</p>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Summary */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-5 space-y-3">
              <p className="text-sm font-medium">{result.scenarioSummary}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <p className="text-xs text-muted-foreground">Estimated Impact</p>
                  <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
                    {result.totalImpact.percent > 0 ? "-" : ""}{Math.abs(result.totalImpact.percent).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">{formatIDR(Math.abs(result.totalImpact.amount))}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground">Portfolio Value</p>
                  <p className="text-xl font-bold">{formatIDR(portfolioValue)}</p>
                  <p className="text-xs text-muted-foreground">current value</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{result.overallAssessment}</p>
            </CardContent>
          </Card>

          {/* Per-stock impact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Impact Per Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.stockImpacts.map((s) => (
                  <div key={s.symbol} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{s.symbol.replace(".JK", "")}</span>
                        <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                          -{Math.abs(s.estimatedLossPercent).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{s.reason}</p>
                    </div>
                    <span className="text-sm font-medium text-rose-600 dark:text-rose-400 shrink-0">
                      -{formatIDR(Math.abs(s.estimatedLoss))}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hedging strategies */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Hedging Strategies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.hedgingStrategies.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Coaching Report ──────────────────────────────────────────────────────────

function CoachingReport() {
  const [loading, setLoading] = useState(true);
  const [coaching, setCoaching] = useState<CoachingResult | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/coaching");
      const data = await res.json();
      if (data.coaching) setCoaching(data.coaching);
      else setMessage(data.message || "No data");
    } catch {
      setMessage("Failed to load coaching report.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span>Analyzing your trading behavior...</span>
    </div>
  );

  if (!coaching) return (
    <Card className="text-center py-16">
      <CardContent>
        <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-40" />
        <p className="text-muted-foreground">{message || "No orders to analyze yet."}</p>
        <p className="text-sm text-muted-foreground mt-1">Make some trades first, then come back!</p>
      </CardContent>
    </Card>
  );

  const scoreColor = coaching.overallScore >= 70 ? "text-emerald-600 dark:text-emerald-400"
    : coaching.overallScore >= 40 ? "text-amber-600 dark:text-amber-400"
    : "text-rose-600 dark:text-rose-400";

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/30" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - coaching.overallScore / 100)}`}
                  strokeLinecap="round"
                  className={scoreColor}
                />
              </svg>
              <span className={cn("absolute inset-0 flex items-center justify-center text-lg font-black", scoreColor)}>
                {coaching.overallScore}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-semibold mb-1">Discipline Score</p>
              <p className="text-sm text-muted-foreground">{coaching.overallFeedback}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {coaching.patterns.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Detected Patterns</h3>
          {coaching.patterns.map((p, i) => {
            const { color, bg, icon: Icon } = patternStyle(p.type);
            return (
              <div key={i} className={cn("p-4 rounded-xl border", bg)}>
                <div className="flex items-start gap-3">
                  <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={cn("font-semibold text-sm", color)}>{p.title}</span>
                      {p.affected.map((sym) => (
                        <Badge key={sym} variant="secondary" className="text-xs">{sym.replace(".JK", "")}</Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Actionable Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5">
            {coaching.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Button variant="outline" size="sm" onClick={load} className="w-full">
        <RefreshCw className="w-4 h-4 mr-2" />Refresh Analysis
      </Button>
    </div>
  );
}

// ─── Weekly Report ────────────────────────────────────────────────────────────

function WeeklyReportTab() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<WeeklyReport | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/weekly");
      const data = await res.json();
      setReport(data.report || null);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadReport(); }, [loadReport]);

  async function generateReport() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/weekly", { method: "POST" });
      const data = await res.json();
      if (data.report) setReport(data.report);
    } catch { /* silent */ }
    finally { setGenerating(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span>Loading report...</span>
    </div>
  );

  if (!report) return (
    <Card className="text-center py-16">
      <CardContent className="space-y-4">
        <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground opacity-40" />
        <div>
          <p className="font-medium">No weekly report yet</p>
          <p className="text-sm text-muted-foreground mt-1">Generate your first weekly performance report</p>
        </div>
        <Button onClick={generateReport} disabled={generating}>
          {generating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</> : <><Brain className="w-4 h-4 mr-2" />Generate Report</>}
        </Button>
      </CardContent>
    </Card>
  );

  const pnl = report.pnlSummary;
  const isPnlPositive = pnl && pnl.netPnl >= 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Weekly Report</h3>
          {report.createdAt && (
            <p className="text-xs text-muted-foreground">
              Generated {new Date(report.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={generateReport} disabled={generating}>
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-5">
          <p className="text-sm text-muted-foreground mb-4">{report.weekSummary}</p>
          {pnl && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Portfolio Value</p>
                <p className="font-bold text-sm">{formatIDR(pnl.totalValue)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Net PnL</p>
                <p className={cn("font-bold text-sm", isPnlPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                  {isPnlPositive ? "+" : ""}{formatIDR(pnl.netPnl)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Return</p>
                <p className={cn("font-bold text-sm", isPnlPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                  {isPnlPositive ? "+" : ""}{pnl.netPnlPct?.toFixed(2)}%
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {report.topPerformer && (
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowUp className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs text-muted-foreground">Top Performer</span>
              </div>
              <p className="font-bold">{report.topPerformer.symbol?.replace(".JK", "")}</p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                +{report.topPerformer.pnlPct?.toFixed(2)}%
              </p>
            </CardContent>
          </Card>
        )}
        {report.worstPerformer && (
          <Card className="bg-rose-500/5 border-rose-500/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowDown className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-xs text-muted-foreground">Worst Performer</span>
              </div>
              <p className="font-bold">{report.worstPerformer.symbol?.replace(".JK", "")}</p>
              <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">
                {report.worstPerformer.pnlPct?.toFixed(2)}%
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {report.coachingNotes && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-2">
              <Brain className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Behavioral Coaching</p>
                <p className="text-sm">{report.coachingNotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {report.goalProgress && report.goalProgress.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4" />Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.goalProgress.filter((g) => g.name).map((g, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium truncate">{g.name}</span>
                  <Badge variant={g.status === "ahead" ? "default" : g.status === "on_track" ? "secondary" : "destructive"}
                    className="text-xs ml-2 shrink-0">
                    {g.status === "ahead" ? "Ahead" : g.status === "on_track" ? "On Track" : "Behind"}
                  </Badge>
                </div>
                <Progress value={Math.min(100, g.progressPct)} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{g.progressPct?.toFixed(0)}% complete</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {report.recommendations && report.recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Next Week Picks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.recommendations.map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <Badge variant={r.action === "buy" ? "default" : r.action === "watch" ? "secondary" : "outline"}
                  className="text-xs w-12 justify-center shrink-0">
                  {r.action}
                </Badge>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm">{r.symbol?.replace(".JK", "")} </span>
                  <span className="text-xs text-muted-foreground">{r.reason}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── AI Stock Screener ────────────────────────────────────────────────────────

function StockScreener() {
  const [loading, setLoading] = useState(true);
  const [stocks, setStocks] = useState<ScreenerStock[]>([]);
  const [cached, setCached] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/screener");
      const data = await res.json();
      setStocks(data.stocks || []);
      setCached(data.cached || false);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span>Screening top stocks today...</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Today&apos;s AI Picks</h3>
          <p className="text-xs text-muted-foreground">{cached ? "Cached — refreshed daily" : "Fresh as of today"}</p>
        </div>
        <Button size="sm" variant="outline" onClick={load}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {stocks.map((s, i) => {
        const change = s.quote?.regularMarketChangePercent ?? 0;
        const isUp = change >= 0;
        return (
          <Card key={s.symbol} className="hover:border-primary/40 transition-colors">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary text-sm">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold">{s.symbol.replace(".JK", "")}</span>
                    <Badge variant={s.type === "buy" ? "default" : "secondary"} className="text-xs">{s.type}</Badge>
                    <Badge variant="outline" className="text-xs">{s.highlight}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{s.reason}</p>
                  {s.quote && (
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-semibold">Rp {s.quote.regularMarketPrice.toLocaleString("id-ID")}</span>
                      <span className={cn("flex items-center gap-0.5 text-xs font-medium", isUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                        {isUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {Math.abs(change).toFixed(2)}%
                      </span>
                      {s.quote.trailingPE && (
                        <span className="text-xs text-muted-foreground">PE: {s.quote.trailingPE.toFixed(1)}x</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {!stocks.length && (
        <Card className="text-center py-12">
          <CardContent>
            <Minus className="w-8 h-8 mx-auto text-muted-foreground opacity-30 mb-2" />
            <p className="text-muted-foreground text-sm">No stocks screened yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AIMentorPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          AI Mentor
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          AI-powered insights, scenario planning, and behavioral coaching for your portfolio.
        </p>
      </div>

      <Tabs defaultValue="scenario">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="scenario" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Scenario</span>
            <span className="sm:hidden">Plan</span>
          </TabsTrigger>
          <TabsTrigger value="coaching" className="text-xs sm:text-sm">Coach</TabsTrigger>
          <TabsTrigger value="weekly" className="text-xs sm:text-sm">Weekly</TabsTrigger>
          <TabsTrigger value="screener" className="text-xs sm:text-sm">Screen</TabsTrigger>
        </TabsList>

        <TabsContent value="scenario" className="mt-6">
          <ScenarioPlanner />
        </TabsContent>
        <TabsContent value="coaching" className="mt-6">
          <CoachingReport />
        </TabsContent>
        <TabsContent value="weekly" className="mt-6">
          <WeeklyReportTab />
        </TabsContent>
        <TabsContent value="screener" className="mt-6">
          <StockScreener />
        </TabsContent>
      </Tabs>
    </div>
  );
}