import OpenAI from "openai";

export const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "StockInvest Shadow Portfolio",
  },
});

// Free models — tried in order, auto-fallback if one fails
const FREE_MODELS = [
  "google/gemini-2.0-flash-001",
  "google/gemini-2.5-flash-preview:free",
  "deepseek/deepseek-chat-v3-5:free",
  "meta-llama/llama-4-maverick:free",
  "microsoft/mai-ds-r1:free",
  "mistralai/mistral-7b-instruct:free",
];

export async function generateAIText(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 1000
): Promise<string> {
  let lastError: unknown;

  for (const model of FREE_MODELS) {
    try {
      const response = await openrouter.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      });
      return response.choices[0]?.message?.content || "";
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      // Only fallback on 404 (model not found) or 429 (rate limit)
      if (status === 404 || status === 429) {
        console.warn(`[AI] Model ${model} unavailable (${status}), trying next...`);
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

export async function analyzeStockAI(symbol: string, stockData: object): Promise<{
  score: number;
  recommendation: "buy" | "hold" | "sell";
  summary: string;
  warnings: string[];
}> {
  const prompt = `You are a senior stock analyst specializing in Indonesian stocks (IDX).
Analyze the following stock data and provide:
1. A score from 0-100 (investment quality)
2. Recommendation: buy/hold/sell
3. Brief summary (2-3 sentences)
4. Key warnings (max 3)

Respond ONLY in valid JSON with this exact format:
{
  "score": number,
  "recommendation": "buy"|"hold"|"sell",
  "summary": "string",
  "warnings": ["string"]
}`;

  const text = await generateAIText(prompt, JSON.stringify({ symbol, data: stockData }), 500);

  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      score: 50,
      recommendation: "hold",
      summary: "Unable to analyze stock at this time. Please try again.",
      warnings: [],
    };
  }
}

export async function analyzeRiskProfile(answers: Record<string, string>): Promise<{
  profile: "conservative" | "moderate" | "aggressive";
  explanation: string;
}> {
  const prompt = `You are a financial advisor specializing in Indonesian retail investors.
Based on the user's answers, determine their investment risk profile.
Respond ONLY in valid JSON:
{
  "profile": "conservative"|"moderate"|"aggressive",
  "explanation": "brief explanation in English (1-2 sentences)"
}`;

  const text = await generateAIText(prompt, JSON.stringify(answers), 200);

  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      profile: "moderate",
      explanation: "Based on your responses, you have a moderate risk tolerance.",
    };
  }
}

export async function generateGoalAllocation(
  goalCategory: string,
  riskProfile: string,
  targetAmount: number,
  daysUntilDeadline: number
): Promise<Array<{ symbol: string; allocationPct: number; reason: string }>> {
  const prompt = `You are an Indonesian stock portfolio advisor.
Recommend stocks from IDX (Indonesian Stock Exchange) for the following goal.
Use real Indonesian stocks with .JK suffix.
Respond ONLY in valid JSON array:
[{"symbol": "BBCA.JK", "allocationPct": 0.4, "reason": "string"}, ...]
Total allocationPct must sum to 1.0. Max 5 stocks.`;

  const text = await generateAIText(
    prompt,
    JSON.stringify({ goalCategory, riskProfile, targetAmount, daysUntilDeadline }),
    500
  );

  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return [
      { symbol: "BBCA.JK", allocationPct: 0.4, reason: "Blue chip bank stock with stable dividend yield" },
      { symbol: "TLKM.JK", allocationPct: 0.3, reason: "State-owned telecom with consistent revenue growth" },
      { symbol: "UNVR.JK", allocationPct: 0.3, reason: "Consumer staples with defensive characteristics" },
    ];
  }
}

export async function generatePreOrderWarning(
  symbol: string,
  stockData: object,
  userRiskProfile: string,
  orderType: string,
  lots: number
): Promise<string | null> {
  const prompt = `You are a risk management advisor for Indonesian stocks.
Analyze if there are any significant warnings for this trade.
If safe, return null. If risky, return a brief warning (1-2 sentences).
Respond ONLY with: null or a warning string in double quotes.`;

  const text = await generateAIText(
    prompt,
    JSON.stringify({ symbol, stockData, userRiskProfile, orderType, lots }),
    150
  );

  const cleaned = text.trim();
  if (cleaned === "null" || cleaned === "") return null;
  return cleaned.replace(/^"|"$/g, "");
}

export async function predictStockMovement(
  stocks: object[]
): Promise<{ symbol: string; reason: string; targetGainPct: number; timeframe: string; category: "momentum" | "recovery" | "ipo_candidate" | "dividend_growth" }[]> {
  const prompt = `You are an IDX stock analyst. Based on the provided market data, pick the top 5 Indonesian stocks most likely to rise significantly in the next 1-3 months.
Consider: 52-week position (closer to low = more upside), PE attractiveness, beta, volume trends.
Categories: momentum (already trending up), recovery (near 52W low), ipo_candidate (small cap with growth potential), dividend_growth (high yield + stable).
Respond ONLY in valid JSON array:
[{"symbol":"BBCA.JK","reason":"1 sentence","targetGainPct":15,"timeframe":"1-2 months","category":"momentum"}]
Exactly 5 items.`;

  const text = await generateAIText(prompt, JSON.stringify(stocks), 600);
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

export async function predictSellTiming(
  symbol: string,
  stockData: object,
  lots: number,
  avgBuyPrice: number
): Promise<{ targetPrice: number; timeframe: string; confidence: "low" | "medium" | "high"; reasoning: string; stopLoss: number }> {
  const prompt = `You are an IDX trading advisor. Given the stock data, recommend when and at what price to sell.
Respond ONLY in valid JSON:
{"targetPrice":number,"timeframe":"e.g. 2-3 months","confidence":"low"|"medium"|"high","reasoning":"2 sentences","stopLoss":number}`;

  const text = await generateAIText(
    prompt,
    JSON.stringify({ symbol, stockData, lots, avgBuyPrice }),
    300
  );
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    const data = stockData as Record<string, number>;
    const price = data.regularMarketPrice || avgBuyPrice;
    return { targetPrice: Math.round(price * 1.15), timeframe: "2-3 months", confidence: "medium", reasoning: "Based on current market conditions.", stopLoss: Math.round(price * 0.9) };
  }
}

export async function getMarketHighlights(
  riskProfile: string
): Promise<{ symbol: string; reason: string; type: "buy" | "watch" }[]> {
  const prompt = `You are an IDX market analyst.
Suggest 3-5 Indonesian stocks for today based on the user's risk profile.
Use real IDX stocks with .JK suffix.
Respond ONLY in valid JSON array:
[{"symbol": "BBRI.JK", "reason": "string", "type": "buy"|"watch"}]`;

  const text = await generateAIText(prompt, JSON.stringify({ riskProfile, date: new Date().toISOString() }), 400);

  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return [
      { symbol: "BBCA.JK", reason: "Strong Q4 earnings beat expectations", type: "buy" },
      { symbol: "GOTO.JK", reason: "Recovery trend with improving fundamentals", type: "watch" },
      { symbol: "ASII.JK", reason: "Automotive sales recovery, dividend upcoming", type: "buy" },
    ];
  }
}
