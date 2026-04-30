import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey", "ripHistorical"],
});

// Popular IDX (Indonesian Stock Exchange) LQ45 + Blue Chip stocks
export const IDX_STOCKS = [
  // Banking
  "BBCA.JK", "BBRI.JK", "BMRI.JK", "BBNI.JK", "BRIS.JK", "BNGA.JK", "BDMN.JK",
  // Telecom
  "TLKM.JK", "EXCL.JK", "ISAT.JK",
  // Consumer
  "UNVR.JK", "ICBP.JK", "INDF.JK", "MYOR.JK", "KLBF.JK", "SIDO.JK", "AMRT.JK",
  // Energy & Mining
  "ADRO.JK", "PTBA.JK", "ITMG.JK", "INCO.JK", "ANTM.JK", "MDKA.JK", "ESSA.JK",
  // Property
  "BSDE.JK", "CTRA.JK", "SMRA.JK", "PWON.JK",
  // Infrastructure
  "JSMR.JK", "PGAS.JK", "TOWR.JK", "TBIG.JK",
  // Technology
  "GOTO.JK", "BUKA.JK", "EMTK.JK",
  // Automotive & Industrial
  "ASII.JK", "UNTR.JK", "SMSM.JK",
  // Retail
  "MAPI.JK", "ACES.JK", "LPPF.JK",
  // Health
  "MIKA.JK", "SILO.JK",
  // Cement & Material
  "INTP.JK", "SMGR.JK",
  // Plantation
  "AALI.JK", "LSIP.JK",
  // Others
  "GGRM.JK", "HMSP.JK", "MEDC.JK", "AKRA.JK", "SCMA.JK",
];

export interface StockQuote {
  symbol: string;
  shortName: string;
  longName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  regularMarketOpen: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  marketCap: number;
  trailingPE: number | null;
  forwardPE: number | null;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  fiftyDayAverage: number;
  twoHundredDayAverage: number;
  dividendYield: number | null;
  dividendRate: number | null;
  beta: number | null;
  currency: string;
  exchange: string;
}

export interface StockDetail extends StockQuote {
  sector: string;
  industry: string;
  longBusinessSummary: string;
  totalRevenue: number | null;
  netIncome: number | null;
  returnOnEquity: number | null;
  debtToEquity: number | null;
}

export interface HistoricalData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function getStockQuotes(symbols: string[]): Promise<StockQuote[]> {
  const results = await Promise.allSettled(
    symbols.map((sym) => yahooFinance.quote(sym))
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof yahooFinance.quote>>> =>
        r.status === "fulfilled" && !!r.value?.regularMarketPrice
    )
    .map((r) => {
      const q = r.value;
      return {
        symbol: q.symbol ?? "",
        shortName: q.shortName ?? q.symbol ?? "",
        longName: q.longName ?? q.shortName ?? q.symbol ?? "",
        regularMarketPrice: q.regularMarketPrice ?? 0,
        regularMarketChange: q.regularMarketChange ?? 0,
        regularMarketChangePercent: q.regularMarketChangePercent ?? 0,
        regularMarketVolume: q.regularMarketVolume ?? 0,
        regularMarketOpen: q.regularMarketOpen ?? 0,
        regularMarketDayHigh: q.regularMarketDayHigh ?? 0,
        regularMarketDayLow: q.regularMarketDayLow ?? 0,
        marketCap: q.marketCap ?? 0,
        trailingPE: q.trailingPE ?? null,
        forwardPE: q.forwardPE ?? null,
        fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ?? 0,
        fiftyTwoWeekLow: q.fiftyTwoWeekLow ?? 0,
        fiftyDayAverage: q.fiftyDayAverage ?? 0,
        twoHundredDayAverage: q.twoHundredDayAverage ?? 0,
        // quote().dividendYield is in percentage (e.g. 13.62), convert to decimal
        dividendYield: (q.dividendYield ?? 0) > 0 ? q.dividendYield! / 100
          : (q.trailingAnnualDividendYield ?? 0) > 0 ? q.trailingAnnualDividendYield! : null,
        dividendRate: (q.dividendRate ?? 0) > 0 ? q.dividendRate!
          : (q.trailingAnnualDividendRate ?? 0) > 0 ? q.trailingAnnualDividendRate! : null,
        beta: q.beta ?? null,
        currency: q.currency ?? "IDR",
        exchange: q.fullExchangeName ?? "IDX",
      };
    });
}

export async function getStockDetail(symbol: string): Promise<StockDetail | null> {
  try {
    const [qResult, sdResult] = await Promise.allSettled([
      yahooFinance.quote(symbol),
      yahooFinance.quoteSummary(symbol, { modules: ["summaryDetail"] }),
    ]);

    if (qResult.status === "rejected" || !qResult.value?.regularMarketPrice) return null;
    const q = qResult.value;
    const sd = sdResult.status === "fulfilled" ? sdResult.value?.summaryDetail : null;

    // Prefer summaryDetail (decimal format). quote().dividendYield is percentage → /100
    const dividendRate =
      (sd?.dividendRate ?? 0) > 0 ? sd!.dividendRate! :
      (sd?.trailingAnnualDividendRate ?? 0) > 0 ? sd!.trailingAnnualDividendRate! :
      (q.dividendRate ?? 0) > 0 ? q.dividendRate! :
      (q.trailingAnnualDividendRate ?? 0) > 0 ? q.trailingAnnualDividendRate! : null;

    const dividendYield =
      (sd?.dividendYield ?? 0) > 0 ? sd!.dividendYield! :
      (sd?.trailingAnnualDividendYield ?? 0) > 0 ? sd!.trailingAnnualDividendYield! :
      (q.dividendYield ?? 0) > 0 ? q.dividendYield! / 100 :
      (q.trailingAnnualDividendYield ?? 0) > 0 ? q.trailingAnnualDividendYield! : null;

    return {
      symbol: q.symbol ?? symbol,
      shortName: q.shortName ?? symbol,
      longName: q.longName ?? q.shortName ?? symbol,
      regularMarketPrice: q.regularMarketPrice ?? 0,
      regularMarketChange: q.regularMarketChange ?? 0,
      regularMarketChangePercent: q.regularMarketChangePercent ?? 0,
      regularMarketVolume: q.regularMarketVolume ?? 0,
      regularMarketOpen: q.regularMarketOpen ?? 0,
      regularMarketDayHigh: q.regularMarketDayHigh ?? 0,
      regularMarketDayLow: q.regularMarketDayLow ?? 0,
      marketCap: q.marketCap ?? 0,
      trailingPE: q.trailingPE ?? null,
      forwardPE: q.forwardPE ?? null,
      fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ?? 0,
      fiftyTwoWeekLow: q.fiftyTwoWeekLow ?? 0,
      fiftyDayAverage: q.fiftyDayAverage ?? 0,
      twoHundredDayAverage: q.twoHundredDayAverage ?? 0,
      dividendYield: dividendYield ?? null,
      dividendRate: dividendRate ?? null,
      beta: q.beta ?? null,
      currency: q.currency ?? "IDR",
      exchange: q.fullExchangeName ?? "IDX",
      sector: (q as Record<string, unknown>).sector as string ?? "Unknown",
      industry: (q as Record<string, unknown>).industry as string ?? "Unknown",
      longBusinessSummary: "",
      totalRevenue: null,
      netIncome: null,
      returnOnEquity: null,
      debtToEquity: null,
    };
  } catch (error) {
    console.error(`Failed to fetch stock detail for ${symbol}:`, error);
    return null;
  }
}

export async function getHistoricalData(
  symbol: string,
  period: "1d" | "5d" | "1mo" | "3mo" | "1y" = "1mo"
): Promise<HistoricalData[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case "1d":  startDate.setDate(startDate.getDate() - 1); break;
      case "5d":  startDate.setDate(startDate.getDate() - 5); break;
      case "1mo": startDate.setMonth(startDate.getMonth() - 1); break;
      case "3mo": startDate.setMonth(startDate.getMonth() - 3); break;
      case "1y":  startDate.setFullYear(startDate.getFullYear() - 1); break;
    }

    const interval = period === "1d" ? "1h" : period === "5d" ? "1d" : "1d";

    const result = await yahooFinance.chart(symbol, {
      period1: startDate.toISOString().split("T")[0],
      period2: endDate.toISOString().split("T")[0],
      interval: interval as "1h" | "1d",
    });

    const quotes = result.quotes ?? [];
    return quotes.map((item) => ({
      date: new Date(item.date),
      open: item.open ?? 0,
      high: item.high ?? 0,
      low: item.low ?? 0,
      close: item.close ?? 0,
      volume: item.volume ?? 0,
    }));
  } catch (error) {
    console.error(`Failed to fetch historical data for ${symbol}:`, error);
    return [];
  }
}
