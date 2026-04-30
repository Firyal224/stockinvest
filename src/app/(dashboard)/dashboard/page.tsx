import { MarketBoard } from "@/components/dashboard/market/market-board";
import { AIHighlights } from "@/components/dashboard/market/ai-highlights";
import { AIPredictions } from "@/components/dashboard/market/ai-predictions";
import { DividendStocks } from "@/components/dashboard/market/dividend-stocks";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user as typeof session.user & { riskProfile?: string | null };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Market Board</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Live IDX stocks — click any to view details and add to your shadow portfolio.
        </p>
      </div>

      {/* AI Predictions — full width */}
      <AIPredictions />

      {/* AI Highlights + Dividends side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AIHighlights riskProfile={user?.riskProfile || "moderate"} />
        </div>
        <div>
          <DividendStocks />
        </div>
      </div>

      {/* Market Board */}
      <MarketBoard />
    </div>
  );
}
