"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Briefcase, Target,
  Bookmark, History, LogOut, ChevronLeft, ChevronRight, Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Market Board" },
  { href: "/portfolio", icon: Briefcase, label: "Portfolio" },
  { href: "/goals", icon: Target, label: "Goals" },
  { href: "/watchlist", icon: Bookmark, label: "Watchlist" },
  { href: "/history", icon: History, label: "History" },
  { href: "/ai-mentor", icon: Brain, label: "AI Mentor" },
];

interface SidebarProps {
  user: { name: string; email: string; riskProfile?: string | null };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "relative flex flex-col h-full border-r border-border bg-card transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-60"
      )}>
        {/* Logo */}
        <div className={cn("flex items-center gap-3 p-4 border-b border-border h-16", collapsed && "justify-center")}>
          <Image src="/logo.png" alt="StockInvest" width={32} height={32} className="rounded-lg shrink-0" />
          {!collapsed && <span className="font-bold text-base truncate">StockInvest</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Tooltip key={href}>
                <TooltipTrigger asChild>
                  <Link href={href} className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    collapsed && "justify-center px-2"
                  )}>
                    <Icon className="w-5 h-5 shrink-0" />
                    {!collapsed && <span>{label}</span>}
                  </Link>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">{label}</TooltipContent>}
              </Tooltip>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-border space-y-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg", collapsed && "justify-center")}>
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarFallback className="text-xs gradient-brand text-white">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.riskProfile || "No profile"}</p>
                  </div>
                )}
              </div>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">{user.name}<br />{user.riskProfile}</TooltipContent>}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleSignOut}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors",
                  collapsed && "justify-center"
                )}
              >
                <LogOut className="w-4 h-4 shrink-0" />
                {!collapsed && "Sign Out"}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Sign Out</TooltipContent>}
          </Tooltip>
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full border border-border bg-background flex items-center justify-center hover:bg-accent transition-colors shadow-sm"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>
    </TooltipProvider>
  );
}
