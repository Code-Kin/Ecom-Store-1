"use client";
// Reusable product card for grids, carousels and related items.
import Link from "next/link";
import { Star, ShoppingBag } from "lucide-react";
import { cents } from "@/lib/format";
import { useStore } from "@/lib/store-context";

export type CardProduct = {
  id: number;
  name: string;
  priceCents: number;
  compareAtCents: number | null;
  category: string;
  imageUrl: string;
  stock: number;
  rating: number;
  reviewCount: number;
  featured?: boolean;
};

export default function ProductCard({ product }: { product: CardProduct }) {
  const { addToCart } = useStore();
  const sale = product.compareAtCents && product.compareAtCents > product.priceCents;
  const pct = sale ? Math.round((1 - product.priceCents / (product.compareAtCents as number)) * 100) : 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_16px_rgba(42,35,32,0.06)] ring-1 ring-ink/5 transition-all duration-300 hover:shadow-[0_12px_36px_rgba(157,78,92,0.16)] hover:-translate-y-1">
      <Link href={`/product/${product.id}`} className="relative block aspect-[3/4] overflow-hidden bg-linen">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {sale && (
            <span className="rounded-full bg-rosewood px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
              Save {pct}%
            </span>
          )}
          {product.stock <= 6 && product.stock > 0 && (
            <span className="rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-cream backdrop-blur">
              Only {product.stock} left
            </span>
          )}
          {product.stock === 0 && (
            <span className="rounded-full bg-stone-500 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
              Sold out
            </span>
          )}
        </div>
        <span className="absolute right-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-cocoa backdrop-blur">
          {product.category}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-center gap-1 text-golddeep">
          <Star className="h-3.5 w-3.5 fill-current" />
          <span className="text-xs font-semibold text-ink">{Number(product.rating).toFixed(1)}</span>
          <span className="text-xs text-mocha">({product.reviewCount})</span>
        </div>
        <Link href={`/product/${product.id}`} className="font-display text-[17px] font-semibold leading-snug text-ink hover:text-rosewood">
          {product.name}
        </Link>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-rosedeep">{cents(product.priceCents)}</span>
            {sale && <span className="text-sm text-mocha line-through">{cents(product.compareAtCents)}</span>}
          </div>
          <button
            onClick={() =>
              addToCart({
                productId: product.id,
                name: product.name,
                image: product.imageUrl,
                priceCents: product.priceCents,
                size: "M",
                stock: product.stock,
              })
            }
            disabled={product.stock === 0}
            className="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-cream transition hover:bg-rosewood disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Quick add ${product.name} to bag`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Quick add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
