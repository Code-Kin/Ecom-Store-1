"use client";
// Admin dashboard: sales analytics, inventory status, top products, recent orders.
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign, ShoppingCart, Users, Receipt, Boxes, Inbox,
  ArrowRight, TriangleAlert, TrendingUp, Plus,
} from "lucide-react";
import { cents, statusColor, timeAgo, fullDate } from "@/lib/format";

type Stats = {
  kpis: { revenueCents: number; orderCount: number; customerCount: number; avgOrderCents: number; unreadMessages: number; inventoryUnits: number; activeSkus: number };
  daily: { day: string; totalCents: number; count: number }[];
  byStatus: { status: string; count: number }[];
  topProducts: { productId: number | null; name: string; image: string; units: number; revenueCents: number }[];
  lowStock: { id: number; name: string; imageUrl: string; stock: number; priceCents: number }[];
  recentOrders: { id: number; shippingName: string; customerEmail: string; status: string; totalCents: number; createdAt: string }[];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setStats(d);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-64 rounded-xl bg-white/70" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/70" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-white/70" />
      </div>
    );
  }

  const maxDaily = Math.max(1, ...stats.daily.map((d) => d.totalCents));
  const totalByStatus = stats.byStatus.reduce((s, b) => s + b.count, 0) || 1;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const kpis = [
    { icon: DollarSign, label: "Total Revenue", value: cents(stats.kpis.revenueCents), sub: `${stats.kpis.orderCount} orders all-time`, tint: "bg-emerald-100 text-emerald-700" },
    { icon: ShoppingCart, label: "Orders", value: String(stats.kpis.orderCount), sub: `Avg ${cents(stats.kpis.avgOrderCents)} per order`, tint: "bg-sky-100 text-sky-700" },
    { icon: Users, label: "Customers", value: String(stats.kpis.customerCount), sub: "registered accounts", tint: "bg-violet-100 text-violet-700" },
    { icon: Receipt, label: "Avg. Order Value", value: cents(stats.kpis.avgOrderCents), sub: "excl. cancelled", tint: "bg-amber-100 text-amber-700" },
    { icon: Boxes, label: "Inventory", value: `${stats.kpis.inventoryUnits} units`, sub: `${stats.kpis.activeSkus} active SKUs`, tint: "bg-orange-100 text-orange-700" },
    { icon: Inbox, label: "Unread Messages", value: String(stats.kpis.unreadMessages), sub: "contact + feedback", tint: "bg-rose-100 text-rose-700" },
  ];

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-[28px] font-bold sm:text-[32px]">{greeting}, Sarah ♡</h1>
          <p className="text-sm text-mocha">{fullDate(new Date())} · Here&apos;s what&apos;s happening at the boutique today.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/products" className="flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream hover:bg-rosewood">
            <Plus className="h-4 w-4" /> Add Product
          </Link>
          <Link href="/admin/orders" className="flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold ring-1 ring-ink/10 hover:ring-rosewood">
            View Orders <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink/5">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${k.tint}`}><k.icon className="h-4.5 w-4.5" /></span>
            <p className="mt-3 text-[19px] font-bold leading-none">{k.value}</p>
            <p className="mt-1 text-[12.5px] font-semibold text-cocoa">{k.label}</p>
            <p className="text-[11.5px] text-mocha">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display flex items-center gap-2 text-xl font-bold"><TrendingUp className="h-5 w-5 text-sagedeep" /> Revenue — Last 14 Days</h2>
            <p className="text-[13px] text-mocha">Daily net sales, excluding cancelled orders</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3.5 py-1.5 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200">
            {cents(stats.daily.reduce((s, d) => s + d.totalCents, 0))} / 14d
          </span>
        </div>
        {stats.daily.length === 0 ? (
          <p className="py-10 text-center text-sm text-mocha">No sales in the last 14 days.</p>
        ) : (
          <div className="mt-5 flex h-48 items-end gap-1.5 sm:gap-2.5">
            {stats.daily.map((d) => (
              <div key={d.day} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${d.day}: ${cents(d.totalCents)} (${d.count} orders)`}>
                <span className="hidden text-[11px] font-bold text-rosedeep group-hover:block sm:block sm:opacity-0 sm:group-hover:opacity-100">
                  {d.totalCents >= 10000 ? `$${Math.round(d.totalCents / 100)}` : cents(d.totalCents)}
                </span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-rosewood to-gold transition-all group-hover:from-rosedeep"
                  style={{ height: `${Math.max(4, (d.totalCents / maxDaily) * 100)}%`, minHeight: d.totalCents > 0 ? 10 : 3, opacity: d.totalCents > 0 ? 1 : 0.25 }}
                />
                <span className="text-[10.5px] font-medium text-mocha">{d.day}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {/* Orders by status */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/5">
          <h2 className="font-display text-xl font-bold">Orders by Status</h2>
          <div className="mt-4 space-y-3">
            {stats.byStatus.map((b) => (
              <div key={b.status}>
                <div className="flex items-center justify-between text-sm">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11.5px] font-bold uppercase tracking-wider ${statusColor(b.status)}`}>{b.status}</span>
                  <span className="font-bold">{b.count}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full rounded-full bg-ink" style={{ width: `${(b.count / totalByStatus) * 100}%` }} />
                </div>
              </div>
            ))}
            <Link href="/admin/orders" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-rosewood hover:underline">
              Manage all orders <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Low stock */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/5">
          <h2 className="font-display flex items-center gap-2 text-xl font-bold">
            <TriangleAlert className="h-5 w-5 text-amber-600" /> Low Stock Alerts
          </h2>
          <div className="mt-4 space-y-2.5">
            {stats.lowStock.length === 0 && <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">All stocked up — nice work!</p>}
            {stats.lowStock.slice(0, 5).map((p) => (
              <Link key={p.id} href="/admin/products" className="flex items-center gap-3 rounded-xl bg-cream/60 p-2 ring-1 ring-ink/5 hover:ring-amber-400">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageUrl} alt={p.name} className="h-11 w-9 rounded-lg object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold">{p.name}</span>
                  <span className="text-xs text-mocha">{cents(p.priceCents)}</span>
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.stock === 0 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"}`}>
                  {p.stock === 0 ? "Out" : `${p.stock} left`}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/5">
          <h2 className="font-display text-xl font-bold">Top Products</h2>
          <p className="text-[12.5px] text-mocha">By units sold, all time</p>
          <div className="mt-4 space-y-2.5">
            {stats.topProducts.slice(0, 5).map((t, i) => (
              <div key={`${t.productId}-${i}`} className="flex items-center gap-3">
                <span className="font-display w-6 text-lg font-bold text-blushdeep">#{i + 1}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.image} alt={t.name} className="h-11 w-9 rounded-lg object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold">{t.name}</span>
                  <span className="text-xs text-mocha">{t.units} sold</span>
                </span>
                <span className="text-[13px] font-bold text-sagedeep">{cents(t.revenueCents)}</span>
              </div>
            ))}
            {stats.topProducts.length === 0 && <p className="text-sm text-mocha">No sales yet.</p>}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink/5">
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="font-display text-xl font-bold">Recent Orders</h2>
          <Link href="/admin/orders" className="flex items-center gap-1 text-sm font-semibold text-rosewood hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-y border-ink/8 bg-cream/60 text-[12px] uppercase tracking-wider text-mocha">
                <th className="px-5 py-2.5 font-semibold">Order</th>
                <th className="px-3 py-2.5 font-semibold">Customer</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-3 py-2.5 font-semibold">Total</th>
                <th className="px-5 py-2.5 font-semibold">Placed</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((o) => (
                <tr key={o.id} className="border-b border-ink/5 last:border-0 hover:bg-cream/40">
                  <td className="px-5 py-3 font-bold">#{o.id}</td>
                  <td className="px-3 py-3">
                    <span className="block font-medium">{o.shippingName}</span>
                    <span className="text-xs text-mocha">{o.customerEmail}</span>
                  </td>
                  <td className="px-3 py-3"><span className={`rounded-full border px-2.5 py-0.5 text-[11.5px] font-bold uppercase tracking-wider ${statusColor(o.status)}`}>{o.status}</span></td>
                  <td className="px-3 py-3 font-bold">{cents(o.totalCents)}</td>
                  <td className="px-5 py-3 text-mocha">{timeAgo(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
