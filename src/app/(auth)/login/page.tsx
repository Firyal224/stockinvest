import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";
import { TrendingUp, Shield, Brain, BarChart3 } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left brand panel — vibrant gradient */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col">
        <div className="absolute inset-0" style={{
          background: "linear-gradient(135deg, #0d9488 0%, #06b6d4 35%, #6366f1 70%, #8b5cf6 100%)"
        }} />
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/5" />
        {/* Dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:28px_28px]" />

        <div className="relative flex flex-col h-full p-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 w-fit">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">StockInvest</span>
          </Link>

          {/* Main content */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-10 mt-4">
              <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 rounded-full px-3 py-1.5 mb-6 text-sm text-white/90 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Market is open
              </div>
              <h1 className="text-5xl font-black text-white mb-4 leading-tight">
                Welcome<br />
                <span className="text-white/80">back, Investor</span>
              </h1>
              <p className="text-white/70 text-lg leading-relaxed">
                Your shadow portfolio awaits. Check your AI analysis, track your goals, and simulate new trades.
              </p>
            </div>

            {/* Feature list */}
            <div className="space-y-3">
              {[
                { icon: BarChart3, title: "500+ IDX Stocks", desc: "Real-time data from Yahoo Finance" },
                { icon: Brain, title: "AI-Powered Analysis", desc: "Personalized stock recommendations" },
                { icon: Shield, title: "Virtual Money Only", desc: "Learn without any financial risk" },
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

            {/* Live market mini */}
            <div className="mt-8 p-4 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm">
              <p className="text-xs text-white/50 mb-3 font-semibold uppercase tracking-wider">Live Market Snapshot</p>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { sym: "BBCA", price: "9,450", pct: "+2.34%" },
                  { sym: "TLKM", price: "3,780", pct: "-0.82%" },
                  { sym: "BBRI", price: "5,200", pct: "+1.56%" },
                  { sym: "GOTO", price: "85", pct: "+5.21%" },
                ].map((s) => (
                  <div key={s.sym} className="flex justify-between items-center p-2 rounded-lg bg-white/10">
                    <span className="text-xs font-bold text-white">{s.sym}</span>
                    <div className="text-right">
                      <span className="text-xs text-white/60 mr-1">Rp {s.price}</span>
                      <span className={`text-xs font-bold ${s.pct.startsWith("+") ? "text-emerald-300" : "text-rose-300"}`}>{s.pct}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-white/30 mt-auto">Data from Yahoo Finance · For educational purposes only</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0d9488, #6366f1)" }}>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">StockInvest</span>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/80 border border-slate-200 p-8">
            <div className="mb-7">
              <h2 className="text-3xl font-black text-slate-900 mb-2">Sign in</h2>
              <p className="text-slate-500">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-semibold hover:underline" style={{ color: "#0d9488" }}>
                  Register free
                </Link>
              </p>
            </div>

            <LoginForm />
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Shadow portfolio simulator · Not financial advice
          </p>
        </div>
      </div>
    </div>
  );
}
