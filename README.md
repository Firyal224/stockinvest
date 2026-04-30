# StockInvest

A shadow portfolio simulator for Indonesian Stock Exchange (IDX) investors. Practice trading with virtual money, get AI-powered stock analysis, track investment goals, and monitor dividends — all without risking real capital.

## Features

- **Shadow Trading** — Buy and sell IDX stocks using virtual balance. No real money involved.
- **Live Market Board** —  stock prices from Yahoo Finance for 500+ IDX stocks.
- **AI Stock Analysis** — AI-powered buy/hold/sell recommendations with scoring and risk warnings.
- **AI Sell Prediction** — Target price, stop-loss, and confidence level generated before every buy.
- **Dividend Tracker** — Estimate annual, quarterly, and monthly dividend income per holding.
- **Investment Goals** — Set financial goals (house, car, retirement, etc.) and get AI-recommended stock allocations tailored to your timeline and risk profile.
- **Top Dividend Stocks** — Scrollable leaderboard of highest-yield IDX stocks.
- **Weekly AI Reports** — Automated portfolio performance summaries with AI insights.
- **Virtual Top-Up** — Add virtual balance to practice more trades.
- **Dark / Light Mode** — Full theme support.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | [Turso](https://turso.tech) (LibSQL) |
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| Auth | [better-auth](https://better-auth.com) |
| Market Data | [yahoo-finance2](https://github.com/gadicc/node-yahoo-finance2) |
| AI | [OpenRouter](https://openrouter.ai) (Gemini, DeepSeek, LLaMA) |
| Charts | Recharts |
| Animation | Framer Motion |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Turso](https://turso.tech) database (free tier works)
- An [OpenRouter](https://openrouter.ai) API key (free models available)

### Installation

```bash
git clone https://github.com/your-username/stockinvest.git
cd stockinvest
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```env
# Database (Turso)
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token

# Auth secret (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:3000

# AI (OpenRouter)
OPENROUTER_API_KEY=your-openrouter-api-key
```

### Database Setup

```bash
# Push schema to database
npm run db:push

# (Optional) Seed demo data
npm run db:seed
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login & register pages
│   ├── (dashboard)/     # Dashboard, portfolio, goals, stock detail
│   ├── api/             # Route handlers (stocks, orders, goals, AI, etc.)
│   └── globals.css
├── components/
│   ├── auth/            # Login & register forms
│   ├── dashboard/       # Market board, charts, order dialog, etc.
│   └── ui/              # shadcn/ui base components
├── lib/
│   ├── ai.ts            # OpenRouter AI helpers
│   ├── auth.ts          # better-auth config
│   ├── db/              # Drizzle schema & client
│   └── yahoo-finance.ts # Yahoo Finance data layer
└── scripts/
    └── seed-demo.ts     # Demo data seeder
```

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run db:push      # Sync schema to Turso
npm run db:studio    # Open Drizzle Studio (DB GUI)
npm run db:seed      # Seed demo data
```

## License

MIT License

Copyright (c) 2025 Firyal Ihsani

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

> This project is for educational purposes only. Not financial advice.
