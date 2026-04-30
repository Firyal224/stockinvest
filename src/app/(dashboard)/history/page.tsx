"use client";

import { useEffect, useState } from "react";
import { History, TrendingUp, TrendingDown, Loader2, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatIDR, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

interface Order {
  id: string;
  symbol: string;
  type: string;
  orderType: string;
  lots: number;
  pricePerShare: number;
  totalValue: number;
  status: string;
  aiWarning: string | null;
  executedAt: string;
}

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalBought = orders.filter((o) => o.type === "buy").reduce((s, o) => s + o.totalValue, 0);
  const totalSold = orders.filter((o) => o.type === "sell").reduce((s, o) => s + o.totalValue, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Transaction History</h1>
        <p className="text-muted-foreground text-sm mt-1">All your shadow portfolio trades</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Total Trades</p>
            <p className="text-2xl font-black">{orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Total Bought</p>
            <p className="text-2xl font-black text-emerald-500">{formatIDR(totalBought)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Total Sold</p>
            <p className="text-2xl font-black text-rose-500">{formatIDR(totalSold)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4" /> All Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
          ) : !orders.length ? (
            <div className="text-center py-16 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium mb-2">No transactions yet</p>
              <p className="text-sm mb-4">Make your first shadow trade from any stock detail page.</p>
              <Link href="/dashboard" className="text-primary hover:underline text-sm">Browse Market →</Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stock</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Lots</TableHead>
                  <TableHead className="text-right">Price/Share</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead>Order Type</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link href={`/stock/${encodeURIComponent(order.symbol)}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{order.symbol.replace(".JK", "").slice(0, 2)}</span>
                        </div>
                        <span className="font-semibold text-sm">{order.symbol.replace(".JK", "")}</span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.type === "buy" ? "success" : "danger"} className="gap-1">
                        {order.type === "buy"
                          ? <TrendingUp className="w-3 h-3" />
                          : <TrendingDown className="w-3 h-3" />}
                        {order.type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{order.lots}</TableCell>
                    <TableCell className="text-right text-sm">{order.pricePerShare.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn("font-semibold text-sm", order.type === "buy" ? "text-emerald-500" : "text-rose-500")}>
                        {order.type === "buy" ? "-" : "+"}{formatIDR(order.totalValue)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs capitalize">{order.orderType}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatRelativeTime(new Date(order.executedAt))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
