"use client";
// Slide-over shopping bag with free-shipping progress + quantity controls.
import Link from "next/link";
import { X, Minus, Plus, Trash2, ShoppingBag, Truck, Lock } from "lucide-react";
import { cents } from "@/lib/format";
import { useStore } from "@/lib/store-context";

const FREE_SHIP = 100000;

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateQty, removeLine, cartTotal, cartCount } = useStore();
  if (!cartOpen) return null;

  const progress = Math.min(100, Math.round((cartTotal / FREE_SHIP) * 100));
  const remaining = FREE_SHIP - cartTotal;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/50 animate-overlay" onClick={() => setCartOpen(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl animate-drawer">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <h2 className="font-display flex items-center gap-2 text-xl font-bold">
            <ShoppingBag className="h-5 w-5 text-rosewood" /> Your Bag ({cartCount})
          </h2>
          <button onClick={() => setCartOpen(false)} className="rounded-full p-2 hover:bg-linen" aria-label="Close bag">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-ink/10 bg-white px-5 py-3">
          {remaining > 0 ? (
            <p className="flex items-center gap-2 text-[13.5px] text-cocoa">
              <Truck className="h-4 w-4 text-rosewood" /> You&apos;re <strong>{cents(remaining)}</strong> away from free shipping
            </p>
          ) : (
            <p className="flex items-center gap-2 text-[13.5px] font-semibold text-sagedeep">
              <Truck className="h-4 w-4" /> You&apos;ve unlocked FREE shipping!
            </p>
          )}
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-linen">
            <div className="h-full rounded-full bg-gradient-to-r from-gold to-rosewood transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-linen text-mocha">
                <ShoppingBag className="h-7 w-7" />
              </span>
              <p className="font-display mt-4 text-xl font-semibold">Your bag is empty</p>
              <p className="mt-1 max-w-[240px] text-sm text-mocha">Beautiful things await — start with our bestsellers.</p>
              <button
                onClick={() => setCartOpen(false)}
                className="mt-5 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-cream hover:bg-rosewood"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {cart.map((line) => (
                <li key={line.key} className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-ink/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={line.image} alt={line.name} className="h-20 w-16 shrink-0 rounded-xl object-cover" />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[14.5px] font-semibold leading-tight">{line.name}</p>
                        <p className="mt-0.5 text-xs text-mocha">Size {line.size}</p>
                      </div>
                      <button onClick={() => removeLine(line.key)} className="rounded-md p-1 text-mocha hover:bg-blush hover:text-rosedeep" aria-label="Remove item">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-ink/15">
                        <button onClick={() => updateQty(line.key, line.quantity - 1)} className="p-1.5 px-2 hover:text-rosewood" aria-label="Decrease">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-6 text-center text-sm font-semibold">{line.quantity}</span>
                        <button onClick={() => updateQty(line.key, line.quantity + 1)} className="p-1.5 px-2 hover:text-rosewood" aria-label="Increase">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-[15px] font-bold text-rosedeep">{cents(line.priceCents * line.quantity)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-ink/10 bg-white px-5 py-4">
            <div className="flex items-center justify-between text-[15px]">
              <span className="text-cocoa">Subtotal</span>
              <span className="font-display text-xl font-bold">{cents(cartTotal)}</span>
            </div>
            <p className="mt-1 text-xs text-mocha">Prices include 15% VAT. Delivery calculated at checkout.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href="/cart"
                onClick={() => setCartOpen(false)}
                className="rounded-full border border-ink/20 px-4 py-2.5 text-center text-sm font-semibold hover:bg-linen"
              >
                View Bag
              </Link>
              <Link
                href="/checkout"
                onClick={() => setCartOpen(false)}
                className="flex items-center justify-center gap-1.5 rounded-full bg-rosewood px-4 py-2.5 text-sm font-semibold text-white hover:bg-rosedeep"
              >
                <Lock className="h-3.5 w-3.5" /> Checkout
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
