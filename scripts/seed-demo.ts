/**
 * Demo Data Seeder for firyal992@gmail.com
 * Usage: npx tsx scripts/seed-demo.ts
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const TURSO_URL =
  process.env.TURSO_DATABASE_URL ||
  "libsql://shadow-portfolio-firyalihsani.aws-ap-northeast-1.turso.io";
const TURSO_TOKEN =
  process.env.TURSO_AUTH_TOKEN ||
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Nzc0ODc5NDAsImlkIjoiMDE5ZGRhODktMTYwMS03OWVhLTk3MWUtMzVkNzEyY2EyMzZjIiwicmlkIjoiNGEwYTU1NDAtZTdhMy00YmRiLTlmYjItOTAwNjUwNzlmM2RkIn0.tXummWNuy2dQeq7NB5j8l4mR3_vdkCRuyraED-reibi1wIEx3k61pRVWXTQbGMEvM8VTqVtBQ2Eo3UFk7f37CQ";

const TARGET_EMAIL = "firyal992@gmail.com";

const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
const db = drizzle(client, { schema });

function id() { return crypto.randomUUID(); }
function d(y: number, mo: number, day: number, h = 10, m = 0) {
  return new Date(y, mo - 1, day, h, m);
}
function log(msg: string) { console.log("  ✅  " + msg); }

async function main() {
  console.log("\n╔════════════════════════════════════════════╗");
  console.log("║    StockInvest Demo Seeder — firyal992    ║");
  console.log("╚════════════════════════════════════════════╝\n");

  // ── 1. Get user ────────────────────────────────────────────────────────────
  const [usr] = await db.select().from(schema.user)
    .where(eq(schema.user.email, TARGET_EMAIL)).limit(1);
  if (!usr) {
    console.error(`❌  User ${TARGET_EMAIL} not found. Run 'npm run db:seed' first.`);
    process.exit(1);
  }
  const uid = usr.id;
  console.log(`👤  Found user: ${usr.name} (${uid.slice(0, 8)}...)\n`);

  // ── 2. Clear existing demo data ────────────────────────────────────────────
  console.log("🗑   Clearing existing demo data...");
  await db.delete(schema.aiNotifications).where(eq(schema.aiNotifications.userId, uid));
  await db.delete(schema.aiWeeklyReports).where(eq(schema.aiWeeklyReports.userId, uid));
  await db.delete(schema.watchlist).where(eq(schema.watchlist.userId, uid));
  await db.delete(schema.portfolioHoldings).where(eq(schema.portfolioHoldings.userId, uid));
  await db.delete(schema.orders).where(eq(schema.orders.userId, uid));
  // goalStocks deleted via cascade when goals deleted
  await db.delete(schema.goals).where(eq(schema.goals.userId, uid));
  await db.delete(schema.topupHistory).where(eq(schema.topupHistory.userId, uid));
  log("Cleared all existing demo data");

  // ── 3. Update user profile ─────────────────────────────────────────────────
  console.log("\n👤  Updating user profile...");
  await db.update(schema.user).set({
    riskProfile: "moderate",
    initialCapital: 75_000_000,
    virtualBalance: 48_134_000,  // after all transactions
    onboardingCompleted: true,
    updatedAt: new Date(),
  }).where(eq(schema.user.id, uid));
  log("Profile: moderate risk, initial capital Rp 75.000.000");

  // ── 4. Top-up history ──────────────────────────────────────────────────────
  console.log("\n💰  Seeding top-up history (6 records)...");
  const topups = [
    { amount: 20_000_000, note: "Modal awal shadow trading",       date: d(2025, 11, 15) },
    { amount: 15_000_000, note: "Top up setelah gajian November",  date: d(2025, 12, 10) },
    { amount: 10_000_000, note: "Top up awal tahun",               date: d(2026,  1,  5) },
    { amount: 10_000_000, note: "Top up rutin Februari",           date: d(2026,  2,  3) },
    { amount: 10_000_000, note: "Top up Maret",                    date: d(2026,  3,  1) },
    { amount: 10_000_000, note: "Top up April — tambah amunisi",   date: d(2026,  4,  1) },
  ];
  for (const t of topups) {
    await db.insert(schema.topupHistory).values({ id: id(), userId: uid, amount: t.amount, note: t.note, createdAt: t.date });
  }
  log(`${topups.length} top-ups, total Rp 75.000.000`);

  // ── 5. Goals ───────────────────────────────────────────────────────────────
  console.log("  Seeding goals (5 records)...");
  const gDarurat    = id();
  const gRumah      = id();
  const gNikah      = id();
  const gPendidikan = id();
  const gPensiun    = id();

  const goalsData = [
    {
      id: gDarurat, userId: uid, name: "Dana Darurat 6 Bulan", category: "darurat",
      targetAmount: 50_000_000, currentAmount: 4_800_000, allocatedBalance: 4_500_000,
      deadline: d(2026, 12, 31), status: "active",
      aiNote: "Prioritaskan saham likuid & defensif. BBRI dan TLKM cocok karena volatilitas rendah dan dividen stabil. Target 6 bulan pengeluaran tercapai di Q4 2026.",
      createdAt: d(2025, 11, 15),
    },
    {
      id: gRumah, userId: uid, name: "DP Rumah Impian", category: "rumah",
      targetAmount: 300_000_000, currentAmount: 12_300_000, allocatedBalance: 11_500_000,
      deadline: d(2028, 12, 31), status: "active",
      aiNote: "Horizon 2 tahun cocok untuk kombinasi blue chip + growth. BBCA, BMRI, ASII solid untuk apresiasi modal. KLBF sebagai buffer defensif.",
      createdAt: d(2025, 11, 15),
    },
    {
      id: gNikah, userId: uid, name: "Biaya Pernikahan", category: "nikah",
      targetAmount: 100_000_000, currentAmount: 3_620_000, allocatedBalance: 3_400_000,
      deadline: d(2026, 12, 31), status: "active",
      aiNote: "Deadline ketat — fokus saham dengan yield dividen tinggi. PTBA (yield ~8%) dan ADRO (recovery play) untuk upside. SIDO sebagai stabilizer.",
      createdAt: d(2025, 11, 20),
    },
    {
      id: gPendidikan, userId: uid, name: "Dana Pendidikan Anak", category: "pendidikan",
      targetAmount: 500_000_000, currentAmount: 3_050_000, allocatedBalance: 2_900_000,
      deadline: d(2032, 1, 1), status: "active",
      aiNote: "Horizon panjang 6 tahun — toleransi risiko lebih tinggi. BRIS growth story kuat, TOWR infrastruktur recurring revenue. GOTO speculative play untuk potensi 10x.",
      createdAt: d(2025, 12, 1),
    },
    {
      id: gPensiun, userId: uid, name: "Dana Pensiun Nyaman", category: "pensiun",
      targetAmount: 2_000_000_000, currentAmount: 1_950_000, allocatedBalance: 1_800_000,
      deadline: d(2045, 12, 31), status: "active",
      aiNote: "Horizon 20 tahun — manfaatkan compound growth. UNVR consumer staples defensif jangka panjang, PGAS infrastruktur energi dengan kontrak jangka panjang.",
      createdAt: d(2025, 12, 1),
    },
  ];
  for (const g of goalsData) {
    await db.insert(schema.goals).values(g);
  }
  log("5 goals created");

  // ── 6. Goal Stocks ─────────────────────────────────────────────────────────
  console.log("\n📊  Seeding goal stocks (20 records)...");
  const goalStocksData = [
    // Dana Darurat (defensive)
    { id: id(), goalId: gDarurat, symbol: "BBRI.JK", allocationPct: 0.40, aiReason: "Bank BUMN terbesar, likuiditas tinggi, dividen konsisten ~8% yield" },
    { id: id(), goalId: gDarurat, symbol: "TLKM.JK", allocationPct: 0.30, aiReason: "Telekomunikasi defensif, revenue recurring, dividen stabil ~5%" },
    { id: id(), goalId: gDarurat, symbol: "BMRI.JK", allocationPct: 0.20, aiReason: "Diversifikasi perbankan BUMN, beta rendah cocok untuk dana darurat" },
    { id: id(), goalId: gDarurat, symbol: "BBCA.JK", allocationPct: 0.10, aiReason: "Blue chip paling stabil di IDX, store of value jangka panjang" },
    // DP Rumah (growth + stability)
    { id: id(), goalId: gRumah, symbol: "BBCA.JK", allocationPct: 0.35, aiReason: "Fundamental terkuat di sektor banking, konsisten outperform benchmark" },
    { id: id(), goalId: gRumah, symbol: "ASII.JK", allocationPct: 0.25, aiReason: "Konglomerasi diversified — otomotif, finansial, agribisnis, infrastruktur" },
    { id: id(), goalId: gRumah, symbol: "BMRI.JK", allocationPct: 0.20, aiReason: "Valuasi menarik dengan P/BV di bawah rata-rata 5 tahun" },
    { id: id(), goalId: gRumah, symbol: "KLBF.JK", allocationPct: 0.20, aiReason: "Consumer health defensif, margin EBITDA stabil 15%+" },
    // Biaya Nikah (yield-focused)
    { id: id(), goalId: gNikah, symbol: "PTBA.JK", allocationPct: 0.35, aiReason: "Dividend yield tertinggi sektor batubara, >8% trailing 12 bulan" },
    { id: id(), goalId: gNikah, symbol: "ADRO.JK", allocationPct: 0.30, aiReason: "Recovery play harga komoditas, upside 20-30% dari level saat ini" },
    { id: id(), goalId: gNikah, symbol: "SIDO.JK", allocationPct: 0.20, aiReason: "Consumer health dengan margin tinggi dan dividen konsisten" },
    { id: id(), goalId: gNikah, symbol: "BBRI.JK", allocationPct: 0.15, aiReason: "Stabilizer portofolio, dividen interim membantu cash flow goal" },
    // Pendidikan (growth, higher risk)
    { id: id(), goalId: gPendidikan, symbol: "BRIS.JK", allocationPct: 0.35, aiReason: "Bank syariah dengan growth 20%+ YoY, market share terus naik" },
    { id: id(), goalId: gPendidikan, symbol: "TOWR.JK", allocationPct: 0.30, aiReason: "Tower infrastructure recurring revenue, EBITDA margin 85%+" },
    { id: id(), goalId: gPendidikan, symbol: "MIKA.JK", allocationPct: 0.20, aiReason: "Healthcare growth seiring aging population Indonesia" },
    { id: id(), goalId: gPendidikan, symbol: "GOTO.JK", allocationPct: 0.15, aiReason: "Speculative high-risk high-reward, potensi profitabilitas 2027" },
    // Dana Pensiun (very long term)
    { id: id(), goalId: gPensiun, symbol: "BBCA.JK", allocationPct: 0.40, aiReason: "Anchor portofolio pensiun, compound 15%+ annually historis" },
    { id: id(), goalId: gPensiun, symbol: "UNVR.JK", allocationPct: 0.25, aiReason: "FMCG defensif, bisnis consumer staples tahan resesi" },
    { id: id(), goalId: gPensiun, symbol: "PGAS.JK", allocationPct: 0.20, aiReason: "Infrastruktur energi dengan kontrak jangka panjang, dividen menarik" },
    { id: id(), goalId: gPensiun, symbol: "TLKM.JK", allocationPct: 0.15, aiReason: "Telekomunikasi BUMN, beta rendah untuk stabilitas portofolio pensiun" },
  ];
  for (const gs of goalStocksData) await db.insert(schema.goalStocks).values(gs);
  log("20 goal stocks allocated");

  // ── 7. Orders (20 records) ─────────────────────────────────────────────────
  console.log("\n📝  Seeding orders (20 records)...");
  const ordersData = [
    { sym: "BBCA.JK",  type: "buy",  lots: 5,  price: 9_250,  goal: gRumah,      at: d(2025, 11, 20, 10, 30) },
    { sym: "BBRI.JK",  type: "buy",  lots: 10, price: 3_100,  goal: gDarurat,    at: d(2025, 11, 25, 11,  0) },
    { sym: "TLKM.JK",  type: "buy",  lots: 8,  price: 2_950,  goal: gDarurat,    at: d(2025, 12,  5, 10, 15) },
    { sym: "BMRI.JK",  type: "buy",  lots: 5,  price: 5_850,  goal: gRumah,      at: d(2025, 12, 12, 14,  0) },
    { sym: "ASII.JK",  type: "buy",  lots: 5,  price: 4_950,  goal: gRumah,      at: d(2025, 12, 20,  9, 45) },
    { sym: "PTBA.JK",  type: "buy",  lots: 8,  price: 2_600,  goal: gNikah,      at: d(2026,  1,  8, 11, 30) },
    { sym: "ADRO.JK",  type: "buy",  lots: 6,  price: 1_950,  goal: gNikah,      at: d(2026,  1, 15, 10,  0) },
    { sym: "TLKM.JK",  type: "sell", lots: 3,  price: 2_850,  goal: gDarurat,    at: d(2026,  1, 22, 15, 30), warn: "Harga TLKM masih di atas harga beli Anda. Pertimbangkan tahan lebih lama untuk optimasi dividen." },
    { sym: "KLBF.JK",  type: "buy",  lots: 10, price: 1_480,  goal: gRumah,      at: d(2026,  1, 28, 10, 20) },
    { sym: "UNVR.JK",  type: "buy",  lots: 5,  price: 2_150,  goal: gPensiun,    at: d(2026,  2,  5, 13, 45) },
    { sym: "GOTO.JK",  type: "buy",  lots: 25, price: 72,     goal: gPendidikan, at: d(2026,  2, 12,  9, 30), warn: "GOTO masih dalam fase turn-around. High risk — pastikan alokasi maksimal 10-15% portofolio." },
    { sym: "BRIS.JK",  type: "buy",  lots: 10, price: 1_870,  goal: gPendidikan, at: d(2026,  2, 18, 10, 0)  },
    { sym: "PTBA.JK",  type: "sell", lots: 3,  price: 2_750,  goal: gNikah,      at: d(2026,  2, 25, 14, 15) },
    { sym: "SIDO.JK",  type: "buy",  lots: 15, price: 640,    goal: gNikah,      at: d(2026,  3,  5, 11, 30) },
    { sym: "TOWR.JK",  type: "buy",  lots: 10, price: 920,    goal: gPendidikan, at: d(2026,  3, 12, 10,  0) },
    { sym: "GOTO.JK",  type: "sell", lots: 10, price: 68,     goal: gPendidikan, at: d(2026,  3, 18, 15,  0), warn: "Kerugian unrealized -5.6%. Keputusan cut loss sudah tepat untuk manajemen risiko." },
    { sym: "ICBP.JK",  type: "buy",  lots: 2,  price: 9_300,  goal: null,        at: d(2026,  3, 25, 10, 45) },
    { sym: "PGAS.JK",  type: "buy",  lots: 8,  price: 1_480,  goal: gPensiun,    at: d(2026,  4,  5, 11,  0) },
    { sym: "UNVR.JK",  type: "sell", lots: 2,  price: 2_050,  goal: gPensiun,    at: d(2026,  4, 12, 14, 30), warn: "UNVR turun dari harga beli. Pertimbangkan averaging down daripada sell jika fundamental masih solid." },
    { sym: "ACES.JK",  type: "buy",  lots: 10, price: 760,    goal: null,        at: d(2026,  4, 20, 10, 15) },
  ];

  for (const o of ordersData) {
    const total = o.lots * 100 * o.price;
    await db.insert(schema.orders).values({
      id: id(), userId: uid,
      goalId: o.goal ?? null,
      symbol: o.sym, type: o.type, orderType: "market",
      lots: o.lots, pricePerShare: o.price, totalValue: total,
      status: "executed", aiWarning: o.warn ?? null,
      executedAt: o.at,
    });
  }
  log("20 orders inserted");

  // ── 8. Portfolio Holdings (16 stocks) ─────────────────────────────────────
  console.log("\n💼  Seeding portfolio holdings (16 stocks)...");
  // Net positions after all buys/sells above
  const holdings = [
    { sym: "BBCA.JK",  lots: 5,  avgPrice: 9_250, goal: gRumah      },
    { sym: "BBRI.JK",  lots: 10, avgPrice: 3_100, goal: gDarurat    },
    { sym: "TLKM.JK",  lots: 5,  avgPrice: 2_950, goal: gDarurat    }, // 8 bought, 3 sold
    { sym: "BMRI.JK",  lots: 5,  avgPrice: 5_850, goal: gRumah      },
    { sym: "ASII.JK",  lots: 5,  avgPrice: 4_950, goal: gRumah      },
    { sym: "PTBA.JK",  lots: 5,  avgPrice: 2_600, goal: gNikah      }, // 8 bought, 3 sold
    { sym: "ADRO.JK",  lots: 6,  avgPrice: 1_950, goal: gNikah      },
    { sym: "KLBF.JK",  lots: 10, avgPrice: 1_480, goal: gRumah      },
    { sym: "UNVR.JK",  lots: 3,  avgPrice: 2_150, goal: gPensiun    }, // 5 bought, 2 sold
    { sym: "GOTO.JK",  lots: 15, avgPrice: 72,    goal: gPendidikan }, // 25 bought, 10 sold
    { sym: "BRIS.JK",  lots: 10, avgPrice: 1_870, goal: gPendidikan },
    { sym: "SIDO.JK",  lots: 15, avgPrice: 640,   goal: gNikah      },
    { sym: "TOWR.JK",  lots: 10, avgPrice: 920,   goal: gPendidikan },
    { sym: "ICBP.JK",  lots: 2,  avgPrice: 9_300, goal: null        },
    { sym: "PGAS.JK",  lots: 8,  avgPrice: 1_480, goal: gPensiun    },
    { sym: "ACES.JK",  lots: 10, avgPrice: 760,   goal: null        },
  ];
  for (const h of holdings) {
    const invested = h.lots * 100 * h.avgPrice;
    await db.insert(schema.portfolioHoldings).values({
      id: id(), userId: uid, goalId: h.goal ?? null,
      symbol: h.sym, lots: h.lots, avgBuyPrice: h.avgPrice,
      totalInvested: invested, updatedAt: new Date(),
    });
  }
  log("16 holdings recorded");

  // ── 9. Watchlist (15 stocks) ───────────────────────────────────────────────
  console.log("\n📌  Seeding watchlist (15 stocks)...");
  const watchSymbols = [
    { sym: "ANTM.JK",  at: d(2025, 11, 18) },
    { sym: "INDF.JK",  at: d(2025, 11, 22) },
    { sym: "MAPI.JK",  at: d(2025, 12,  3) },
    { sym: "JSMR.JK",  at: d(2025, 12, 10) },
    { sym: "EXCL.JK",  at: d(2025, 12, 18) },
    { sym: "BUKA.JK",  at: d(2026,  1,  7) },
    { sym: "SILO.JK",  at: d(2026,  1, 14) },
    { sym: "MIKA.JK",  at: d(2026,  1, 21) },
    { sym: "INTP.JK",  at: d(2026,  2,  2) },
    { sym: "SMGR.JK",  at: d(2026,  2, 10) },
    { sym: "LSIP.JK",  at: d(2026,  2, 20) },
    { sym: "AALI.JK",  at: d(2026,  3,  5) },
    { sym: "SCMA.JK",  at: d(2026,  3, 15) },
    { sym: "MEDC.JK",  at: d(2026,  4,  2) },
    { sym: "MDKA.JK",  at: d(2026,  4, 18) },
  ];
  for (const w of watchSymbols) {
    await db.insert(schema.watchlist).values({ id: id(), userId: uid, symbol: w.sym, addedAt: w.at });
  }
  log("15 stocks in watchlist");

  // ── 10. AI Weekly Reports (4 weeks) ───────────────────────────────────────
  console.log("\n📋  Seeding AI weekly reports (4 weeks)...");
  const reports = [
    {
      weekStart: d(2026, 4, 2),
      pnlSummary: JSON.stringify({
        totalInvested: 26_857_000, currentValue: 27_200_000,
        unrealizedPnl: 343_000, unrealizedPnlPct: 1.28,
        realizedPnl: -30_000, weeklyReturn: -1.2,
        topGainer: "PTBA.JK", topLoser: "GOTO.JK",
        gainers: ["PTBA.JK", "ADRO.JK", "BBCA.JK"],
        losers: ["GOTO.JK", "UNVR.JK", "TLKM.JK"],
      }),
      coachingNotes: "Portofolio kamu minggu ini mengalami koreksi ringan -1.2%. GOTO masih menjadi beban terbesar dengan unrealized loss -15.3% — pertimbangkan menetapkan stop loss ketat di Rp 60. Di sisi positif, PTBA dan ADRO menunjukkan pemulihan yang kuat seiring stabilisasi harga batubara global. BBCA tetap menjadi anchor yang solid. Saran: hindari menambah posisi baru minggu ini, tunggu konsolidasi pasar selesai.",
      goalProgress: JSON.stringify([
        { goalName: "Dana Darurat 6 Bulan", targetAmount: 50_000_000, currentAmount: 4_800_000, progress: 9.6, onTrack: true, note: "Steady progress, BBRI dividen Q2 akan masuk bulan depan" },
        { goalName: "DP Rumah Impian",       targetAmount: 300_000_000, currentAmount: 12_300_000, progress: 4.1, onTrack: true, note: "BBCA dan ASII perform baik bulan ini" },
        { goalName: "Biaya Pernikahan",       targetAmount: 100_000_000, currentAmount: 3_620_000, progress: 3.6, onTrack: false, note: "Perlu tambah alokasi, deadline Q4 2026 cukup ketat" },
        { goalName: "Dana Pendidikan Anak",   targetAmount: 500_000_000, currentAmount: 3_050_000, progress: 0.6, onTrack: true, note: "Horizon panjang, BRIS growth masih solid" },
        { goalName: "Dana Pensiun Nyaman",    targetAmount: 2_000_000_000, currentAmount: 1_950_000, progress: 0.1, onTrack: true, note: "Terlalu dini untuk menilai, fokus consistency" },
      ]),
      recommendations: JSON.stringify([
        { symbol: "BBCA.JK", action: "hold",  reason: "Fundamental kuat, tetap pegang untuk long-term compounding" },
        { symbol: "GOTO.JK", action: "watch", reason: "Set stop loss Rp 60, jika tembus consider cut loss total" },
        { symbol: "PTBA.JK", action: "hold",  reason: "Dividen yield 8%+ masih menarik, tunggu recovery penuh" },
        { symbol: "ANTM.JK", action: "watch", reason: "Watchlist — nikel demand EV terus naik, entry menarik di Rp 1.400" },
      ]),
      createdAt: d(2026, 4, 7, 8, 0),
    },
    {
      weekStart: d(2026, 4, 9),
      pnlSummary: JSON.stringify({
        totalInvested: 26_857_000, currentValue: 27_951_000,
        unrealizedPnl: 1_094_000, unrealizedPnlPct: 4.07,
        realizedPnl: -30_000, weeklyReturn: 2.8,
        topGainer: "BRIS.JK", topLoser: "GOTO.JK",
        gainers: ["BRIS.JK", "ASII.JK", "KLBF.JK", "BBCA.JK"],
        losers: ["GOTO.JK", "SIDO.JK"],
      }),
      coachingNotes: "Recovery yang sangat bagus minggu ini! Portfolio naik +2.8% — dipimpin oleh BRIS (+7.1% setelah laporan keuangan Q1 positif) dan ASII (+4.3% rally otomotif). Total unrealized gain sudah Rp 1.094.000. GOTO masih negatif tapi koreksinya melambat — pertanda stabilisasi. Kamu sudah mengambil keputusan yang tepat dengan cut loss 10 lot GOTO bulan lalu. Saran minggu ini: pertimbangkan averaging down UNVR jika turun ke Rp 2.000.",
      goalProgress: JSON.stringify([
        { goalName: "Dana Darurat 6 Bulan", targetAmount: 50_000_000, currentAmount: 4_950_000, progress: 9.9, onTrack: true, note: "Naik tipis, on track" },
        { goalName: "DP Rumah Impian",       targetAmount: 300_000_000, currentAmount: 13_100_000, progress: 4.37, onTrack: true, note: "BBCA breakout resistance, momentum positif" },
        { goalName: "Biaya Pernikahan",       targetAmount: 100_000_000, currentAmount: 3_800_000, progress: 3.8, onTrack: false, note: "Masih perlu akselerasi, pertimbangkan top-up" },
        { goalName: "Dana Pendidikan Anak",   targetAmount: 500_000_000, currentAmount: 3_280_000, progress: 0.66, onTrack: true, note: "BRIS reli kuat, kontribusi signifikan" },
        { goalName: "Dana Pensiun Nyaman",    targetAmount: 2_000_000_000, currentAmount: 2_020_000, progress: 0.1, onTrack: true, note: "PGAS stabil, UNVR sedikit recover" },
      ]),
      recommendations: JSON.stringify([
        { symbol: "BRIS.JK",  action: "hold",    reason: "Momentum kuat pasca laporan Q1, tahan untuk target Rp 2.200" },
        { symbol: "UNVR.JK",  action: "accumulate", reason: "Undervalued di level saat ini, averaging down menarik" },
        { symbol: "MAPI.JK",  action: "watch",   reason: "Watchlist — ritel recovery, entry bagus di Rp 1.500-1.550" },
        { symbol: "EXCL.JK",  action: "watch",   reason: "Merger XL-Smartfren progress positif, potensi rerating" },
      ]),
      createdAt: d(2026, 4, 14, 8, 0),
    },
    {
      weekStart: d(2026, 4, 16),
      pnlSummary: JSON.stringify({
        totalInvested: 26_857_000, currentValue: 28_253_000,
        unrealizedPnl: 1_396_000, unrealizedPnlPct: 5.20,
        realizedPnl: -30_000, weeklyReturn: 1.1,
        topGainer: "ADRO.JK", topLoser: "GOTO.JK",
        gainers: ["ADRO.JK", "PTBA.JK", "TOWR.JK", "ICBP.JK"],
        losers: ["GOTO.JK", "TLKM.JK"],
      }),
      coachingNotes: "Performa solid — portfolio naik +1.1% minggu ini, lebih moderat dari minggu lalu tapi tetap positif. Sektor komoditas sangat kuat: ADRO +5.8% dan PTBA +4.2% didorong harga batubara thermal yang naik 8% akibat cuaca ekstrem di Eropa. TOWR juga breakout resistance Rp 950 dengan volume tinggi. GOTO akhirnya menunjukkan tanda-tanda stabilisasi di Rp 67-69. Secara overall portofolio sudah +5.2% dari modal — bagus untuk 5 bulan pertama! Pertahankan disiplin investasi rutin.",
      goalProgress: JSON.stringify([
        { goalName: "Dana Darurat 6 Bulan", targetAmount: 50_000_000, currentAmount: 5_100_000, progress: 10.2, onTrack: true, note: "10% dari target tercapai, milestone pertama!" },
        { goalName: "DP Rumah Impian",       targetAmount: 300_000_000, currentAmount: 13_550_000, progress: 4.52, onTrack: true, note: "Konsisten naik, ASII dan KLBF perform" },
        { goalName: "Biaya Pernikahan",       targetAmount: 100_000_000, currentAmount: 4_200_000, progress: 4.2, onTrack: false, note: "PTBA dan ADRO rally membantu signifikan" },
        { goalName: "Dana Pendidikan Anak",   targetAmount: 500_000_000, currentAmount: 3_450_000, progress: 0.69, onTrack: true, note: "TOWR breakout, BRIS stabil" },
        { goalName: "Dana Pensiun Nyaman",    targetAmount: 2_000_000_000, currentAmount: 2_100_000, progress: 0.11, onTrack: true, note: "Masih sangat awal, konsisten adalah kuncinya" },
      ]),
      recommendations: JSON.stringify([
        { symbol: "ADRO.JK", action: "hold",  reason: "Momentum komoditas masih kuat, target Rp 2.300 realistis" },
        { symbol: "PTBA.JK", action: "hold",  reason: "Dividen + capital gain, sweet spot untuk portofolio" },
        { symbol: "TOWR.JK", action: "hold",  reason: "Breakout terkonfirmasi, next target Rp 1.000" },
        { symbol: "JSMR.JK", action: "watch", reason: "Infrastruktur tol, valuasi menarik pasca koreksi Q1 2026" },
      ]),
      createdAt: d(2026, 4, 21, 8, 0),
    },
    {
      weekStart: d(2026, 4, 23),
      pnlSummary: JSON.stringify({
        totalInvested: 26_857_000, currentValue: 28_111_000,
        unrealizedPnl: 1_254_000, unrealizedPnlPct: 4.67,
        realizedPnl: -30_000, weeklyReturn: -0.5,
        topGainer: "ICBP.JK", topLoser: "TLKM.JK",
        gainers: ["ICBP.JK", "KLBF.JK", "ACES.JK"],
        losers: ["TLKM.JK", "BMRI.JK", "SIDO.JK"],
      }),
      coachingNotes: "Koreksi minor -0.5% minggu ini — normal dalam siklus pasar. Profit taking setelah 3 minggu kenaikan berturut-turut. TLKM terkoreksi -2.1% mengikuti sentimen negatif sektor telekomunikasi regional. Di sisi lain, ICBP melonjak +5.4% setelah laporan laba Q1 yang impressive (+12% YoY). ACES juga naik +3.2% pasca data ritel yang kuat. Total unrealized gain masih solid di Rp 1.254.000 (+4.67%). Jangan panik dengan koreksi kecil — ini kesempatan untuk review dan rebalancing jika perlu. Overall kamu on track!",
      goalProgress: JSON.stringify([
        { goalName: "Dana Darurat 6 Bulan", targetAmount: 50_000_000, currentAmount: 5_050_000, progress: 10.1, onTrack: true, note: "Sedikit turun tapi tetap di atas 10%" },
        { goalName: "DP Rumah Impian",       targetAmount: 300_000_000, currentAmount: 13_420_000, progress: 4.47, onTrack: true, note: "Koreksi BMRI dan ASII slight pullback" },
        { goalName: "Biaya Pernikahan",       targetAmount: 100_000_000, currentAmount: 4_100_000, progress: 4.1, onTrack: false, note: "SIDO koreksi -1.8%, perlu monitor deadline" },
        { goalName: "Dana Pendidikan Anak",   targetAmount: 500_000_000, currentAmount: 3_400_000, progress: 0.68, onTrack: true, note: "Masih positif berkat BRIS yang stabil" },
        { goalName: "Dana Pensiun Nyaman",    targetAmount: 2_000_000_000, currentAmount: 2_050_000, progress: 0.1, onTrack: true, note: "UNVR dan PGAS sedikit melemah minggu ini" },
      ]),
      recommendations: JSON.stringify([
        { symbol: "TLKM.JK",  action: "accumulate", reason: "Koreksi teknikal bukan fundamental, averaging di Rp 2.700 menarik" },
        { symbol: "ICBP.JK",  action: "hold",       reason: "Momentum laba Q1 kuat, target analis Rp 10.200" },
        { symbol: "ACES.JK",  action: "hold",       reason: "Ritel pemulihan konsisten, entry murah sudah terbukti tepat" },
        { symbol: "SCMA.JK",  action: "watch",      reason: "Media digital recovery play, valuasi di bawah peers" },
      ]),
      createdAt: d(2026, 4, 28, 8, 0),
    },
  ];

  for (const r of reports) {
    await db.insert(schema.aiWeeklyReports).values({
      id: id(), userId: uid,
      weekStart: r.weekStart,
      pnlSummary: r.pnlSummary,
      coachingNotes: r.coachingNotes,
      goalProgress: r.goalProgress,
      recommendations: r.recommendations,
      createdAt: r.createdAt,
    });
  }
  log("4 weekly AI reports generated");

  // ── 11. AI Notifications (18 records) ─────────────────────────────────────
  console.log("\n🔔  Seeding AI notifications (18 records)...");
  const notifs = [
    { type: "price_alert", sym: "BBCA.JK", msg: "📈 BBCA.JK naik +3.2% hari ini mencapai Rp 9.525 — portofolio kamu ikut menguat Rp 137.500.", read: true,  at: d(2026, 4, 28,  9, 15) },
    { type: "coaching",    sym: null,      msg: "🎯 Diversifikasi portofolio kamu sudah sangat baik! 16 saham di 8 sektor berbeda mengurangi risiko konsentrasi secara signifikan.", read: true,  at: d(2026, 4, 27, 10,  0) },
    { type: "price_alert", sym: "GOTO.JK", msg: "⚠️ GOTO.JK turun -4.2% hari ini ke Rp 66. Posisimu saat ini: -9.7% dari harga beli. Review stop loss?", read: true,  at: d(2026, 4, 26, 14, 30) },
    { type: "coaching",    sym: "GOTO.JK", msg: "💡 Kamu sudah memegang GOTO 2.5 bulan dengan unrealized loss -8.3%. Keputusan cut 10 lot sebelumnya sudah tepat. Pertimbangkan stop loss di Rp 62 untuk sisa posisi.", read: true,  at: d(2026, 4, 25,  9,  0) },
    { type: "news",        sym: "BBRI.JK", msg: "📰 BBRI umumkan dividen interim Rp 150/saham untuk semester I 2026. Dengan 10 lot posisimu, estimasi terima Rp 150.000.", read: true,  at: d(2026, 4, 24, 11, 30) },
    { type: "price_alert", sym: "PTBA.JK", msg: "🎯 PTBA.JK menyentuh Rp 2.750 — sudah +5.8% dari harga beli kamu Rp 2.600! Pertimbangkan partial profit taking.", read: true,  at: d(2026, 4, 22, 10, 45) },
    { type: "coaching",    sym: null,      msg: "📊 Laporan Mingguan AI minggu ke-4 April sudah tersedia. Ada insight menarik tentang performa BRIS dan proyeksi ADRO. Cek sekarang!", read: false, at: d(2026, 4, 28,  8,  5) },
    { type: "news",        sym: "TLKM.JK", msg: "📰 Telkom Indonesia investasi Rp 8T untuk infrastruktur 5G Jawa-Bali 2026. Analis Mandiri Sekuritas pertahankan rekomendasi Hold dengan target Rp 3.100.", read: true,  at: d(2026, 4, 20, 13, 0) },
    { type: "price_alert", sym: "ASII.JK", msg: "📈 ASII.JK breakout resistance Rp 5.200 dengan volume 3x normal — momentum buy sangat kuat. Posisimu +5.05% dari harga beli.", read: true,  at: d(2026, 4, 18,  9, 35) },
    { type: "coaching",    sym: null,      msg: "🏆 Selamat! Dana Darurat kamu sudah mencapai 10% dari target Rp 50 juta. Milestone pertama tercapai! Tetap konsisten dengan top-up rutin bulanan.", read: false, at: d(2026, 4, 16, 10, 0) },
    { type: "news",        sym: "ADRO.JK", msg: "📰 Harga batubara thermal global rebound 8% minggu ini akibat cuaca dingin ekstrem di Eropa. ADRO dan PTBA diproyeksikan diuntungkan langsung.", read: true,  at: d(2026, 4, 15,  8, 30) },
    { type: "price_alert", sym: "BMRI.JK", msg: "📈 BMRI.JK menyentuh level Rp 6.100 — tertinggi dalam 52 minggu! Unrealized gain posisimu +4.3% atau Rp 125.000.", read: true,  at: d(2026, 4, 14, 11, 0) },
    { type: "coaching",    sym: "UNVR.JK", msg: "⚠️ UNVR.JK underperform -4.7% YTD sementara IHSG +3.2%. Fundamental masih solid (ROE 75%+), tapi pertimbangkan rebalancing jika alokasi >15% portofolio.", read: true,  at: d(2026, 4, 12, 10, 0) },
    { type: "news",        sym: "ICBP.JK", msg: "📰 Indofood CBP laporkan laba bersih Q1 2026 naik 12.3% YoY menjadi Rp 2.1T, melampaui konsensus analis. Revenue Indomie ekspor tumbuh 18%.", read: true,  at: d(2026, 4, 10,  9, 0) },
    { type: "price_alert", sym: "BRIS.JK", msg: "🚀 BRIS.JK rally +7.1% hari ini setelah laporan keuangan Q1 menunjukkan laba tumbuh 28% YoY. Net interest margin meningkat ke 6.8%.", read: true,  at: d(2026, 4,  9, 14, 0) },
    { type: "coaching",    sym: null,      msg: "💪 Kamu sudah aktif shadow trading selama 5 bulan lebih! Portfolio 16 saham dengan total investasi Rp 26.8 juta sudah menunjukkan return +4.67%. Terus pertahankan disiplin ini!", read: false, at: d(2026, 4,  7,  9, 0) },
    { type: "news",        sym: "KLBF.JK", msg: "📰 Kalbe Farma ekspansi ke Vietnam dengan joint venture senilai USD 15 juta. Analis memproyeksikan tambahan revenue Rp 500M/tahun mulai 2027.", read: true,  at: d(2026, 4,  5, 11, 0) },
    { type: "price_alert", sym: "SIDO.JK", msg: "📈 SIDO.JK naik +4.2% hari ini ke Rp 667. Target analis mayoritas berada di Rp 720-750. Posisimu +4.2% dari harga beli Rp 640.", read: false, at: d(2026, 4, 28, 13, 30) },
  ];

  for (const n of notifs) {
    await db.insert(schema.aiNotifications).values({
      id: id(), userId: uid,
      type: n.type, symbol: n.sym ?? null, message: n.msg,
      isRead: n.read, createdAt: n.at,
    });
  }
  log("18 AI notifications seeded");

  // ── Done ───────────────────────────────────────────────────────────────────
  console.log("\n╔════════════════════════════════════════════╗");
  console.log("║         Demo Data Seeded! 🎉              ║");
  console.log("╚════════════════════════════════════════════╝");
  console.log("\n📋  Summary:");
  console.log("    👤  User     : firyal992@gmail.com");
  console.log("    💰  Balance  : Rp 48.134.000 (sisa dari 75jt)");
  console.log("    📊  Holdings : 16 saham, invested Rp 26.857.000");
  console.log("    📝  Orders   : 20 transaksi (16 buy, 4 sell)");
  console.log("    🎯  Goals    : 5 goals aktif");
  console.log("    📌  Watchlist: 15 saham");
  console.log("    📋  Reports  : 4 weekly AI reports");
  console.log("    🔔  Notifs   : 18 (5 unread)\n");

  client.close();
}

main().catch((e) => { console.error("❌  Error:", e); process.exit(1); });
