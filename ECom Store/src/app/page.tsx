// Sarah's Boutique — storefront homepage (Main Website prototype).
export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowRight, Star, Sparkles, Heart, Truck, ShieldCheck, Flower2, MapPin, Quote } from "lucide-react";
import StoreShell from "@/components/storefront/StoreShell";
import ProductCard from "@/components/storefront/ProductCard";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const CATEGORY_TILES = [
  { name: "Dresses", blurb: "Twirl-approved favorites", image: "https://images.pexels.com/photos/35027340/pexels-photo-35027340.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800" },
  { name: "Tops", blurb: "Knits & everyday soft", image: "https://images.pexels.com/photos/14642651/pexels-photo-14642651.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800" },
  { name: "Bottoms", blurb: "Denim that fits real life", image: "https://images.pexels.com/photos/19238449/pexels-photo-19238449.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800" },
  { name: "Outerwear", blurb: "Layers worth keeping", image: "https://images.pexels.com/photos/30526284/pexels-photo-30526284.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800" },
  { name: "Accessories", blurb: "Finishing touches", image: "https://images.pexels.com/photos/29096397/pexels-photo-29096397.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
];

export default async function HomePage() {
  const featured = await db.select().from(products).where(eq(products.featured, true)).limit(4);
  const newest = await db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.createdAt)).limit(4);
  const latestReviews = await db.select().from(reviews).orderBy(desc(reviews.createdAt)).limit(3);

  return (
    <StoreShell>
      {/* ─── HERO ─── */}
      <section className="texture-dots relative overflow-hidden">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blush blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-sand blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-10 lg:grid-cols-2 lg:pt-16">
          <div>
            <p className="animate-fade-up inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[12.5px] font-semibold uppercase tracking-[0.18em] text-rosedeep ring-1 ring-rosewood/20">
              <Sparkles className="h-3.5 w-3.5" /> Family-owned since 1998
            </p>
            <h1 className="font-display animate-fade-up-1 mt-5 text-[44px] font-bold leading-[1.05] tracking-tight sm:text-[60px]">
              Wear the story <em className="text-rosewood">only you</em> can tell.
            </h1>
            <p className="animate-fade-up-2 mt-5 max-w-lg text-[17px] leading-relaxed text-cocoa">
              From garden-party dresses to cloud-soft knits — thoughtfully curated fashion from our
              family&apos;s Cape Town storefront, now delivered to your door.
            </p>
            <div className="animate-fade-up-3 mt-7 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="group flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-[15px] font-semibold text-cream transition hover:bg-rosewood"
              >
                Shop New Arrivals
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/shop?sort=price-asc"
                className="rounded-full border border-ink/20 bg-white/60 px-7 py-3.5 text-[15px] font-semibold text-ink transition hover:border-rosewood hover:text-rosewood"
              >
                Shop Under R1,000
              </Link>
            </div>
            <div className="animate-fade-up-3 mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-cocoa">
              <span className="flex items-center gap-1.5">
                <span className="flex text-golddeep">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </span>
                <strong className="text-ink">4.9</strong> · 2,400+ reviews
              </span>
              <span className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-sagedeep" /> Free shipping R1,000+</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-sagedeep" /> 30-day returns</span>
            </div>
          </div>

          {/* Hero collage */}
          <div className="relative mx-auto w-full max-w-[520px] animate-fade-up-2">
            <div className="grid grid-cols-12 gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.pexels.com/photos/2859118/pexels-photo-2859118.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
                alt="Rosalind floral midi dress"
                className="col-span-7 h-[420px] w-full rounded-[28px] object-cover shadow-2xl ring-1 ring-ink/10"
              />
              <div className="col-span-5 flex flex-col gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.pexels.com/photos/6181955/pexels-photo-6181955.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
                  alt="Gingham picnic sundress"
                  className="h-[204px] w-full rounded-[22px] object-cover shadow-xl ring-1 ring-ink/10"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.pexels.com/photos/14642651/pexels-photo-14642651.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
                  alt="Cloudspun knit sweater"
                  className="h-[204px] w-full rounded-[22px] object-cover shadow-xl ring-1 ring-ink/10"
                />
              </div>
            </div>
            <div className="absolute -left-4 top-8 rotate-[-6deg] rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-ink/10">
              <p className="flex items-center gap-1.5 text-[13px] font-bold text-rosedeep"><Heart className="h-4 w-4 fill-current" /> Bestseller</p>
              <p className="text-xs text-mocha">Rosalind Midi · R1,349</p>
            </div>
            <div className="absolute -right-3 bottom-10 rotate-[3deg] rounded-2xl bg-ink px-4 py-3 text-cream shadow-xl">
              <p className="text-[13px] font-bold text-gold">Free Shipping</p>
              <p className="text-xs text-cream/70">on orders over R1,000</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MARQUEE ─── */}
      <div className="overflow-hidden bg-rosewood py-3 text-cream">
        <div className="animate-marquee flex w-max gap-10 whitespace-nowrap text-[13.5px] font-semibold uppercase tracking-[0.22em]">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-10">
              <span>✦ New fall knits just landed</span>
              <span>✦ Free delivery over R1,000</span>
              <span>✦ 30-day easy returns</span>
              <span>✦ Family-owned since 1998</span>
              <span>✦ 10% off your first order</span>
              <span>✦ Visit us in Cape Town</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── CATEGORIES ─── */}
      <section className="mx-auto max-w-7xl px-4 pt-14">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.24em] text-golddeep">Browse the boutique</p>
            <h2 className="font-display mt-1 text-[32px] font-bold">Shop by Category</h2>
          </div>
          <Link href="/shop" className="hidden items-center gap-1.5 text-[15px] font-semibold text-rosewood hover:text-rosedeep sm:flex">
            View everything <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {CATEGORY_TILES.map((c) => (
            <Link
              key={c.name}
              href={`/shop?category=${encodeURIComponent(c.name)}`}
              className="group relative overflow-hidden rounded-2xl bg-linen shadow-sm ring-1 ring-ink/5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image} alt={c.name} loading="lazy" className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="font-display text-[19px] font-bold text-white">{c.name}</p>
                <p className="text-[13px] text-cream/75">{c.blurb}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── FEATURED ─── */}
      <section className="mx-auto max-w-7xl px-4 pt-14">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.24em] text-golddeep">Customer favorites</p>
            <h2 className="font-display mt-1 text-[32px] font-bold">Most Loved Right Now</h2>
          </div>
          <Link href="/shop?sort=rating" className="hidden items-center gap-1.5 text-[15px] font-semibold text-rosewood hover:text-rosedeep sm:flex">
            Shop top rated <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* ─── STORY ─── */}
      <section className="mx-auto max-w-7xl px-4 pt-16">
        <div className="texture-weave grid overflow-hidden rounded-[28px] bg-ink text-cream lg:grid-cols-2">
          <div className="relative min-h-[320px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.pexels.com/photos/8386652/pexels-photo-8386652.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
              alt="Inside Sarah's Boutique store"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-ink/40" />
          </div>
          <div className="p-8 sm:p-12">
            <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.24em] text-gold">
              <Flower2 className="h-4 w-4" /> Our story
            </p>
            <h2 className="font-display mt-2 text-[32px] font-bold leading-tight sm:text-[38px]">
              Three generations. One little store with a big heart.
            </h2>
            <p className="mt-4 leading-relaxed text-cream/75">
              What started in 1998 as Sarah&apos;s weekend market stall is now Cape Town&apos;s beloved
              family boutique — run today by Sarah, her daughter Grace, and a team that knows most
              customers by name. Every online order is hand-packed at 84 Kloof Street, with a
              handwritten thank-you in every box.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-4">
              {[
                ["28", "Years open"],
                ["42k", "Happy customers"],
                ["4.9★", "Average rating"],
              ].map(([n, l]) => (
                <div key={l} className="rounded-2xl bg-cream/10 p-4 text-center ring-1 ring-cream/15">
                  <p className="font-display text-2xl font-bold text-gold">{n}</p>
                  <p className="mt-0.5 text-[12.5px] text-cream/70">{l}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/shop" className="rounded-full bg-cream px-6 py-3 text-sm font-bold text-ink transition hover:bg-gold">
                Shop the Collection
              </Link>
              <Link href="/contact" className="flex items-center gap-2 rounded-full border border-cream/25 px-6 py-3 text-sm font-semibold text-cream transition hover:border-gold hover:text-gold">
                <MapPin className="h-4 w-4" /> Visit the Store
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── NEW ARRIVALS ─── */}
      <section className="mx-auto max-w-7xl px-4 pt-14">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.24em] text-golddeep">Fresh on the racks</p>
            <h2 className="font-display mt-1 text-[32px] font-bold">New Arrivals</h2>
          </div>
          <Link href="/shop?sort=newest" className="hidden items-center gap-1.5 text-[15px] font-semibold text-rosewood hover:text-rosedeep sm:flex">
            Shop newest <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {newest.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="mx-auto max-w-7xl px-4 pt-16">
        <div className="rounded-[28px] bg-blush/60 p-8 ring-1 ring-rosewood/10 sm:p-12">
          <div className="text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.24em] text-rosedeep">Word on the street</p>
            <h2 className="font-display mt-1 text-[32px] font-bold">Loved by Locals & Beyond</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {(latestReviews.length ? latestReviews : [{ userName: "Emma S.", rating: 5, comment: "Beautiful clothes, fast shipping, and the sweetest handwritten note. My favorite boutique!" }]).map((r, i) => (
              <figure key={i} className="flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/5">
                <Quote className="h-6 w-6 text-blushdeep" />
                <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-cocoa">&ldquo;{r.comment}&rdquo;</blockquote>
                <figcaption className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold">{r.userName}</span>
                  <span className="flex text-golddeep">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className={`h-3.5 w-3.5 ${s < (r.rating || 5) ? "fill-current" : "opacity-30"}`} />
                    ))}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/contact?type=feedback" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream hover:bg-rosewood">
              Share Your Feedback <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </StoreShell>
  );
}
