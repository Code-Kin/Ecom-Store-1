"use client";
// Shopping bag page: full cart management + order summary + cross-sell.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft, Truck, Lock } from "lucide-react";
import StoreShell from "@/components/storefront/StoreShell";
import ProductCard, { type CardProduct } from "@/components/storefront/ProductCard";
import { cents } from "@/lib/format";
import { useStore } from "@/lib/store-context";

export default function CartPage() {
  const { cart, updateQty, removeLine, cartTotal, cartCount } = useStore();
  const [suggest, setSuggest] = useState<CardProduct[]>([]);

  useEffect(() => {
    fetch("/api/products?featured=1&limit=4").then((r) => r.json()).then((d) => setSuggest(d.products || []));
  }, []);

  const shipping = cartTotal >= 100000 || cartTotal === 0 ? 0 : 695;
  const tax = Math.round(cartTotal * 15 / 115);
  const total = cartTotal + shipping; // prices are VAT-inclusive
  const remaining = 100000 - cartTotal;

  return (
    <StoreShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-[32px] font-bold sm:text-[38px]">Shopping Bag {cartCount > 0 && <span className="text-mocha">({cartCount})</span>}</h1>

        {cart.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-3xl bg-white/70 px-6 py-20 text-center ring-1 ring-ink/5">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-linen text-mocha"><ShoppingBag className="h-7 w-7" /></span>
            <h2 className="font-display mt-4 text-2xl font-bold">Your bag is empty</h2>
            <p className="mt-1 text-mocha">Let&apos;s fix that — our bestsellers are waiting.</p>
            <Link href="/shop" className="mt-6 flex items-center gap-2 rounded-full bg-ink px-7 py-3 text-sm font-semibold text-cream hover:bg-rosewood">
              Start Shopping <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-3">
              {remaining > 0 ? (
                <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/5">
                  <p className="flex items-center gap-2 text-sm text-cocoa"><Truck className="h-4 w-4 text-rosewood" /> Add <strong>{cents(remaining)}</strong> more for free shipping</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-linen">
                    <div className="h-full rounded-full bg-gradient-to-r from-gold to-rosewood" style={{ width: `${Math.min(100, (cartTotal / 100000) * 100)}%` }} />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-sage/15 p-4 text-sm font-semibold text-sagedeep ring-1 ring-sage/30">
                  🎉 You&apos;ve unlocked FREE standard shipping!
                </div>
              )}
              {cart.map((line) => (
                <div key={line.key} className="flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-ink/5">
                  <Link href={`/product/${line.productId}`} className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={line.image} alt={line.name} className="h-28 w-22 rounded-xl object-cover sm:h-32 sm:w-24" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link href={`/product/${line.productId}`} className="font-display text-[17px] font-semibold hover:text-rosewood">{line.name}</Link>
                        <p className="mt-0.5 text-[13px] text-mocha">Size {line.size} · {cents(line.priceCents)} each</p>
                      </div>
                      <button onClick={() => removeLine(line.key)} className="flex items-center gap-1 rounded-lg p-1.5 text-[13px] text-mocha hover:bg-blush hover:text-rosedeep" aria-label="Remove">
                        <Trash2 className="h-4 w-4" /> <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center rounded-full border border-ink/15">
                        <button onClick={() => updateQty(line.key, line.quantity - 1)} className="p-2 px-3 hover:text-rosewood" aria-label="Decrease"><Minus className="h-4 w-4" /></button>
                        <span className="min-w-7 text-center text-[15px] font-bold">{line.quantity}</span>
                        <button onClick={() => updateQty(line.key, line.quantity + 1)} className="p-2 px-3 hover:text-rosewood" aria-label="Increase"><Plus className="h-4 w-4" /></button>
                      </div>
                      <span className="text-lg font-bold text-rosedeep">{cents(line.priceCents * line.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
              <Link href="/shop" className="inline-flex items-center gap-2 pt-2 text-sm font-semibold text-rosewood hover:text-rosedeep">
                <ArrowLeft className="h-4 w-4" /> Continue shopping
              </Link>
            </div>

            {/* Summary */}
            <div className="lg:sticky lg:top-36 lg:self-start">
              <div className="rounded-2xl bg-white p-6 ring-1 ring-ink/5">
                <h2 className="font-display text-xl font-bold">Order Summary</h2>
                <dl className="mt-4 space-y-2.5 text-[14.5px]">
                  <div className="flex justify-between"><dt className="text-cocoa">Subtotal</dt><dd className="font-semibold">{cents(cartTotal)}</dd></div>
                  <div className="flex justify-between"><dt className="text-cocoa">Shipping</dt><dd className="font-semibold">{shipping === 0 ? "FREE" : cents(shipping)}</dd></div>
                  <div className="flex justify-between"><dt className="text-cocoa">VAT incl. (15%)</dt><dd className="font-semibold">{cents(tax)}</dd></div>
                  <div className="flex justify-between border-t border-ink/10 pt-3 text-base"><dt className="font-bold">Total</dt><dd className="font-display text-xl font-bold text-rosedeep">{cents(total)}</dd></div>
                </dl>
                <Link href="/checkout" className="mt-5 flex items-center justify-center gap-2 rounded-full bg-rosewood px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-rosedeep">
                  <Lock className="h-4 w-4" /> Secure Checkout
                </Link>
                <p className="mt-3 text-center text-xs text-mocha">256-bit SSL encrypted · Visa & Mastercard via Stripe</p>
              </div>
            </div>
          </div>
        )}

        {suggest.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl font-bold">Complete the Look</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {suggest.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </StoreShell>
  );
}
