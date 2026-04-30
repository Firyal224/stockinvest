import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StockInvest — Shadow Portfolio Simulator",
  description:
    "Practice investing in Indonesian stocks (IDX) with real market data, AI analysis, and virtual money. Learn without risk.",
  keywords: ["stock", "IDX", "Indonesia", "portfolio", "simulator", "investment", "AI"],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
    shortcut: "/logo.png",
  },
  openGraph: {
    title: "StockInvest — Shadow Portfolio Simulator",
    description: "Practice investing in IDX stocks with AI-powered analysis and virtual money.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
