import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { portfolioHoldings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getStockQuotes } from "@/lib/yahoo-finance";
import { generateAIText } from "@/lib/ai";
import { headers } from "next/headers";

// ─── Helper: rewrite input bebas → format scenario ────────────────────────────
async function rewriteToScenario(userInput: string): Promise<string> {
  const systemPrompt = `You are a financial scenario converter for Indonesian stock market.
Convert any user investment question into a market scenario hypothesis format.
Examples:
- "kasih saran saham IPO" → "What if I allocate 20% of my portfolio to upcoming IDX IPO stocks in the next 6 months?"
- "saham apa yang naik?" → "What if top momentum IDX stocks rally 30% in the next 3 months?"
- "saham bagus buat jangka panjang?" → "What if I hold blue chip IDX stocks for 2 years with 15% annual growth?"
- "crypto bagus gak?" → "What if crypto market rises 50% and causes rotation away from IDX tech stocks?"

Respond ONLY with the converted scenario string. No explanation, no quotes, no punctuation at start/end.`;

  try {
    const rewritten = await generateAIText(systemPrompt, userInput, 150);
    const cleaned = rewritten.trim().replace(/^"|"$/g, "");
    return cleaned || userInput; // fallback ke input asli kalau gagal
  } catch {
    return userInput; // fallback ke input asli kalau error
  }
}

// ─── Deteksi apakah input sudah format scenario ───────────────────────────────
function isScenarioFormat(input: string): boolean {
  const lower = input.toLowerCase();
  const keywords = [
    "what if", "bagaimana jika", "jika ", "kalau ", "apabila",
    "drop", "crash", "turun", "naik", "rally", "rise", "fall",
    "ihsg", "rupiah", "interest rate", "suku bunga", "recession",
    "krisis", "inflasi", "inflation", "%",
  ];
  return keywords.some((kw) => lower.includes(kw));
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { scenario } = await req.json();
  if (!scenario?.trim()) return NextResponse.json({ error: "Scenario is required" }, { status: 400 });

  // Get portfolio
  const holdings = await db.select().from(portfolioHoldings)
    .where(eq(portfolioHoldings.userId, session.user.id));

  if (!holdings.length) {
    return NextResponse.json({ error: "No portfolio holdings to analyze" }, { status: 400 });
  }

  const symbols = holdings.map((h) => h.symbol);
  const quotes = await getStockQuotes(symbols);
  const quoteMap = Object.fromEntries(quotes.map((q) => [q.symbol, q]));

  const portfolioData = holdings.map((h) => {
    const q = quoteMap[h.symbol];
    return {
      symbol: h.symbol,
      lots: h.lots,
      avgBuyPrice: h.avgBuyPrice,
      currentPrice: q?.regularMarketPrice || h.avgBuyPrice,
      currentValue: (q?.regularMarketPrice || h.avgBuyPrice) * h.lots * 100,
      totalInvested: h.totalInvested,
      beta: q?.beta || 1,
    };
  });

  const totalPortfolioValue = portfolioData.reduce((s, h) => s + h.currentValue, 0);

  // ─── Auto-rewrite kalau input bukan format scenario ───────────────────────
  let finalScenario = scenario;
  let rewrittenScenario: string | null = null;

  if (!isScenarioFormat(scenario)) {
    console.log("[Scenario] Input bukan format scenario, rewriting...");
    finalScenario = await rewriteToScenario(scenario);
    console.log("[Scenario] Rewritten:", finalScenario);

    if (finalScenario !== scenario) {
      rewrittenScenario = finalScenario;
    }
  }

  // ─── Analisis portfolio ───────────────────────────────────────────────────
  const systemPrompt = `You are a professional portfolio risk analyst specializing in Indonesian stocks (IDX).
The user has this portfolio:
${JSON.stringify(portfolioData, null, 2)}
Total portfolio value: IDR ${totalPortfolioValue.toLocaleString()}

Analyze the following market scenario and its potential impact on the portfolio above.
Respond ONLY with raw valid JSON, no markdown, no backticks, no explanation.
IMPORTANT: stockImpacts array maximum 5 items only.
{
  "scenarioSummary": "brief description of the scenario",
  "totalImpact": { "amount": number, "percent": number },
  "stockImpacts": [
    { "symbol": "BBCA.JK", "estimatedLoss": number, "estimatedLossPercent": number, "reason": "string" }
  ],
  "hedgingStrategies": ["strategy 1", "strategy 2", "strategy 3"],
  "overallAssessment": "2-3 sentence summary"
}`;

  const text = await generateAIText(systemPrompt, finalScenario, 2000);
  console.log("[Scenario] RAW AI RESPONSE:", text);

  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const analysis = JSON.parse(cleaned);
    return NextResponse.json({
      analysis,
      portfolioValue: totalPortfolioValue,
      rewrittenScenario, // null kalau tidak di-rewrite
    });
  } catch {
    console.error("[Scenario] Failed to parse:", text);
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }
}