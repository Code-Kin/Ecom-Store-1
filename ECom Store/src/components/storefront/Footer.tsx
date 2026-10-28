"use client";
// Storefront footer: brand story, shop links, help, contact hours + newsletter.
import { useState } from "react";
import Link from "next/link";
import { Flower2, MapPin, Phone, Mail, Clock, Send, ShieldCheck, Truck, RotateCcw, CreditCard } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setDone(true);
    setEmail("");
    setTimeout(() => setDone(false), 4000);
  };

  return (
    <footer className="mt-16 bg-ink text-cream">
      {/* Perks strip */}
      <div className="border-b border-cream/10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 lg:grid-cols-4">
          {[
            { icon: Truck, title: "Free Shipping", sub: "On all orders over R1,000" },
            { icon: RotateCcw, title: "Easy Returns", sub: "30-day hassle-free returns" },
            { icon: ShieldCheck, title: "Secure Checkout", sub: "256-bit encrypted payments" },
            { icon: CreditCard, title: "Flexible Payment", sub: "Visa & Mastercard via Stripe" },
          ].map((p) => (
            <div key={p.title} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream/10 text-gold">
                <p.icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-[15px] font-semibold">{p.title}</span>
                <span className="block text-[13px] text-cream/60">{p.sub}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rosewood text-cream">
              <Flower2 className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-bold">Sarah&apos;s Boutique</span>
          </div>
          <p className="mt-4 text-[14px] leading-relaxed text-cream/65">
            A small, family-owned clothing store in the heart of Cape Town since 1998. Thoughtfully curated
            fashion, honest prices, and service that treats you like family.
          </p>
          <form onSubmit={subscribe} className="mt-5">
            <label className="text-[13px] font-semibold uppercase tracking-widest text-gold">Get 10% off your first order</label>
            <div className="mt-2 flex overflow-hidden rounded-full bg-cream/10 ring-1 ring-cream/15 focus-within:ring-gold">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                type="email"
                className="w-full bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-cream/40"
              />
              <button className="bg-gold px-4 text-ink transition hover:bg-cream" aria-label="Subscribe">
                <Send className="h-4 w-4" />
              </button>
            </div>
            {done && <p className="mt-2 text-sm text-emerald-300">Welcome to the family! Check your inbox for 10% off.</p>}
          </form>
        </div>

        <div>
          <h4 className="text-[13px] font-semibold uppercase tracking-widest text-gold">Shop</h4>
          <ul className="mt-4 space-y-2.5 text-[14.5px] text-cream/75">
            <li><Link href="/shop" className="hover:text-cream">Shop All</Link></li>
            <li><Link href="/shop?category=Dresses" className="hover:text-cream">Dresses</Link></li>
            <li><Link href="/shop?category=Tops" className="hover:text-cream">Tops & Knitwear</Link></li>
            <li><Link href="/shop?category=Bottoms" className="hover:text-cream">Bottoms & Denim</Link></li>
            <li><Link href="/shop?category=Outerwear" className="hover:text-cream">Outerwear</Link></li>
            <li><Link href="/shop?category=Accessories" className="hover:text-cream">Accessories</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[13px] font-semibold uppercase tracking-widest text-gold">Customer Care</h4>
          <ul className="mt-4 space-y-2.5 text-[14.5px] text-cream/75">
            <li><Link href="/account" className="hover:text-cream">My Account & Orders</Link></li>
            <li><Link href="/cart" className="hover:text-cream">Shopping Bag</Link></li>
            <li><Link href="/contact" className="hover:text-cream">Contact Us</Link></li>
            <li><Link href="/contact?type=feedback" className="hover:text-cream">Leave Feedback</Link></li>
            <li><Link href="/login" className="hover:text-cream">Sign In</Link></li>
            <li><Link href="/register" className="hover:text-cream">Create Account</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[13px] font-semibold uppercase tracking-widest text-gold">Visit Our Store</h4>
          <ul className="mt-4 space-y-3 text-[14px] text-cream/75">
            <li className="flex gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> 84 Kloof Street, Gardens, Cape Town, 8001</li>
            <li className="flex gap-2.5"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> +27 21 422 0198</li>
            <li className="flex gap-2.5"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> hello@sarahsboutique.com</li>
            <li className="flex gap-2.5"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> Mon–Sat 9am–8pm · Sun 11am–5pm</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-[13px] text-cream/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Sarah&apos;s Boutique · Family-owned & operated</p>
          <div className="flex items-center gap-2">
            {["VISA", "Mastercard", "Stripe"].map((b) => (
              <span key={b} className="rounded-md bg-cream/10 px-2 py-1 text-[11px] font-semibold tracking-wide text-cream/70 ring-1 ring-cream/10">
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
