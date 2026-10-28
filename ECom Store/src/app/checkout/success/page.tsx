"use client";
// Stripe return page: verifies the session server-side, then shows the confirmation.
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PartyPopper, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import StoreShell from "@/components/storefront/StoreShell";
import { cents } from "@/lib/format";
import { useStore } from "@/lib/store-context";

function SuccessInner() {
  const sp = useSearchParams();
  const { user, clearCart } = useStore();
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [data, setData] = useState<{ orderId?: number; trackingNumber?: string; totalCents?: number; error?: string }>({});

  useEffect(() => {
    const id = sp.get("session_id");
    if (!id) {
      setState("error");
      setData({ error: "Missing payment reference." });
      return;
    }
    fetch(`/api/checkout/confirm?session_id=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        setData(d);
        setState(r.ok ? "ok" : "error");
        if (r.ok) clearCart();
      })
      .catch(() => {
        setState("error");
        setData({ error: "Could not verify payment." });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  if (state === "loading") {
    return (
      <div className="mx-auto max-w-xl px-4 py-28 text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-rosewood" />
        <p className="font-display mt-4 text-2xl font-bold">Confirming your payment with Stripe…</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-700"><AlertCircle className="h-8 w-8" /></span>
        <h1 className="font-display mt-4 text-3xl font-bold">Payment not completed</h1>
        <p className="mt-2 text-cocoa">{data.error}</p>
        <Link href="/checkout" className="mt-6 inline-block rounded-full bg-ink px-7 py-3 text-sm font-semibold text-cream hover:bg-rosewood">Back to Checkout</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><PartyPopper className="h-9 w-9" /></span>
      <h1 className="font-display mt-5 text-[36px] font-bold">Dankie — order confirmed!</h1>
      <p className="mt-2 text-[16px] text-cocoa">
        Order <strong className="text-ink">#{data.orderId}</strong> · Tracking <strong className="text-ink">{data.trackingNumber}</strong>
      </p>
      <p className="mt-1 text-[15px] text-mocha">Our family will hand-pack your order in Cape Town within 1–2 business days. Courier delivery takes 2–4 working days.</p>
      <div className="mx-auto mt-6 max-w-md rounded-2xl bg-white p-5 text-left ring-1 ring-ink/5">
        <div className="flex justify-between text-sm"><span className="text-cocoa">Amount paid</span><strong>{cents(data.totalCents)}</strong></div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-sagedeep"><ShieldCheck className="h-4 w-4" /> Paid securely via Stripe</div>
      </div>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href={user ? "/account" : "/register"} className="rounded-full bg-ink px-7 py-3 text-sm font-semibold text-cream hover:bg-rosewood">
          {user ? "Track in My Account" : "Create Account to Track"}
        </Link>
        <Link href="/shop" className="rounded-full border border-ink/20 px-7 py-3 text-sm font-semibold hover:border-rosewood hover:text-rosewood">Keep Shopping</Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <StoreShell>
      <Suspense><SuccessInner /></Suspense>
    </StoreShell>
  );
}
