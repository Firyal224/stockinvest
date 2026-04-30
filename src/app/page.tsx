import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp, Shield, Brain, Target, BarChart3, Bell,
  ArrowRight, ChevronRight, Star, Users, Zap, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TICKER_STOCKS = [
  { symbol: "BBCA", change: +2.34, price: 9450 },
  { symbol: "TLKM", change: -0.82, price: 3780 },
  { symbol: "BBRI", change: +1.56, price: 5200 },
  { symbol: "BMRI", change: +0.94, price: 6875 },
  { symbol: "ASII", change: -1.23, price: 4970 },
  { symbol: "UNVR", change: +0.45, price: 2900 },
  { symbol: "GOTO", change: +5.21, price: 85 },
  { symbol: "ADRO", change: +2.10, price: 3100 },
  { symbol: "PTBA", change: -0.55, price: 2650 },
  { symbol: "ANTM", change: +3.40, price: 1895 },
];

const FEATURES = [
  {
    icon: BarChart3,
    title: "Market Board",
    description: "Track all IDX stocks with up-to-date prices, PE ratios, volume, and market cap. Filter by sector, gainers, or losers.",
    iconBg: "bg-blue-500",
    cardBorder: "border-blue-100 hover:border-blue-300",
    badge: "Yahoo Finance",
    badgeBg: "bg-blue-100 text-blue-700",
  },
  {
    icon: TrendingUp,
    title: "Shadow Trading",
    description: "Practice buy/sell orders with virtual money using real market prices. Master lot sizing and timing risk-free.",
    iconBg: "bg-emerald-500",
    cardBorder: "border-emerald-100 hover:border-emerald-300",
    badge: "Simulation",
    badgeBg: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: Brain,
    title: "AI Stock Analysis",
    description: "AI-powered analysis of financial reports, scoring, and recommendations. Get insights like a professional analyst.",
    iconBg: "bg-violet-500",
    cardBorder: "border-violet-100 hover:border-violet-300",
    badge: "AI Powered",
    badgeBg: "bg-violet-100 text-violet-700",
  },
  {
    icon: Target,
    title: "Goal-Based Investing",
    description: "Set financial goals — wedding, house, retirement — and get personalized AI stock allocations for each goal.",
    iconBg: "bg-orange-500",
    cardBorder: "border-orange-100 hover:border-orange-300",
    badge: "Personalized",
    badgeBg: "bg-orange-100 text-orange-700",
  },
  {
    icon: Shield,
    title: "Risk Profile",
    description: "AI analyzes your risk tolerance, capital, and goals to classify you as conservative, moderate, or aggressive.",
    iconBg: "bg-rose-500",
    cardBorder: "border-rose-100 hover:border-rose-300",
    badge: "Smart",
    badgeBg: "bg-rose-100 text-rose-700",
  },
  {
    icon: Bell,
    title: "AI Notifications",
    description: "Smart alerts for price movements, AI coaching on trading mistakes, and weekly PnL reports to track your progress.",
    iconBg: "bg-amber-500",
    cardBorder: "border-amber-100 hover:border-amber-300",
    badge: "Coaching",
    badgeBg: "bg-amber-100 text-amber-700",
  },
];

const STATS = [
  { value: "500+", label: "IDX Stocks", icon: BarChart3, color: "from-blue-400 to-cyan-400" },
  { value: "AI", label: "Powered Analysis", icon: Brain, color: "from-violet-400 to-purple-500" },
  { value: "0%", label: "Real Money Risk", icon: Shield, color: "from-emerald-400 to-teal-500" },
  { value: "24/7", label: "Market Data", icon: Zap, color: "from-amber-400 to-orange-500" },
];

const LIGHT_VARS: React.CSSProperties = {
  ["--background" as string]: "0 0% 100%",
  ["--foreground" as string]: "222.2 84% 4.9%",
  ["--card" as string]: "0 0% 100%",
  ["--card-foreground" as string]: "222.2 84% 4.9%",
  ["--muted" as string]: "210 40% 96.1%",
  ["--muted-foreground" as string]: "215.4 16.3% 46.9%",
  ["--border" as string]: "214.3 31.8% 91.4%",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden" style={LIGHT_VARS}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="StockInvest" width={36} height={36} className="rounded-xl shadow" />
              <span className="font-bold text-lg text-slate-900">StockInvest</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">Features</a>
              <a href="#how-it-works" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">How It Works</a>
              <a href="#stats" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">Stats</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-gradient-to-r from-teal-500 to-violet-600 text-white border-0 hover:opacity-90 shadow-md shadow-teal-200">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Stock Ticker */}
      <div className="fixed top-16 left-0 right-0 z-40 border-b border-slate-100 bg-slate-50/90 backdrop-blur-sm overflow-hidden">
        <div className="py-2 overflow-hidden">
          <div className="ticker-track">
            {[...TICKER_STOCKS, ...TICKER_STOCKS].map((stock, i) => (
              <div key={i} className="flex items-center gap-3 px-6 shrink-0">
                <span className="text-xs font-bold text-slate-700">{stock.symbol}</span>
                <span className="text-xs text-slate-400">Rp {stock.price.toLocaleString("id-ID")}</span>
                <span className={`text-xs font-semibold ${stock.change >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                  {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)}%
                </span>
                <span className="text-slate-200 text-xs">|</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative pt-36 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Light gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-violet-50" />
        {/* Decorative dots */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,#cbd5e1_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
        {/* Colorful blobs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-teal-200/50 rounded-full filter blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-violet-200/50 rounded-full filter blur-3xl" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-teal-200 rounded-full px-4 py-2 mb-8 text-sm shadow-sm">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-slate-600 font-medium">Real IDX Data · AI Analysis · Zero Risk</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
            <span className="text-slate-900">Master </span>
            <span className="bg-gradient-to-r from-teal-500 via-cyan-500 to-violet-600 bg-clip-text text-transparent">Indonesian Stocks</span>
            <br />
            <span className="text-slate-900">Before Investing</span>
          </h1>

          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Shadow portfolio simulator with real IDX market data, AI-powered stock analysis,
            goal-based investing, and virtual trading. Learn without losing real money.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="xl" className="bg-gradient-to-r from-teal-500 to-violet-600 text-white border-0 hover:opacity-90 shadow-xl shadow-teal-200/60 w-full sm:w-auto">
                Start Free — No Card Required
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="xl" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 w-full sm:w-auto">
                Sign In to Dashboard
                <ChevronRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-slate-400 flex-wrap">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Free to use</span>
            </div>
            <span>·</span>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-500" />
              <span>No real money needed</span>
            </div>
            <span>·</span>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-violet-500" />
              <span>AI-powered coaching</span>
            </div>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/80 p-4">
            <div className="flex items-center gap-2 mb-4 px-2">
              <div className="w-3 h-3 rounded-full bg-rose-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="ml-4 text-xs text-slate-400">StockInvest — Market Board</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Virtual Balance", value: "Rp 100,000,000", change: "+12.4%", gradient: "from-teal-500 to-cyan-400" },
                { label: "Portfolio Value", value: "Rp 87,500,000", change: "+5.2%", gradient: "from-violet-500 to-purple-400" },
                { label: "Total P&L", value: "Rp 7,500,000", change: "+8.3%", gradient: "from-emerald-500 to-teal-400" },
              ].map((card) => (
                <div key={card.label} className="rounded-xl p-4 relative overflow-hidden border border-slate-100">
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-10`} />
                  <p className="text-xs text-slate-400 mb-1 relative">{card.label}</p>
                  <p className="text-base font-bold text-slate-800 relative">{card.value}</p>
                  <p className="text-xs text-emerald-600 mt-1 font-semibold relative">{card.change} this month</p>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700">IDX Market Board</span>
                <div className="flex gap-2">
                  {["All", "Gainers", "Losers"].map((f) => (
                    <span key={f} className={`text-xs px-2.5 py-1 rounded-full font-medium ${f === "All" ? "bg-teal-100 text-teal-700" : "text-slate-400 bg-white border border-slate-200"}`}>{f}</span>
                  ))}
                </div>
              </div>
              {[
                { symbol: "BBCA.JK", name: "Bank Central Asia", price: "9,450", change: "+2.34%", up: true },
                { symbol: "TLKM.JK", name: "Telkom Indonesia", price: "3,780", change: "-0.82%", up: false },
                { symbol: "BBRI.JK", name: "Bank Rakyat Indonesia", price: "5,200", change: "+1.56%", up: true },
                { symbol: "GOTO.JK", name: "GoTo Gojek Tokopedia", price: "85", change: "+5.21%", up: true },
              ].map((stock) => (
                <div key={stock.symbol} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-violet-500 flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-white">{stock.symbol[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{stock.symbol}</p>
                      <p className="text-xs text-slate-400">{stock.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">Rp {stock.price}</p>
                    <p className={`text-xs font-semibold ${stock.up ? "text-emerald-600" : "text-rose-500"}`}>{stock.change}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ value, label, icon: Icon, color }) => (
              <div key={label} className="text-center p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-4 shadow-sm`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-black bg-gradient-to-r from-teal-600 to-violet-600 bg-clip-text text-transparent mb-1">{value}</div>
                <div className="text-sm text-slate-500 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-violet-100 border border-violet-200 rounded-full px-4 py-2 mb-4 text-sm text-violet-700 font-medium">
              <Brain className="w-4 h-4" />
              Everything you need to learn investing
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-slate-900">
              <span className="bg-gradient-to-r from-teal-500 to-violet-600 bg-clip-text text-transparent">Powerful Features</span>
              <br />
              for Smart Investors
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              All the tools you need to understand the Indonesian stock market and build winning strategies.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, description, iconBg, cardBorder, badge, badgeBg }) => (
              <div key={title}
                className={`group p-6 rounded-2xl border-2 bg-white hover:shadow-lg transition-all duration-300 ${cardBorder}`}>
                <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center mb-4 shadow-sm`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeBg}`}>{badge}</span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-teal-50/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-900">Start in 3 Simple Steps</h2>
            <p className="text-slate-500 text-lg">From registration to your first simulated trade in minutes.</p>
          </div>
          <div className="space-y-5">
            {[
              {
                step: "01",
                title: "Create Your Profile",
                desc: "Sign up and complete our AI-powered risk assessment. Answer a few questions about your goals, capital, and risk tolerance.",
                gradient: "from-teal-400 to-cyan-500",
                bg: "bg-teal-50 border-teal-200",
              },
              {
                step: "02",
                title: "Explore & Analyze",
                desc: "Browse 500+ IDX stocks with up-to-date market data. Use AI to analyze financial reports, get predictions, and discover top picks.",
                gradient: "from-violet-500 to-purple-500",
                bg: "bg-violet-50 border-violet-200",
              },
              {
                step: "03",
                title: "Trade & Learn",
                desc: "Execute simulated buy/sell orders with virtual money. Track your portfolio, set goals, and receive weekly AI coaching.",
                gradient: "from-amber-400 to-orange-500",
                bg: "bg-amber-50 border-amber-200",
              },
            ].map(({ step, title, desc, gradient, bg }) => (
              <div key={step} className={`flex gap-6 p-6 rounded-2xl border-2 ${bg} hover:shadow-md transition-all`}>
                <div className={`w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl font-black text-white shadow-lg`}>
                  {step}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
                  <p className="text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative rounded-3xl p-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-cyan-400 to-violet-600" />
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="relative">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
                Ready to Master IDX?
              </h2>
              <p className="text-white/80 text-xl mb-8">
                Start learning Indonesian stocks with AI guidance. Free forever.
              </p>
              <Link href="/register">
                <Button size="xl" className="bg-white text-teal-700 hover:bg-slate-50 font-bold shadow-xl">
                  Start Your Journey Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-violet-600 flex items-center justify-center shadow-sm">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800">StockInvest</span>
          </div>
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} StockInvest. Shadow portfolio simulator for educational purposes only.
          </p>
          <div className="flex gap-6 text-sm text-slate-400">
            <Link href="/login" className="hover:text-slate-700 transition-colors font-medium">Sign In</Link>
            <Link href="/register" className="hover:text-slate-700 transition-colors font-medium">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
