"use client";
// Secure checkout: delivery details → redirect to Stripe Checkout (ZAR, Visa & Mastercard).
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, CreditCard, User, MapPin, ShieldCheck, AlertCircle } from "lucide-react";
import StoreShell from "@/components/storefront/StoreShell";
import { cents, FREE_DELIVERY_CENTS, DELIVERY_CENTS } from "@/lib/format";
import { useStore } from "@/lib/store-context";

const PROVINCES = ["Western Cape", "Gauteng", "KwaZulu-Natal", "Eastern Cape", "Free State", "Limpopo", "Mpumalanga", "North West", "Northern Cape"];

function CardBadges() {
  return (
    <div className="flex items-center gap-2">
      <span className="rounded-md bg-[#1a1f71] px-2.5 py-1 text-[12px] font-black italic tracking-wide text-white">VISA</span>
      <span className="flex items-center rounded-md bg-white px-2 py-1 ring-1 ring-ink/15" aria-label="Mastercard">
        <span className="h-4 w-4 rounded-full bg-[#eb001b]" />
        <span className="-ml-1.5 h-4 w-4 rounded-full bg-[#f79e1b] mix-blend-multiply" />
      </span>
      <span className="rounded-md bg-[#635bff] px-2.5 py-1 text-[12px] font-bold text-white">stripe</span>
    </div>
  );
}

function CheckoutInner() {
  const { user, cart, cartTotal, showToast } = useStore();
  const router = useRouter();
  const sp = useSearchParams();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(sp.get("cancelled") ? "Payment was cancelled — your bag is saved. You can try again whenever you're ready." : "");
  const [form, setForm] = useState({ email: "", name: "", address: "", city: "", province: "Western Cape", zip: "" });

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        email: user.email || f.email,
        name: user.name || f.name,
        address: (user.address as string) || f.address,
        city: (user.city as string) || f.city,
        zip: (user.zip as string) || f.zip,
      }));
    }
  }, [user]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const shipping = cartTotal >= FREE_DELIVERY_CENTS || cartTotal === 0 ? 0 : DELIVERY_CENTS;
  const vat = Math.round((cartTotal * 15) / 115);
  const total = cartTotal + shipping;

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setPlacing(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: form.email,
          shippingName: form.name,
          shippingAddress: form.address,
          shippingCity: `${form.city}, ${form.province}`,
          shippingZip: form.zip,
          guestItems: cart.map((l) => ({ productId: l.productId, quantity: l.quantity, size: l.size })),
        }),
      });
      const d = await res.json();
      if (!res.ok || !d.url) throw new Error(d.error || "Could not start payment.");
      window.location.href = d.url; // Stripe-hosted, PCI-compliant payment page
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not start payment.";
      setError(msg);
      showToast(msg);
      setPlacing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Your bag is empty</h1>
        <p className="mt-2 text-mocha">Add something beautiful before checking out.</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-ink px-7 py-3 text-sm font-semibold text-cream hover:bg-rosewood">Browse the Boutique</Link>
      </div>
    );
  }

  const input = "w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-[15px] outline-none focus:border-rosewood focus:ring-2 focus:ring-rosewood/20";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display flex items-center gap-2.5 text-[32px] font-bold sm:text-[38px]">
        <Lock className="h-7 w-7 text-sagedeep" /> Secure Checkout
      </h1>
      <p className="mt-1 text-[14.5px] text-mocha">Payments processed by Stripe · Visa & Mastercard · All prices in South African Rand (ZAR)</p>

      {error && (
        <div className="mt-5 flex items-start gap-2 rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-800 ring-1 ring-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {!user && (
        <div className="mt-5 flex flex-col items-start justify-between gap-3 rounded-2xl bg-blush/70 p-4 ring-1 ring-rosewood/15 sm:flex-row sm:items-center">
          <p className="flex items-center gap-2 text-[14.5px] text-cocoa">
            <User className="h-4 w-4 text-rosewood" /> Have an account? Sign in for faster checkout and order tracking.
          </p>
          <Link href="/login?next=/checkout" className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-cream hover:bg-rosewood">Sign In</Link>
        </div>
      )}

      <form onSubmit={pay} className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <section className="rounded-2xl bg-white p-6 ring-1 ring-ink/5">
            <h2 className="font-display flex items-center gap-2 text-xl font-bold"><MapPin className="h-5 w-5 text-rosewood" /> Delivery Details</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[13px] font-semibold text-cocoa">Email for confirmation *</label>
                <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.co.za" className={input} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[13px] font-semibold text-cocoa">Full name *</label>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Thandi Nkosi" className={input} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[13px] font-semibold text-cocoa">Street address *</label>
                <input required value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="12 Long Street, Unit 4" className={input} />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-cocoa">City / Suburb *</label>
                <input required value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Cape Town" className={input} />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-cocoa">Province *</label>
                <select value={form.province} onChange={(e) => set("province", e.target.value)} className={input}>
                  {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-cocoa">Postal code *</label>
                <input required value={form.zip} onChange={(e) => set("zip", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="8001" inputMode="numeric" className={input} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 ring-1 ring-ink/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display flex items-center gap-2 text-xl font-bold"><CreditCard className="h-5 w-5 text-rosewood" /> Payment</h2>
              <CardBadges />
            </div>
            <p className="mt-3 text-[14.5px] leading-relaxed text-cocoa">
              After you click <strong>Pay with Stripe</strong> you&apos;ll be taken to Stripe&apos;s secure payment page to enter your
              <strong> Visa</strong> or <strong>Mastercard</strong> details. 3D Secure verification from your bank may be requested.
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-[13px] text-sagedeep"><ShieldCheck className="h-4 w-4" /> Card details go straight to Stripe (PCI-DSS Level 1) — they never touch our servers.</p>
          </section>
        </div>

        <div className="lg:sticky lg:top-36 lg:self-start">
          <div className="rounded-2xl bg-white p-6 ring-1 ring-ink/5">
            <h2 className="font-display text-xl font-bold">Review ({cart.length} items)</h2>
            <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
              {cart.map((l) => (
                <li key={l.key} className="flex items-center gap-3">
                  <span className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={l.image} alt={l.name} className="h-14 w-12 rounded-lg object-cover" />
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[11px] font-bold text-cream">{l.quantity}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold">{l.name}</span>
                    <span className="text-xs text-mocha">Size {l.size}</span>
                  </span>
                  <span className="text-sm font-bold">{cents(l.priceCents * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-[14.5px]">
              <div className="flex justify-between"><dt className="text-cocoa">Subtotal</dt><dd className="font-semibold">{cents(cartTotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-cocoa">Courier delivery</dt><dd className="font-semibold">{shipping === 0 ? "FREE" : cents(shipping)}</dd></div>
              <div className="flex justify-between border-t border-ink/10 pt-3"><dt className="font-bold">Total (ZAR)</dt><dd className="font-display text-xl font-bold text-rosedeep">{cents(total)}</dd></div>
              <div className="flex justify-between text-[12.5px] text-mocha"><dt>Includes VAT (15%)</dt><dd>{cents(vat)}</dd></div>
            </dl>
            <button
              type="submit"
              disabled={placing}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#635bff] px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-[#4f46e5] disabled:opacity-60"
            >
              <Lock className="h-4 w-4" /> {placing ? "Redirecting to Stripe…" : `Pay ${cents(total)} with Stripe`}
            </button>
            <div className="mt-3 flex justify-center"><CardBadges /></div>
            <button type="button" onClick={() => router.push("/cart")} className="mt-2 w-full rounded-full py-2.5 text-sm font-semibold text-mocha hover:text-ink">
              ← Back to bag
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <StoreShell>
      <Suspense><CheckoutInner /></Suspense>
    </StoreShell>
  );
}
