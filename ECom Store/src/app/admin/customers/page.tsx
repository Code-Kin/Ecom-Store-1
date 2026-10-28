"use client";
// Admin customer directory: profiles, order rollups, purchase history.
import { useEffect, useMemo, useState } from "react";
import { Search, X, Mail, Phone, MapPin, CalendarDays, ShoppingBag } from "lucide-react";
import { cents, timeAgo, fullDate, statusColor } from "@/lib/format";

type Customer = {
  id: number; name: string; email: string; phone: string | null; address: string | null;
  city: string | null; zip: string | null; createdAt: string;
  orderCount: number; totalSpentCents: number; lastOrderAt: string | null;
};
type Order = { id: number; userId: number | null; status: string; totalCents: number; createdAt: string; customerEmail: string };

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<Customer | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/customers", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/orders?all=1", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([c, o]) => {
        setCustomers(c.customers || []);
        setOrders(o.orders || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return customers;
    const needle = q.toLowerCase();
    return customers.filter((c) => `${c.name} ${c.email} ${c.city || ""}`.toLowerCase().includes(needle));
  }, [customers, q]);

  const detailOrders = detail ? orders.filter((o) => o.userId === detail.id || o.customerEmail.toLowerCase() === detail.email.toLowerCase()) : [];

  const totals = useMemo(() => ({
    count: customers.length,
    spent: customers.reduce((s, c) => s + c.totalSpentCents, 0),
    orders: customers.reduce((s, c) => s + c.orderCount, 0),
  }), [customers]);

  return (
    <div>
      <div>
        <h1 className="font-display text-[28px] font-bold">Customers</h1>
        <p className="text-sm text-mocha">{totals.count} registered · {totals.orders} orders · {cents(totals.spent)} lifetime value</p>
      </div>

      <div className="relative mt-4">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mocha" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, email, or city…"
          className="w-full rounded-2xl border-0 bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none ring-1 ring-ink/10 focus:ring-2 focus:ring-rosewood"
        />
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl bg-white ring-1 ring-ink/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/8 bg-cream/60 text-[12px] uppercase tracking-wider text-mocha">
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-3 py-3 font-semibold">Location</th>
                <th className="px-3 py-3 font-semibold">Orders</th>
                <th className="px-3 py-3 font-semibold">Total Spent</th>
                <th className="px-3 py-3 font-semibold">Last Order</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="px-4 py-10 text-center text-mocha">Loading customers…</td></tr>}
              {!loading && filtered.map((c) => (
                <tr key={c.id} onClick={() => setDetail(c)} className="cursor-pointer border-b border-ink/5 last:border-0 hover:bg-cream/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blush font-display text-[15px] font-bold text-rosedeep">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-xs text-mocha">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-cocoa">{c.city || "—"}</td>
                  <td className="px-3 py-3"><span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold">{c.orderCount}</span></td>
                  <td className="px-3 py-3 font-bold text-sagedeep">{cents(c.totalSpentCents)}</td>
                  <td className="px-3 py-3 text-mocha">{c.lastOrderAt ? timeAgo(c.lastOrderAt) : "—"}</td>
                  <td className="px-4 py-3 text-mocha">{timeAgo(c.createdAt)}</td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-mocha">No customers match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-ink/60 animate-overlay" onClick={() => setDetail(null)} />
          <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream p-6 animate-pop sm:rounded-3xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rosewood font-display text-2xl font-bold text-white">
                  {detail.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold">{detail.name}</h2>
                  <p className="text-[13px] text-mocha">Customer #{detail.id}</p>
                </div>
              </div>
              <button onClick={() => setDetail(null)} className="rounded-full p-2 hover:bg-linen" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                [String(detail.orderCount), "Orders"],
                [cents(detail.totalSpentCents), "Lifetime"],
                [detail.lastOrderAt ? timeAgo(detail.lastOrderAt) : "—", "Last order"],
              ].map(([v, l]) => (
                <div key={l as string} className="rounded-2xl bg-white p-3 ring-1 ring-ink/5">
                  <p className="text-[15px] font-bold">{v}</p>
                  <p className="text-[11.5px] text-mocha">{l}</p>
                </div>
              ))}
            </div>

            <ul className="mt-3 space-y-2.5 rounded-2xl bg-white p-4 text-sm ring-1 ring-ink/5">
              <li className="flex items-center gap-2.5"><Mail className="h-4 w-4 shrink-0 text-mocha" /> {detail.email}</li>
              <li className="flex items-center gap-2.5"><Phone className="h-4 w-4 shrink-0 text-mocha" /> {detail.phone || "—"}</li>
              <li className="flex items-start gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-mocha" /> {detail.address ? `${detail.address}, ${detail.city || ""} ${detail.zip || ""}` : "No address on file"}</li>
              <li className="flex items-center gap-2.5"><CalendarDays className="h-4 w-4 shrink-0 text-mocha" /> Joined {fullDate(detail.createdAt)}</li>
            </ul>

            <h3 className="mt-4 flex items-center gap-2 text-sm font-bold"><ShoppingBag className="h-4 w-4 text-rosewood" /> Order history ({detailOrders.length})</h3>
            <div className="mt-2 space-y-2">
              {detailOrders.length === 0 && <p className="rounded-xl bg-white p-4 text-sm text-mocha ring-1 ring-ink/5">No orders yet.</p>}
              {detailOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 text-sm ring-1 ring-ink/5">
                  <span className="font-bold">#{o.id} <span className="font-normal text-mocha">· {timeAgo(o.createdAt)}</span></span>
                  <span className="flex items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase ${statusColor(o.status)}`}>{o.status}</span>
                    <span className="font-bold">{cents(o.totalCents)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
