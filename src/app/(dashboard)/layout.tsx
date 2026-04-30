import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");

  const user = session.user as typeof session.user & {
    riskProfile?: string | null;
    virtualBalance?: number | null;
    onboardingCompleted?: boolean | null;
  };

  if (!user.onboardingCompleted) redirect("/onboarding");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={{ name: user.name, email: user.email, riskProfile: user.riskProfile }} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 shrink-0 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              {/* <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                placeholder="Search stocks… e.g. BBCA"
                className="pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
              /> */}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block mr-3">
              <p className="text-xs text-muted-foreground">Virtual Balance</p>
              <p className="text-sm font-bold text-primary">
                Rp {((user.virtualBalance || 0) / 1e6).toFixed(1)}jt
              </p>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="w-5 h-5" />
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
