import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ─── better-auth tables ───────────────────────────────────────────────────────
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  // custom user fields
  riskProfile: text("risk_profile"),             // conservative/moderate/aggressive
  initialCapital: integer("initial_capital").default(0),
  virtualBalance: integer("virtual_balance").default(0),
  onboardingCompleted: integer("onboarding_completed", { mode: "boolean" }).default(false),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// ─── onboarding ──────────────────────────────────────────────────────────────
export const riskProfileAnswers = sqliteTable("risk_profile_answers", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  questionKey: text("question_key").notNull(),
  answer: text("answer").notNull(),
  answeredAt: integer("answered_at", { mode: "timestamp" }).notNull(),
});

// ─── goal setting ─────────────────────────────────────────────────────────────
export const goals = sqliteTable("goals", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull(),   // nikah/rumah/darurat/pensiun/pendidikan/lainnya
  targetAmount: integer("target_amount").notNull(),
  currentAmount: integer("current_amount").default(0),
  deadline: integer("deadline", { mode: "timestamp" }).notNull(),
  allocatedBalance: integer("allocated_balance").default(0),
  status: text("status").default("active"),  // active/completed/paused
  aiNote: text("ai_note"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const goalStocks = sqliteTable("goal_stocks", {
  id: text("id").primaryKey(),
  goalId: text("goal_id").notNull().references(() => goals.id, { onDelete: "cascade" }),
  symbol: text("symbol").notNull(),
  allocationPct: real("allocation_pct").notNull(),
  aiReason: text("ai_reason"),
});

// ─── virtual wallet ───────────────────────────────────────────────────────────
export const topupHistory = sqliteTable("topup_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  note: text("note"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ─── simulation trading ───────────────────────────────────────────────────────
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  goalId: text("goal_id").references(() => goals.id),  // nullable
  symbol: text("symbol").notNull(),
  type: text("type").notNull(),           // buy/sell
  orderType: text("order_type").notNull(), // market/limit
  lots: integer("lots").notNull(),
  pricePerShare: integer("price_per_share").notNull(),
  totalValue: integer("total_value").notNull(),  // lots × 100 × price
  status: text("status").default("executed"),    // pending/executed/cancelled
  aiWarning: text("ai_warning"),
  executedAt: integer("executed_at", { mode: "timestamp" }).notNull(),
});

export const portfolioHoldings = sqliteTable("portfolio_holdings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  goalId: text("goal_id").references(() => goals.id),
  symbol: text("symbol").notNull(),
  lots: integer("lots").notNull(),
  avgBuyPrice: integer("avg_buy_price").notNull(),
  totalInvested: integer("total_invested").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ─── watchlist & AI ──────────────────────────────────────────────────────────
export const watchlist = sqliteTable("watchlist", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  symbol: text("symbol").notNull(),
  addedAt: integer("added_at", { mode: "timestamp" }).notNull(),
});

export const aiWeeklyReports = sqliteTable("ai_weekly_reports", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  weekStart: integer("week_start", { mode: "timestamp" }).notNull(),
  pnlSummary: text("pnl_summary"),          // JSON
  coachingNotes: text("coaching_notes"),
  goalProgress: text("goal_progress"),       // JSON
  recommendations: text("recommendations"), // JSON
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const aiNotifications = sqliteTable("ai_notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  type: text("type").notNull(),    // price_alert/news/coaching
  symbol: text("symbol"),
  message: text("message").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ─── relations ────────────────────────────────────────────────────────────────
export const userRelations = relations(user, ({ many }) => ({
  goals: many(goals),
  orders: many(orders),
  holdings: many(portfolioHoldings),
  watchlist: many(watchlist),
  topups: many(topupHistory),
  notifications: many(aiNotifications),
  weeklyReports: many(aiWeeklyReports),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  user: one(user, { fields: [goals.userId], references: [user.id] }),
  stocks: many(goalStocks),
  orders: many(orders),
  holdings: many(portfolioHoldings),
}));
