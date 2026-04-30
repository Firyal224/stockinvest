"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, ChevronRight, ChevronLeft, Loader2, Shield, TrendingDown, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const QUESTIONS = [
  {
    key: "investment_experience",
    question: "How long have you been investing in stocks?",
    options: [
      { value: "never", label: "Never invested before" },
      { value: "less_1y", label: "Less than 1 year" },
      { value: "1_3y", label: "1 – 3 years" },
      { value: "more_3y", label: "More than 3 years" },
    ],
  },
  {
    key: "loss_tolerance",
    question: "If your portfolio dropped 20% in a month, what would you do?",
    options: [
      { value: "sell_all", label: "Sell everything immediately" },
      { value: "sell_some", label: "Sell some to limit losses" },
      { value: "hold", label: "Hold and wait for recovery" },
      { value: "buy_more", label: "Buy more — great opportunity!" },
    ],
  },
  {
    key: "investment_goal",
    question: "What is your primary investment goal?",
    options: [
      { value: "preserve", label: "Preserve capital, minimal risk" },
      { value: "stable_income", label: "Stable income via dividends" },
      { value: "growth", label: "Long-term wealth growth" },
      { value: "fast_growth", label: "Maximize returns quickly" },
    ],
  },
  {
    key: "time_horizon",
    question: "How long do you plan to keep your investments?",
    options: [
      { value: "less_1y", label: "Less than 1 year" },
      { value: "1_3y", label: "1 – 3 years" },
      { value: "3_5y", label: "3 – 5 years" },
      { value: "more_5y", label: "More than 5 years" },
    ],
  },
];

const CAPITAL_OPTIONS = [
  { label: "Rp 1,000,000", value: 1_000_000 },
  { label: "Rp 5,000,000", value: 5_000_000 },
  { label: "Rp 10,000,000", value: 10_000_000 },
  { label: "Rp 50,000,000", value: 50_000_000 },
  { label: "Rp 100,000,000", value: 100_000_000 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0); // 0 = capital, 1-4 = questions, 5 = result
  const [loading, setLoading] = useState(false);
  const [capital, setCapital] = useState(10_000_000);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ profile: string; explanation: string } | null>(null);

  const totalSteps = QUESTIONS.length + 1; // +1 for capital step
  const progress = ((step) / totalSteps) * 100;

  async function handleFinish() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, initialCapital: capital }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setStep(totalSteps);
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const profileIcons: Record<string, React.ReactNode> = {
    conservative: <Shield className="w-10 h-10 text-blue-500" />,
    moderate: <TrendingUp className="w-10 h-10 text-amber-500" />,
    aggressive: <Zap className="w-10 h-10 text-rose-500" />,
  };

  const profileColors: Record<string, string> = {
    conservative: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
    moderate: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
    aggressive: "from-rose-500/20 to-pink-500/20 border-rose-500/30",
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0d9488, #7c3aed)" }}>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">StockInvest</span>
          </div>
          {step < totalSteps && (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Risk Profile Assessment</h1>
              <p className="text-white/50 text-sm">Help us personalize your investment experience</p>
              <div className="mt-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #0d9488, #7c3aed)" }} />
              </div>
              <p className="text-xs text-white/30 mt-2">Step {step + 1} of {totalSteps + 1}</p>
            </>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          {/* Step 0: Capital */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Set Your Virtual Capital</h2>
                <p className="text-white/50 text-sm">Choose how much virtual money you want to start with. This is fake money — no real risk!</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {CAPITAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setCapital(opt.value)}
                    className={`p-4 rounded-xl border text-left transition-all ${capital === opt.value
                      ? "border-teal-500 bg-teal-500/10 text-white"
                      : "border-white/10 text-white/60 hover:border-white/30 hover:text-white/80"
                    }`}
                  >
                    <span className="font-semibold">{opt.label}</span>
                    {opt.value === 10_000_000 && <span className="ml-2 text-xs text-teal-400">Recommended</span>}
                  </button>
                ))}
              </div>
              <Button onClick={() => setStep(1)} className="w-full gradient-brand border-0 h-11">
                Continue <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Questions */}
          {step >= 1 && step <= QUESTIONS.length && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  {QUESTIONS[step - 1].question}
                </h2>
              </div>
              <div className="space-y-3">
                {QUESTIONS[step - 1].options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAnswers((prev) => ({ ...prev, [QUESTIONS[step - 1].key]: opt.value }))}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${answers[QUESTIONS[step - 1].key] === opt.value
                      ? "border-purple-500 bg-purple-500/10 text-white"
                      : "border-white/10 text-white/60 hover:border-white/30 hover:text-white/80"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(step - 1)} className="border-white/20 text-white hover:bg-white/10">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  className="flex-1 gradient-brand border-0 h-11"
                  disabled={!answers[QUESTIONS[step - 1].key] || loading}
                  onClick={() => {
                    if (step < QUESTIONS.length) setStep(step + 1);
                    else handleFinish();
                  }}
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : step < QUESTIONS.length ? "Next Question" : "Analyze My Profile"}
                  {!loading && <ChevronRight className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Result */}
          {step === totalSteps && result && (
            <div className="space-y-6 text-center">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Your Risk Profile</h2>
                <p className="text-white/50 text-sm">AI has analyzed your responses</p>
              </div>
              <div className={`p-6 rounded-2xl border bg-gradient-to-br ${profileColors[result.profile] || "from-teal-500/20 to-purple-500/20 border-teal-500/30"}`}>
                <div className="flex justify-center mb-4">{profileIcons[result.profile]}</div>
                <h3 className="text-3xl font-black text-white capitalize mb-3">{result.profile}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{result.explanation}</p>
              </div>
              <div className="text-left p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm text-white/50 mb-2">Your virtual capital</p>
                <p className="text-2xl font-bold text-white">Rp {capital.toLocaleString("id-ID")}</p>
              </div>
              <Button
                className="w-full gradient-brand border-0 h-12 text-base font-semibold"
                onClick={() => { router.push("/dashboard"); router.refresh(); }}
              >
                Go to Dashboard <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
