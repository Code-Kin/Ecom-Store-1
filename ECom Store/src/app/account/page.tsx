"use client";
// Customer account: profile management + order history with tracking.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, User, LogOut, ChevronDown, MapPin } from "lucide-react";
import StoreShell from "@/components/storefront/StoreShell";
import { cents, statusColor, fullDate } from "@/lib/format";
import { useStore } from "@/lib/store-context";

type OrderItem = { id: number; productName: string; productImage: string; quantity: number; priceCents: number; size: string };
type Order = {
  id: number; status: string; totalCents: number; subtotalCents: number; shippingCents: number; taxCents: number;
  trackingNumber: string | null; createdAt: string; shippingCity: string; paymentStatus: string; items: OrderItem[];
};

export default function AccountPage() {
  const { user, loadingUser, refreshUser, logout, showToast } = useStore();
  const router = useRouter();
  const [tab, setTab] = useState<"orders" | "profile">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const [profile, setProfile] = useState({ name: "", phone: "", address: "", city: "", zip: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loadingUser && !user) router.push("/login?next=/account");
  }, [loadingUser, user, router]);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        phone: (user.phone as string) || "",
        address: (user.address as string) || "",
        city: (user.city as string) || "",
        zip: (user.zip as string) || "",
      });
      fetch("/api/orders", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setOrders(d.orders || []))
        .finally(() => setLoadingOrders(false));
    }
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/auth/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
    setSaving(false);
    if (res.ok) {
      await refreshUser();
      showToast("Profile saved!");
    } else showToast("Could not save profile.");
  };

  const cancelOrder = async (id: number) => {
    if (!confirm("Cancel this order?")) return;
    const res = await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "cancelled" }) });
    if (res.ok) {
      setOrders((os) => os.map((o) => (o.id === id ? { ...o, status: "cancelled" } : o)));
      showToast("Order cancelled.");
    } else showToast("Could not cancel this order.");
  };

  if (loadingUser || !user) {
    return (
      <StoreShell>
        <div className="mx-auto max-w-4xl px-4 py-20 text-center text-mocha">Loading your account…</div>
      </StoreShell>
    );
  }

  const input = "w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-[15px] outline-none focus:border-rosewood focus:ring-2 focus:ring-rosewood/20";

  return (
    <StoreShell>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.24em] text-golddeep">My account</p>
            <h1 className="font-display text-[32px] font-bold">Hello, {user.name.split(" ")[0]} ♡</h1>
            <p className="text-sm text-mocha">{user.email}</p>
          </div>
          <button onClick={logout} className="flex w-fit items-center gap-2 rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold hover:border-rose-300 hover:text-rose-700">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>

        <div className="mt-6 flex gap-2">
          {(
            [
              ["orders", "My Orders", Package],
              ["profile", "Profile & Address", User],
            ] as const
          ).map(([v, l, Icon]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${tab === v ? "bg-ink text-cream" : "bg-white text-cocoa ring-1 ring-ink/10 hover:ring-rosewood"}`}
            >
              <Icon className="h-4 w-4" /> {l}
            </button>
          ))}
        </div>

        {tab === "orders" && (
          <div className="mt-5 space-y-3">
            {loadingOrders ? (
              <p className="rounded-2xl bg-white p-8 text-center text-mocha ring-1 ring-ink/5">Loading orders…</p>
            ) : orders.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-ink/5">
                <Package className="mx-auto h-10 w-10 text-mocha/50" />
                <p className="font-display mt-3 text-xl font-bold">No orders yet</p>
                <p className="mt-1 text-sm text-mocha">Your order history will appear here.</p>
                <Link href="/shop" className="mt-5 inline-block rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-cream hover:bg-rosewood">Start Shopping</Link>
              </div>
            ) : (
              orders.map((o) => (
                <div key={o.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink/5">
                  <button onClick={() => setOpenId(openId === o.id ? null : o.id)} className="flex w-full items-center gap-4 p-4 text-left sm:p-5">
                    <div className="flex -space-x-3">
                      {o.items.slice(0, 3).map((it) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={it.id} src={it.productImage} alt="" className="h-12 w-10 rounded-lg object-cover ring-2 ring-white" />
                      ))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold">Order #{o.id} <span className="font-normal text-mocha">· {fullDate(o.createdAt)}</span></p>
                      <p className="mt-0.5 truncate text-[13px] text-mocha">{o.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}</p>
                    </div>
                    <span className={`hidden rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider sm:inline ${statusColor(o.status)}`}>{o.status}</span>
                    <span className="text-[15px] font-bold">{cents(o.totalCents)}</span>
                    <ChevronDown className={`h-4 w-4 text-mocha transition ${openId === o.id ? "rotate-180" : ""}`} />
                  </button>
                  {openId === o.id && (
                    <div className="border-t border-ink/10 bg-cream/50 p-4 sm:p-5 animate-fade-up">
                      <div className="flex flex-wrap items-center gap-2 text-[13px]">
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider sm:hidden ${statusColor(o.status)}`}>{o.status}</span>
                        {o.trackingNumber && <span className="rounded-full bg-white px-3 py-1 ring-1 ring-ink/10">Tracking: <strong>{o.trackingNumber}</strong></span>}
                        <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-ink/10"><MapPin className="h-3 w-3" /> {o.shippingCity}</span>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusColor(o.paymentStatus)}`}>{o.paymentStatus}</span>
                      </div>
                      {/* Progress */}
                      <div className="mt-4 flex items-center">
                        {["pending", "processing", "shipped", "delivered"].map((s, i, arr) => {
                          const idx = arr.indexOf(o.status === "cancelled" ? "pending" : o.status);
                          const doneStep = i <= idx && o.status !== "cancelled";
                          return (
                            <div key={s} className="flex flex-1 items-center last:flex-none">
                              <div className="flex flex-col items-center">
                                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${doneStep ? "bg-sagedeep text-white" : "bg-stone-200 text-stone-500"}`}>{i + 1}</span>
                                <span className="mt-1 text-[11px] font-semibold capitalize text-cocoa">{s}</span>
                              </div>
                              {i < arr.length - 1 && <div className={`mx-1 mb-5 h-0.5 flex-1 rounded ${i < idx && o.status !== "cancelled" ? "bg-sagedeep" : "bg-stone-200"}`} />}
                            </div>
                          );
                        })}
                      </div>
                      <ul className="mt-3 space-y-2">
                        {o.items.map((it) => (
                          <li key={it.id} className="flex items-center gap-3 rounded-xl bg-white p-2.5 ring-1 ring-ink/5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={it.productImage} alt={it.productName} className="h-12 w-10 rounded-lg object-cover" />
                            <span className="flex-1 text-sm font-medium">{it.productName} <span className="text-mocha">· Size {it.size} · Qty {it.quantity}</span></span>
                            <span className="text-sm font-bold">{cents(it.priceCents * it.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="text-cocoa">Subtotal {cents(o.subtotalCents)} · Shipping {o.shippingCents === 0 ? "FREE" : cents(o.shippingCents)} · Tax {cents(o.taxCents)}</span>
                        <span className="font-bold">Total {cents(o.totalCents)}</span>
                      </div>
                      {["pending", "processing"].includes(o.status) && (
                        <button onClick={() => cancelOrder(o.id)} className="mt-3 rounded-full border border-rose-200 px-4 py-1.5 text-[13px] font-semibold text-rose-700 hover:bg-rose-50">
                          Cancel Order
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "profile" && (
          <form onSubmit={saveProfile} className="mt-5 rounded-2xl bg-white p-6 ring-1 ring-ink/5">
            <h2 className="font-display text-xl font-bold">Profile & Default Address</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-cocoa">Full name</label>
                <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className={input} />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-cocoa">Phone</label>
                <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+27 82 000 0000" className={input} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[13px] font-semibold text-cocoa">Street address</label>
                <input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="123 Main St" className={input} />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-cocoa">City</label>
                <input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} className={input} />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-cocoa">ZIP</label>
                <input value={profile.zip} onChange={(e) => setProfile({ ...profile, zip: e.target.value })} className={input} />
              </div>
            </div>
            <button disabled={saving} className="mt-5 rounded-full bg-ink px-7 py-2.5 text-sm font-semibold text-cream hover:bg-rosewood disabled:opacity-60">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </form>
        )}
      </div>
    </StoreShell>
  );
}
