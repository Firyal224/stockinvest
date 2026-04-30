"use client";

import { useEffect, useState } from "react";
import { Brain, Loader2, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Analysis {
  score: number;
  recommendation: "buy" | "hold" | "sell";
  summary: string;
  warnings: string[];
}

const recConfig = {
  buy: { icon: TrendingUp, color: "text-emerald-500", badge: "success" as const, label: "BUY" },
  hold: { icon: Minus, color: "text-amber-500", badge: "warning" as const, label: "HOLD" },
  sell: { icon: TrendingDown, color: "text-rose-500", badge: "danger" as const, label: "SELL" },
};

export function AIAnalysisCard({ symbol }: { symbol: string }) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  async function fetchAnalysis() {
    setLoading(true);
    try {
      const r = await fetch(`/api/ai/analyze?symbol=${encodeURIComponent(symbol)}`);
      const d = await r.json();
      setAnalysis(d.analysis);
      setFetched(true);
    } catch {
      setFetched(true);
    } finally {
      setLoading(false);
    }
  }

  const rec = analysis ? recConfig[analysis.recommendation] : null;
  const scoreColor = analysis
    ? analysis.score >= 70 ? "#10b981" : analysis.score >= 40 ? "#f59e0b" : "#ef4444"
    : "#6b7280";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          AI Stock Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!fetched && !loading ? (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            <p className="text-sm text-muted-foreground mb-4">
              AI analyzes financial reports, PE ratio, growth, and risk to score this stock.
            </p>
            <Button onClick={fetchAnalysis} className="gradient-brand border-0 gap-2">
              <Brain className="w-4 h-4" />Analyze with AI
            </Button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">AI is analyzing {symbol}…</p>
            </div>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            {/* Score & Recommendation */}
            <div className="flex items-center gap-6 p-5 rounded-xl border bg-muted/30">
              <div className="text-center shrink-0">
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke={scoreColor} strokeWidth="2.5"
                      strokeDasharray={`${analysis.score} ${100 - analysis.score}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-black">{analysis.score}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">AI Score</p>
              </div>
              <div className="flex-1">
                {rec && (
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={rec.badge} className="text-sm px-3 py-1 font-bold">
                      <rec.icon className="w-4 h-4 mr-1.5" />
                      {rec.label}
                    </Badge>
                  </div>
                )}
                <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
              </div>
            </div>

            {/* Score bar */}
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Weak (0)</span>
                <span>Investment Quality Score</span>
                <span>Strong (100)</span>
              </div>
              <Progress value={analysis.score} className="h-2"
                style={{ "--tw-bg-opacity": "1" } as React.CSSProperties} />
            </div>

            {/* Warnings */}
            {analysis.warnings.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Key Risks
                </p>
                {analysis.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">{w}</p>
                  </div>
                ))}
              </div>
            )}

            <Button variant="outline" size="sm" onClick={fetchAnalysis} className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />Refreshing…</> : "Refresh Analysis"}
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">Analysis unavailable. Please try again.</p>
            <Button variant="outline" size="sm" onClick={fetchAnalysis} className="mt-3" disabled={loading}>
              {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />Retrying…</> : "Retry"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
