import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";
import { TrendingUp, Star, Target, Trophy, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — vibrant warm gradient */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col">
        <div className="absolute inset-0" style={{
          background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 35%, #a855f7 70%, #6366f1 100%)"
        }} />
        {/* Decorative shapes */}
        <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-white/10" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white/10 translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/3 right-1/3 w-48 h-48 rounded-full bg-white/10" />
        {/* Dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:28px_28px]" />

        <div className="relative flex flex-col h-full p-12">
          <Link href="/" className="flex items-center gap-3 w-fit">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">StockInvest</span>
          </Link>

          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-10 mt-4">
              <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 rounded-full px-3 py-1.5 mb-6 text-sm text-white/90 backdrop-blur-sm">
                <Star className="w-3.5 h-3.5 text-white" />
                Free to join — no credit card
              </div>
              <h1 className="text-5xl font-black text-white mb-4 leading-tight">
                Start Your<br />
                <span className="text-white/80">Investment Journey</span>
              </h1>
              <p className="text-white/70 text-lg">
                Create your free account and get{" "}
                <span className="text-white font-bold">Rp 100,000,000</span> in virtual money to start practicing.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              {[
                { icon: Star, title: "Free Virtual Capital", desc: "Start with Rp 100 million virtual money" },
                { icon: Target, title: "AI Risk Profile", desc: "Get personalized investment strategy" },
                { icon: Trophy, title: "Track Your Progress", desc: "Weekly AI coaching and performance reports" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-4 p-4 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{title}</p>
                    <p className="text-xs text-white/60">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Onboarding steps */}
            <div className="mt-8 p-5 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm">
              <p className="text-xs text-white/50 mb-4 font-semibold uppercase tracking-wider">Your onboarding journey</p>
              <div className="space-y-3">
                {[
                  { n: 1, label: "Create account", done: true },
                  { n: 2, label: "Complete risk profile", done: false },
                  { n: 3, label: "Set your first goal", done: false },
                  { n: 4, label: "Make your first trade", done: false },
                ].map((step) => (
                  <div key={step.n} className="flex items-center gap-3">
                    {step.done
                      ? <CheckCircle className="w-5 h-5 text-white shrink-0" />
                      : <div className="w-5 h-5 rounded-full border-2 border-white/30 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-white/40">{step.n}</span>
                        </div>
                    }
                    <span className={`text-sm ${step.done ? "text-white font-semibold" : "text-white/50"}`}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-white/30">Educational platform · Not financial advice</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f59e0b, #a855f7)" }}>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">StockInvest</span>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/80 border border-slate-200 p-8">
            <div className="mb-7">
              <h2 className="text-3xl font-black text-slate-900 mb-2">Create account</h2>
              <p className="text-slate-500">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold hover:underline" style={{ color: "#a855f7" }}>
                  Sign in
                </Link>
              </p>
            </div>

            <RegisterForm />
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Shadow portfolio simulator · Not financial advice
          </p>
        </div>
      </div>
    </div>
  );
}
