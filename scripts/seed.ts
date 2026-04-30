/**
 * StockInvest Database Seeder
 * Usage: npm run db:seed
 *
 * Creates all tables (via drizzle-kit push) and seeds:
 * - Default user: firyal992@gmail.com / Testing123456#OKOK!
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { hashPassword } from "@better-auth/utils/password";
import * as schema from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

// ─── Config ──────────────────────────────────────────────────────────────────
const TURSO_URL =
  process.env.TURSO_DATABASE_URL ||
  "libsql://shadow-portfolio-firyalihsani.aws-ap-northeast-1.turso.io";

const TURSO_TOKEN =
  process.env.TURSO_AUTH_TOKEN ||
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Nzc0ODc5NDAsImlkIjoiMDE5ZGRhODktMTYwMS03OWVhLTk3MWUtMzVkNzEyY2EyMzZjIiwicmlkIjoiNGEwYTU1NDAtZTdhMy00YmRiLTlmYjItOTAwNjUwNzlmM2RkIn0.tXummWNuy2dQeq7NB5j8l4mR3_vdkCRuyraED-reibi1wIEx3k61pRVWXTQbGMEvM8VTqVtBQ2Eo3UFk7f37CQ";

// ─── Default User ─────────────────────────────────────────────────────────────
const DEFAULT_USER = {
  email: "firyal992@gmail.com",
  password: "Testing123456#OKOK!",
  name: "Firyal Ihsani",
  riskProfile: "moderate" as const,
  initialCapital: 100_000_000,
  virtualBalance: 100_000_000,
};

// ─── DB Connection ────────────────────────────────────────────────────────────
const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
const db = drizzle(client, { schema });

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateId(): string {
  return crypto.randomUUID();
}

function log(msg: string, ok = true) {
  const icon = ok ? "✅" : "❌";
  console.log(`  ${icon}  ${msg}`);
}

// ─── Create Tables via raw SQL ────────────────────────────────────────────────
async function createTables() {
  console.log("\n📋  Creating tables...");

  const tables = [
    // better-auth core tables
    `CREATE TABLE IF NOT EXISTS "user" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "email_verified" INTEGER NOT NULL DEFAULT 0,
      "image" TEXT,
      "created_at" INTEGER NOT NULL,
      "updated_at" INTEGER NOT NULL,
      "risk_profile" TEXT,
      "initial_capital" INTEGER DEFAULT 0,
      "virtual_balance" INTEGER DEFAULT 0,
      "onboarding_completed" INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS "session" (
      "id" TEXT PRIMARY KEY,
      "expires_at" INTEGER NOT NULL,
      "token" TEXT NOT NULL UNIQUE,
      "created_at" INTEGER NOT NULL,
      "updated_at" INTEGER NOT NULL,
      "ip_address" TEXT,
      "user_agent" TEXT,
      "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "account" (
      "id" TEXT PRIMARY KEY,
      "account_id" TEXT NOT NULL,
      "provider_id" TEXT NOT NULL,
      "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "access_token" TEXT,
      "refresh_token" TEXT,
      "id_token" TEXT,
      "access_token_expires_at" INTEGER,
      "refresh_token_expires_at" INTEGER,
      "scope" TEXT,
      "password" TEXT,
      "created_at" INTEGER NOT NULL,
      "updated_at" INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "verification" (
      "id" TEXT PRIMARY KEY,
      "identifier" TEXT NOT NULL,
      "value" TEXT NOT NULL,
      "expires_at" INTEGER NOT NULL,
      "created_at" INTEGER,
      "updated_at" INTEGER
    )`,
    // app tables
    `CREATE TABLE IF NOT EXISTS "risk_profile_answers" (
      "id" TEXT PRIMARY KEY,
      "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "question_key" TEXT NOT NULL,
      "answer" TEXT NOT NULL,
      "answered_at" INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "goals" (
      "id" TEXT PRIMARY KEY,
      "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "name" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "target_amount" INTEGER NOT NULL,
      "current_amount" INTEGER DEFAULT 0,
      "deadline" INTEGER NOT NULL,
      "allocated_balance" INTEGER DEFAULT 0,
      "status" TEXT DEFAULT 'active',
      "ai_note" TEXT,
      "created_at" INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "goal_stocks" (
      "id" TEXT PRIMARY KEY,
      "goal_id" TEXT NOT NULL REFERENCES "goals"("id") ON DELETE CASCADE,
      "symbol" TEXT NOT NULL,
      "allocation_pct" REAL NOT NULL,
      "ai_reason" TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS "topup_history" (
      "id" TEXT PRIMARY KEY,
      "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "amount" INTEGER NOT NULL,
      "note" TEXT,
      "created_at" INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "orders" (
      "id" TEXT PRIMARY KEY,
      "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "goal_id" TEXT REFERENCES "goals"("id"),
      "symbol" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "order_type" TEXT NOT NULL,
      "lots" INTEGER NOT NULL,
      "price_per_share" INTEGER NOT NULL,
      "total_value" INTEGER NOT NULL,
      "status" TEXT DEFAULT 'executed',
      "ai_warning" TEXT,
      "executed_at" INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "portfolio_holdings" (
      "id" TEXT PRIMARY KEY,
      "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "goal_id" TEXT REFERENCES "goals"("id"),
      "symbol" TEXT NOT NULL,
      "lots" INTEGER NOT NULL,
      "avg_buy_price" INTEGER NOT NULL,
      "total_invested" INTEGER NOT NULL,
      "updated_at" INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "watchlist" (
      "id" TEXT PRIMARY KEY,
      "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "symbol" TEXT NOT NULL,
      "added_at" INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "ai_weekly_reports" (
      "id" TEXT PRIMARY KEY,
      "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "week_start" INTEGER NOT NULL,
      "pnl_summary" TEXT,
      "coaching_notes" TEXT,
      "goal_progress" TEXT,
      "recommendations" TEXT,
      "created_at" INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "ai_notifications" (
      "id" TEXT PRIMARY KEY,
      "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "type" TEXT NOT NULL,
      "symbol" TEXT,
      "message" TEXT NOT NULL,
      "is_read" INTEGER DEFAULT 0,
      "created_at" INTEGER NOT NULL
    )`,
  ];

  for (const sql of tables) {
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS "([^"]+)"/)?.[1] ?? "?";
    try {
      await client.execute(sql);
      log(`Table "${tableName}" ready`);
    } catch (err) {
      log(`Table "${tableName}" failed: ${err}`, false);
    }
  }
}

// ─── Seed Default User ────────────────────────────────────────────────────────
async function seedUser() {
  console.log("\n👤  Seeding default user...");

  // Check if already exists
  const existing = await db
    .select({ id: schema.user.id, email: schema.user.email })
    .from(schema.user)
    .where(eq(schema.user.email, DEFAULT_USER.email))
    .limit(1);

  if (existing.length > 0) {
    log(`User ${DEFAULT_USER.email} already exists — skipping`);
    return existing[0].id;
  }

  const now = new Date();
  const userId = generateId();
  const accountId = generateId();

  // Hash password using better-auth's own algorithm
  const hashedPassword = await hashPassword(DEFAULT_USER.password);

  // Insert user
  await db.insert(schema.user).values({
    id: userId,
    name: DEFAULT_USER.name,
    email: DEFAULT_USER.email,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
    riskProfile: DEFAULT_USER.riskProfile,
    initialCapital: DEFAULT_USER.initialCapital,
    virtualBalance: DEFAULT_USER.virtualBalance,
    onboardingCompleted: true,
  });

  // Insert credential account (better-auth stores password here)
  await db.insert(schema.account).values({
    id: accountId,
    accountId: userId,
    providerId: "credential",
    userId: userId,
    password: hashedPassword,
    createdAt: now,
    updatedAt: now,
  });

  log(`User created: ${DEFAULT_USER.email}`);
  log(`Password: ${DEFAULT_USER.password}`);
  log(`Virtual balance: Rp ${DEFAULT_USER.virtualBalance.toLocaleString("id-ID")}`);
  log(`Risk profile: ${DEFAULT_USER.riskProfile}`);

  return userId;
}

// ─── Seed Sample Watchlist ────────────────────────────────────────────────────
async function seedWatchlist(userId: string) {
  console.log("\n📌  Seeding sample watchlist...");

  const watchlistStocks = ["BBCA.JK", "BBRI.JK", "BMRI.JK", "TLKM.JK", "ASII.JK"];

  for (const symbol of watchlistStocks) {
    const existing = await db
      .select({ id: schema.watchlist.id })
      .from(schema.watchlist)
      .where(eq(schema.watchlist.symbol, symbol))
      .limit(1);

    if (existing.length > 0) {
      log(`${symbol} already in watchlist — skipping`);
      continue;
    }

    await db.insert(schema.watchlist).values({
      id: generateId(),
      userId,
      symbol,
      addedAt: new Date(),
    });
    log(`Added ${symbol} to watchlist`);
  }
}

// ─── Seed Initial Top-Up Record ───────────────────────────────────────────────
async function seedTopupHistory(userId: string) {
  console.log("\n💰  Seeding initial top-up record...");

  const existing = await db
    .select({ id: schema.topupHistory.id })
    .from(schema.topupHistory)
    .where(eq(schema.topupHistory.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    log("Top-up history already exists — skipping");
    return;
  }

  await db.insert(schema.topupHistory).values({
    id: generateId(),
    userId,
    amount: DEFAULT_USER.initialCapital,
    note: "Initial virtual capital",
    createdAt: new Date(),
  });

  log(`Recorded initial top-up: Rp ${DEFAULT_USER.initialCapital.toLocaleString("id-ID")}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("╔════════════════════════════════════════╗");
  console.log("║     StockInvest Database Seeder        ║");
  console.log("╚════════════════════════════════════════╝");
  console.log(`\n🔗  Connecting to: ${TURSO_URL.replace(/\/\/.*@/, "//***@")}`);

  try {
    await createTables();
    const userId = await seedUser();
    await seedWatchlist(userId);
    await seedTopupHistory(userId);

    console.log("\n╔════════════════════════════════════════╗");
    console.log("║        Seeding Complete! 🎉            ║");
    console.log("╚════════════════════════════════════════╝");
    console.log("\n📋  Login credentials:");
    console.log(`    Email   : ${DEFAULT_USER.email}`);
    console.log(`    Password: ${DEFAULT_USER.password}`);
    console.log(`    Balance : Rp ${DEFAULT_USER.virtualBalance.toLocaleString("id-ID")}`);
    console.log("\n🚀  Run the app: npm run dev → http://localhost:3000\n");
  } catch (err) {
    console.error("\n❌  Seeder failed:", err);
    process.exit(1);
  } finally {
    client.close();
  }
}

main();
