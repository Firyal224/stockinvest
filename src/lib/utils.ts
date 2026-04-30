import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatIDRCompact(amount: number): string {
  if (Math.abs(amount) >= 1e12) return `Rp ${(amount / 1e12).toFixed(1)}T`;
  if (Math.abs(amount) >= 1e9) return `Rp ${(amount / 1e9).toFixed(1)}M`;
  if (Math.abs(amount) >= 1e6) return `Rp ${(amount / 1e6).toFixed(1)}jt`;
  if (Math.abs(amount) >= 1e3) return `Rp ${(amount / 1e3).toFixed(0)}rb`;
  return formatIDR(amount);
}

export function formatPercent(value: number, decimals = 2): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num);
}

export function getPnLColor(value: number): string {
  if (value > 0) return "text-emerald-500";
  if (value < 0) return "text-rose-500";
  return "text-muted-foreground";
}

export function getPnLBg(value: number): string {
  if (value > 0) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  if (value < 0) return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
  return "bg-muted text-muted-foreground";
}

export function formatDate(date: Date | number): string {
  const d = typeof date === "number" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatRelativeTime(date: Date | number): string {
  const d = typeof date === "number" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export const RISK_PROFILE_LABELS: Record<string, string> = {
  conservative: "Conservative",
  moderate: "Moderate",
  aggressive: "Aggressive",
};

export const RISK_PROFILE_COLORS: Record<string, string> = {
  conservative: "text-blue-500",
  moderate: "text-amber-500",
  aggressive: "text-rose-500",
};

export const GOAL_CATEGORIES = [
  { value: "nikah", label: "Wedding Fund", icon: "💍" },
  { value: "rumah", label: "House Down Payment", icon: "🏠" },
  { value: "darurat", label: "Emergency Fund", icon: "🛡️" },
  { value: "pensiun", label: "Retirement", icon: "🏖️" },
  { value: "pendidikan", label: "Education", icon: "🎓" },
  { value: "lainnya", label: "Other", icon: "🎯" },
];
