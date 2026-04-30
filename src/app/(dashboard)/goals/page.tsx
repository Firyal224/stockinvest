"use client";

import { useEffect, useState } from "react";
import { Target, Plus, Loader2, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatIDR, formatIDRCompact, GOAL_CATEGORIES } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Goal {
  id: string;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  deadline: number;
  allocatedBalance: number;
  status: string;
  aiNote: string | null;
  stocks?: { symbol: string; allocationPct: number; aiReason: string | null }[];
}

export default function GoalsPage() {
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "", category: "nikah", targetAmount: 50_000_000,
    deadline: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
  });

  async function fetchGoals() {
    try {
      const r = await fetch("/api/goals");
      const d = await r.json();
      setGoals(d.goals || []);
    } catch {}
  }

  useEffect(() => { fetchGoals().finally(() => setLoading(false)); }, []);

  async function handleCreate() {
    if (!form.name || !form.targetAmount) {
      toast({ title: "Please fill all fields", variant: "destructive" }); return;
    }
    setCreating(true);
    try {
      const r = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (r.ok) {
        toast({ title: "Goal created!", description: d.aiNote });
        setCreateOpen(false);
        setForm({ name: "", category: "nikah", targetAmount: 50_000_000, deadline: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10) });
        setRefreshing(true);
        fetchGoals().finally(() => setRefreshing(false));
      } else {
        toast({ title: "Error", description: d.error, variant: "destructive" });
      }
    } finally {
      setCreating(false);
    }
  }

  const catIcon = (cat: string) => GOAL_CATEGORIES.find((c) => c.value === cat)?.icon || "🎯";
  const catLabel = (cat: string) => GOAL_CATEGORIES.find((c) => c.value === cat)?.label || cat;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Investment Goals</h1>
          <p className="text-muted-foreground text-sm mt-1">AI-powered goal-based portfolio allocation</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gradient-brand border-0 gap-2" disabled={refreshing}>
          {refreshing ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</> : <><Plus className="w-4 h-4" /> New Goal</>}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : !goals.length ? (
        <div className="text-center py-20">
          <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Set a financial goal and AI will recommend stocks tailored to your timeline and risk profile.
          </p>
          <Button onClick={() => setCreateOpen(true)} className="gradient-brand border-0 gap-2">
            <Plus className="w-4 h-4" /> Create First Goal
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const progress = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
            const deadline = new Date(goal.deadline);
            const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / 86400000);
            const isCompleted = goal.status === "completed" || progress >= 100;

            return (
              <Card key={goal.id} className={cn("overflow-hidden", isCompleted && "border-emerald-500/30")}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{catIcon(goal.category)}</span>
                      <div>
                        <CardTitle className="text-base">{goal.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">{catLabel(goal.category)}</p>
                      </div>
                    </div>
                    <Badge variant={isCompleted ? "success" : daysLeft < 30 ? "danger" : "info"}>
                      {isCompleted ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Calendar className="w-3 h-3 mr-1" />}
                      {isCompleted ? "Completed" : `${daysLeft}d left`}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2.5" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{formatIDRCompact(goal.currentAmount)}</span>
                      <span>{formatIDRCompact(goal.targetAmount)}</span>
                    </div>
                  </div>

                  {/* Deadline info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-0.5">Target</p>
                      <p className="font-semibold">{formatIDR(goal.targetAmount)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-0.5">Deadline</p>
                      <p className="font-semibold">{deadline.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                  </div>

                  {/* AI Note */}
                  {goal.aiNote && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex gap-2">
                      <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">{goal.aiNote}</p>
                    </div>
                  )}

                  {/* AI Stock Allocations */}
                  {goal.stocks && goal.stocks.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">AI Recommended Stocks</p>
                      <div className="space-y-2">
                        {goal.stocks.map((s) => (
                          <div key={s.symbol} className="flex items-center gap-3 p-2.5 rounded-lg border">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary">{s.symbol.replace(".JK", "").slice(0, 2)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{s.symbol.replace(".JK", "")}</p>
                              <p className="text-xs text-muted-foreground truncate">{s.aiReason}</p>
                            </div>
                            <Badge variant="secondary" className="shrink-0">
                              {Math.round(s.allocationPct * 100)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Goal Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Investment Goal</DialogTitle>
            <DialogDescription>AI will recommend stocks tailored to your goal and timeline.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Goal Name</Label>
              <Input placeholder="e.g., Buy a House Down Payment"
                value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Goal Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GOAL_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Target Amount (IDR)</Label>
              <Input type="number" placeholder="50000000"
                value={form.targetAmount} onChange={(e) => setForm((f) => ({ ...f, targetAmount: Number(e.target.value) }))} />
              <p className="text-xs text-muted-foreground">{formatIDR(form.targetAmount)}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Target Date</Label>
              <Input type="date" value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
            </div>
            <Button className="w-full gradient-brand border-0 h-11" onClick={handleCreate} disabled={creating}>
              {creating ? <><Loader2 className="w-4 h-4 animate-spin" />Creating with AI…</> : "Create Goal & Get AI Allocation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
