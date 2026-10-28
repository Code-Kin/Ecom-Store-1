"use client";
// Product detail: gallery, size/qty selection, bag actions, reviews + related pieces.
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Minus, Plus, ShoppingBag, Zap, Truck, RotateCcw, ShieldCheck, ChevronRight, PenLine } from "lucide-react";
import StoreShell from "@/components/storefront/StoreShell";
import ProductCard, { type CardProduct } from "@/components/storefront/ProductCard";
import { cents, timeAgo } from "@/lib/format";
import { useStore } from "@/lib/store-context";

type FullProduct = CardProduct & {
  description: string;
  sizes: string;
  stock: number;
  isActive: boolean;
};
type Review = { id: number; userName: string; rating: number; comment: string; createdAt: string };

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, addToCart, showToast } = useStore();
  const [product, setProduct] = useState<FullProduct | null>(null);
  const [related, setRelated] = useState<CardProduct[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState("M");
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"details" | "shipping" | "returns">("details");
  const [rRating, setRRating] = useState(5);
  const [rComment, setRComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.product) {
          setProduct(d.product);
          setRelated(d.related || []);
          setReviews(d.reviews || []);
          const sizes = String(d.product.sizes || "M").split(",");
          if (!sizes.includes("M")) setSize(sizes[0] || "M");
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <StoreShell>
        <div className="mx-auto max-w-6xl animate-pulse px-4 py-10">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="aspect-[3/4] rounded-3xl bg-linen" />
            <div className="space-y-4 pt-4"><div className="h-8 w-3/4 rounded bg-linen" /><div className="h-5 w-1/3 rounded bg-linen" /><div className="h-24 rounded bg-linen" /></div>
          </div>
        </div>
      </StoreShell>
    );
  }

  if (!product) {
    return (
      <StoreShell>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="font-display text-3xl font-bold">That piece has found a new home</h1>
          <p className="mt-2 text-mocha">This item is no longer available, but there&apos;s plenty more to love.</p>
          <Link href="/shop" className="mt-6 inline-block rounded-full bg-ink px-7 py-3 text-sm font-semibold text-cream hover:bg-rosewood">Back to Shop</Link>
        </div>
      </StoreShell>
    );
  }

  const sizes = String(product.sizes || "XS,S,M,L,XL").split(",").map((s) => s.trim()).filter(Boolean);
  const sale = product.compareAtCents && product.compareAtCents > product.priceCents;

  const handleAdd = async () => {
    await addToCart({ productId: product.id, name: product.name, image: product.imageUrl, priceCents: product.priceCents, size, stock: product.stock }, qty);
  };
  const handleBuyNow = async () => {
    await addToCart({ productId: product.id, name: product.name, image: product.imageUrl, priceCents: product.priceCents, size, stock: product.stock }, qty);
    router.push("/checkout");
  };
  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rComment.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, rating: rRating, comment: rComment.trim() }),
    });
    const d = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setReviews((r) => [d.review, ...r]);
      setRComment("");
      showToast("Thanks for your review!");
    } else {
      showToast(d.error || "Could not post review.");
    }
  };

  return (
    <StoreShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <nav className="flex items-center gap-1.5 text-[13.5px] text-mocha">
          <Link href="/" className="hover:text-ink">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/shop" className="hover:text-ink">Shop</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-ink">{product.category}</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate font-medium text-ink">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Gallery */}
          <div className="relative">
            <div className="overflow-hidden rounded-[26px] bg-linen shadow-lg ring-1 ring-ink/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.imageUrl} alt={product.name} className="aspect-[3/4] w-full object-cover" />
            </div>
            {sale && (
              <span className="absolute left-4 top-4 rounded-full bg-rosewood px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
                Save {Math.round((1 - product.priceCents / (product.compareAtCents as number)) * 100)}%
              </span>
            )}
          </div>

          {/* Info */}
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-golddeep">{product.category}</p>
            <h1 className="font-display mt-1 text-[32px] font-bold leading-tight sm:text-[38px]">{product.name}</h1>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex text-golddeep">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating) ? "fill-current" : "opacity-30"}`} />
                ))}
              </span>
              <span className="text-sm font-semibold">{Number(product.rating).toFixed(1)}</span>
              <a href="#reviews" className="text-sm text-mocha underline-offset-4 hover:underline">({product.reviewCount} reviews)</a>
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-display text-[32px] font-bold text-rosedeep">{cents(product.priceCents)}</span>
              {sale && <span className="text-lg text-mocha line-through">{cents(product.compareAtCents)}</span>}
            </div>
            <p className="mt-1 text-sm text-mocha">or 4 interest-free payments of {cents(Math.round(product.priceCents / 4))}</p>

            <p className="mt-5 leading-relaxed text-cocoa">{product.description}</p>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">Select size</p>
                <button className="text-[13px] font-medium text-rosewood underline-offset-4 hover:underline" onClick={() => showToast("True to size — between sizes? We suggest sizing up.")}>
                  Size guide
                </button>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`min-w-12 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      size === s ? "bg-ink text-cream" : "bg-white text-cocoa ring-1 ring-ink/15 hover:ring-rosewood"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className={`mt-2.5 text-sm font-medium ${product.stock <= 6 ? "text-rosewood" : "text-sagedeep"}`}>
                {product.stock === 0 ? "Out of stock" : product.stock <= 6 ? `Only ${product.stock} left in stock — order soon` : "In stock, ready to ship"}
              </p>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <div className="flex items-center rounded-full border border-ink/20 bg-white">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3 pl-4 hover:text-rosewood" aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
                <span className="min-w-8 text-center font-bold">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))} className="p-3 pr-4 hover:text-rosewood" aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
              </div>
              <button
                onClick={handleAdd}
                disabled={product.stock === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[15px] font-semibold text-cream transition hover:bg-rosewood disabled:opacity-40"
              >
                <ShoppingBag className="h-4.5 w-4.5" /> Add to Bag
              </button>
            </div>
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-full bg-rosewood px-6 py-3.5 text-[15px] font-semibold text-white transition hover:bg-rosedeep disabled:opacity-40"
            >
              <Zap className="h-4 w-4" /> Buy It Now
            </button>

            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: Truck, t: "Free ship R1,000+" },
                { icon: RotateCcw, t: "30-day returns" },
                { icon: ShieldCheck, t: "Secure checkout" },
              ].map((p) => (
                <div key={p.t} className="rounded-2xl bg-white px-2 py-3 ring-1 ring-ink/5">
                  <p.icon className="mx-auto h-4.5 w-4.5 text-rosewood" />
                  <p className="mt-1 text-[12.5px] font-semibold text-cocoa">{p.t}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="mt-6 rounded-2xl bg-white ring-1 ring-ink/5">
              <div className="flex border-b border-ink/10">
                {(["details", "shipping", "returns"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 px-4 py-3 text-sm font-semibold capitalize ${tab === t ? "border-b-2 border-rosewood text-rosedeep" : "text-mocha hover:text-ink"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="p-5 text-[14.5px] leading-relaxed text-cocoa">
                {tab === "details" && (
                  <ul className="list-disc space-y-1.5 pl-5">
                    <li>Designed & quality-checked by the Mitchell family</li>
                    <li>Model is 5&apos;7&quot; and wears size S</li>
                    <li>Machine washable — see garment tag for care</li>
                    <li>Hand-packed in Cape Town with a thank-you note</li>
                  </ul>
                )}
                {tab === "shipping" && <p>Orders ship within 1–2 business days from Cape Town. Free standard shipping (3–5 days) on orders over R1,000; flat R99 otherwise. Express 2-day available at checkout.</p>}
                {tab === "returns" && <p>Not in love? Return or exchange within 30 days — no questions, no restocking fees. Start a return from your account page or visit us in store.</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section id="reviews" className="mt-14 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <h2 className="font-display text-2xl font-bold">Customer Reviews ({reviews.length})</h2>
            <div className="mt-4 space-y-3">
              {reviews.length === 0 && (
                <p className="rounded-2xl bg-white p-6 text-[15px] text-mocha ring-1 ring-ink/5">No reviews yet — be the first to share your thoughts!</p>
              )}
              {reviews.map((r) => (
                <article key={r.id} className="rounded-2xl bg-white p-5 ring-1 ring-ink/5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">{r.userName}</p>
                    <span className="text-xs text-mocha">{timeAgo(r.createdAt)}</span>
                  </div>
                  <div className="mt-1 flex text-golddeep">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current" : "opacity-30"}`} />
                    ))}
                  </div>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-cocoa">{r.comment}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 ring-1 ring-ink/5 lg:sticky lg:top-36 lg:self-start">
            <h3 className="font-display flex items-center gap-2 text-lg font-bold"><PenLine className="h-4 w-4 text-rosewood" /> Write a review</h3>
            {user ? (
              <form onSubmit={submitReview} className="mt-3 space-y-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setRRating(n)} aria-label={`${n} stars`}>
                      <Star className={`h-6 w-6 ${n <= rRating ? "fill-gold text-golddeep" : "text-stone-300"}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={rComment}
                  onChange={(e) => setRComment(e.target.value)}
                  rows={4}
                  placeholder="How did it fit? How's the quality?"
                  className="w-full rounded-xl border border-ink/15 p-3 text-sm outline-none focus:border-rosewood focus:ring-2 focus:ring-rosewood/20"
                />
                <button disabled={submitting || !rComment.trim()} className="w-full rounded-full bg-ink py-2.5 text-sm font-semibold text-cream hover:bg-rosewood disabled:opacity-40">
                  {submitting ? "Posting…" : "Post Review"}
                </button>
              </form>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-mocha">
                <Link href="/login" className="font-semibold text-rosewood underline-offset-4 hover:underline">Sign in</Link> to share your review of this piece.
              </p>
            )}
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl font-bold">You May Also Love</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </StoreShell>
  );
}
