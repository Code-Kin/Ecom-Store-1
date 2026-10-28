"use client";
// Admin order management: view, process, update status, tracking + notes.
import { useEffect, useMemo, useState } from "react";
import { Search, X, Package, Truck, MapPin } from "lucide-react";
import { cents, statusColor, timeAgo, fullDate } from "@/lib/format";

type Item = { id: number; productName: string; productImage: string; quantity: number; priceCents: number; size: string };
type Order = {
  id: number; status: string; totalCents: number; subtotalCents: number; shippingCents: number; taxCents: number;
  shippingName: string; shippingAddress: string; shippingCity: string; shippingZip: string;
  customerEmail: string; paymentMethod: string; paymentStatus: string;
  trackingNumber: string | null; notes: string | null; createdAt: string; items: Item[];
};

const STATUSES = ["all", "pending", "processing", "shipped", "delivered", "cancelled"] as const;

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<Order | null>(null);
  const [edit, setEdit] = useState({ status: "", tracking: "", notes: "", payment: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/orders?all=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (q) {
        const hay = `#${o.id} ${o.shippingName} ${o.customerEmail} ${o.trackingNumber || ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [orders, status, q]);

  const openDetail = (o: Order) => {
    setDetail(o);
    setEdit({ status: o.status, tracking: o.trackingNumber || "", notes: o.notes || "", payment: o.paymentStatus });
  };

  const quickStatus = async (o: Order, next: string) => {
    const res = await fetch(`/api/orders/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    if (res.ok) {
      const d = await res.json();
      setOrders((l) => l.map((x) => (x.id === o.id ? { ...x, status: d.order.status } : x)));
      if (detail?.id === o.id) setDetail({ ...detail, status: d.order.status });
    }
  };

  const saveDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;
    setSaving(true);
    const res = await fetch(`/api/orders/${detail.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: edit.status, trackingNumber: edit.tracking, notes: edit.notes, paymentStatus: edit.payment }),
    });
    setSaving(false);
    if (res.ok) {
      const d = await res.json();
      setOrders((l) => l.map((x) => (x.id === detail.id ? { ...x, ...d.order } : x)));
      setDetail({ ...detail, ...d.order });
    }
  };

  return (
    <div>
      <div>
        <h1 className="font-display text-[28px] font-bold">Orders</h1>
        <p className="text-sm text-mocha">{orders.length} total · {cents(orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.totalCents, 0))} lifetime revenue</p>
      </div>

      {/* Status tabs */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
              status === s ? "bg-ink text-cream" : "bg-white text-cocoa ring-1 ring-ink/10 hover:ring-rosewood"
            }`}
          >
            {s === "all" ? "All orders" : s}
            <span className={`rounded-full px-1.5 text-xs font-bold ${status === s ? "bg-cream/20" : "bg-stone-100"}`}>{counts[s] || 0}</span>
          </button>
        ))}
      </div>

      <div className="relative mt-3">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mocha" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by order #, customer, email, or tracking…"
          className="w-full rounded-2xl border-0 bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none ring-1 ring-ink/10 focus:ring-2 focus:ring-rosewood"
        />
      </div>

      {/* Table */}
      <div className="mt-3 overflow-hidden rounded-2xl bg-white ring-1 ring-ink/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/8 bg-cream/60 text-[12px] uppercase tracking-wider text-mocha">
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-3 py-3 font-semibold">Customer</th>
                <th className="px-3 py-3 font-semibold">Items</th>
                <th className="px-3 py-3 font-semibold">Total</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="px-4 py-10 text-center text-mocha">Loading orders…</td></tr>}
              {!loading && filtered.map((o) => (
                <tr key={o.id} className="border-b border-ink/5 last:border-0 hover:bg-cream/40">
                  <td className="px-4 py-3">
                    <p className="font-bold">#{o.id}</p>
                    <p className="text-xs text-mocha">{timeAgo(o.createdAt)}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium">{o.shippingName}</p>
                    <p className="text-xs text-mocha">{o.customerEmail}</p>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {o.items.slice(0, 3).map((it) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={it.id} src={it.productImage} alt="" className="h-9 w-7 rounded-md object-cover ring-2 ring-white" />
                        ))}
                      </div>
                      <span className="text-xs text-mocha">{o.items.reduce((s, i) => s + i.quantity, 0)} pcs</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-bold">{cents(o.totalCents)}</td>
                  <td className="px-3 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => quickStatus(o, e.target.value)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wider outline-none ${statusColor(o.status)}`}
                      aria-label={`Status for order ${o.id}`}
                    >
                      <option value="pending">pending</option>
                      <option value="processing">processing</option>
                      <option value="shipped">shipped</option>
                      <option value="delivered">delivered</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openDetail(o)} className="rounded-full bg-stone-100 px-4 py-1.5 text-[13px] font-semibold hover:bg-ink hover:text-cream">
                      Details
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-mocha">No orders match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-ink/60 animate-overlay" onClick={() => setDetail(null)} />
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-cream p-6 animate-pop sm:rounded-3xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">Order #{detail.id}</h2>
                <p className="text-[13px] text-mocha">{fullDate(detail.createdAt)} · {detail.paymentMethod} · <span className={`font-semibold ${statusColor(detail.paymentStatus)} rounded-full border px-2 py-0.5 text-[11px]`}>{detail.paymentStatus}</span></p>
              </div>
              <button onClick={() => setDetail(null)} className="rounded-full p-2 hover:bg-linen" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/5">
                <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-mocha"><MapPin className="h-3.5 w-3.5" /> Ship to</p>
                <p className="mt-1.5 text-sm font-bold">{detail.shippingName}</p>
                <p className="text-sm text-cocoa">{detail.shippingAddress}<br />{detail.shippingCity} {detail.shippingZip}</p>
                <p className="mt-1 text-[13px] text-mocha">{detail.customerEmail}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/5">
                <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-mocha"><Package className="h-3.5 w-3.5" /> Totals</p>
                <dl className="mt-1.5 space-y-1 text-sm">
                  <div className="flex justify-between"><dt className="text-cocoa">Subtotal</dt><dd className="font-semibold">{cents(detail.subtotalCents)}</dd></div>
                  <div className="flex justify-between"><dt className="text-cocoa">Shipping</dt><dd className="font-semibold">{detail.shippingCents === 0 ? "FREE" : cents(detail.shippingCents)}</dd></div>
                  <div className="flex justify-between"><dt className="text-cocoa">Tax</dt><dd className="font-semibold">{cents(detail.taxCents)}</dd></div>
                  <div className="flex justify-between border-t border-ink/10 pt-1.5"><dt className="font-bold">Total</dt><dd className="font-bold text-rosedeep">{cents(detail.totalCents)}</dd></div>
                </dl>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {detail.items.map((it) => (
                <div key={it.id} className="flex items-center gap-3 rounded-xl bg-white p-2.5 ring-1 ring-ink/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.productImage} alt={it.productName} className="h-12 w-10 rounded-lg object-cover" />
                  <span className="flex-1 text-sm font-medium">{it.productName} <span className="text-mocha">· {it.size} · ×{it.quantity}</span></span>
                  <span className="text-sm font-bold">{cents(it.priceCents * it.quantity)}</span>
                </div>
              ))}
            </div>

            <form onSubmit={saveDetail} className="mt-4 grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[12px] font-bold uppercase tracking-widest text-mocha">Status</label>
                <select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })} className="w-full rounded-xl border border-ink/15 bg-cream/50 px-3 py-2 text-sm font-semibold outline-none">
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-bold uppercase tracking-widest text-mocha">Payment</label>
                <select value={edit.payment} onChange={(e) => setEdit({ ...edit, payment: e.target.value })} className="w-full rounded-xl border border-ink/15 bg-cream/50 px-3 py-2 text-sm font-semibold outline-none">
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-mocha"><Truck className="h-3.5 w-3.5" /> Tracking number</label>
                <input value={edit.tracking} onChange={(e) => setEdit({ ...edit, tracking: e.target.value })} placeholder="SB-XXXXXX" className="w-full rounded-xl border border-ink/15 bg-cream/50 px-3 py-2 text-sm outline-none focus:border-rosewood" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[12px] font-bold uppercase tracking-widest text-mocha">Internal notes</label>
                <textarea rows={2} value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} placeholder="Gift wrap requested, left at door, …" className="w-full rounded-xl border border-ink/15 bg-cream/50 px-3 py-2 text-sm outline-none focus:border-rosewood" />
              </div>
              <div className="sm:col-span-2">
                <button disabled={saving} className="w-full rounded-full bg-ink py-2.5 text-sm font-semibold text-cream hover:bg-rosewood disabled:opacity-60">
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
