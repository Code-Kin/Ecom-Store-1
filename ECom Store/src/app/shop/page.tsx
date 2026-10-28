"use client";
// Product catalog: live search, category + price filters, sorting. Mobile-friendly with filter drawer.
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X, PackageSearch } from "lucide-react";
import StoreShell from "@/components/storefront/StoreShell";
import ProductCard, { type CardProduct } from "@/components/storefront/ProductCard";

const CATS = ["All", "Dresses", "Tops", "Bottoms", "Outerwear", "Accessories"];
const SORTS = [
  { v: "featured", l: "Featured" },
  { v: "newest", l: "Newest" },
  { v: "price-asc", l: "Price: Low to High" },
  { v: "price-desc", l: "Price: High to Low" },
  { v: "rating", l: "Top Rated" },
];

function Catalog() {
  const sp = useSearchParams();
  const router = useRouter();
  const [items, setItems] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(false);

  const search = sp.get("search") || "";
  const category = sp.get("category") || "All";
  const sort = sp.get("sort") || "featured";
  const maxPrice = sp.get("maxPrice") || "";
  const [q, setQ] = useState(search);

  useEffect(() => setQ(search), [search]);

  const setParam = (k: string, v: string) => {
    const p = new URLSearchParams(sp.toString());
    if (!v || (k === "category" && v === "All") || (k === "sort" && v === "featured")) p.delete(k);
    else p.set(k, v);
    router.push(`/shop?${p.toString()}`);
  };

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (category && category !== "All") p.set("category", category);
    if (sort) p.set("sort", sort);
    if (maxPrice) p.set("maxPrice", maxPrice);
    fetch(`/api/products?${p.toString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(d.products || []))
      .finally(() => setLoading(false));
  }, [search, category, sort, maxPrice]);

  const activeFilters = useMemo(
    () => [search && `"${search}"`, category !== "All" && category, maxPrice && `Under R${maxPrice}`].filter(Boolean) as string[],
    [search, category, maxPrice]
  );

  const filters = (
    <div className="space-y-6">
      <div>
        <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-mocha">Category</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setParam("category", c)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                category === c ? "bg-ink text-cream" : "bg-white text-cocoa ring-1 ring-ink/10 hover:ring-rosewood"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-mocha">Max price</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {["", "800", "1000", "1500", "2000"].map((v) => (
            <button
              key={v || "any"}
              onClick={() => setParam("maxPrice", v)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                maxPrice === v ? "bg-rosewood text-white" : "bg-white text-cocoa ring-1 ring-ink/10 hover:ring-rosewood"
              }`}
            >
              {v ? `Under R${v}` : "Any price"}
            </button>
          ))}
        </div>
      </div>
      {activeFilters.length > 0 && (
        <button
          onClick={() => router.push("/shop")}
          className="text-sm font-semibold text-rosewood underline-offset-4 hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-1">
        <p className="text-[12px] font-bold uppercase tracking-[0.24em] text-golddeep">The collection</p>
        <h1 className="font-display text-[34px] font-bold sm:text-[40px]">
          {category !== "All" ? category : search ? `Results for "${search}"` : "Shop All"}
        </h1>
        <p className="text-[15px] text-mocha">
          {loading ? "Finding beautiful things…" : `${items.length} piece${items.length === 1 ? "" : "s"} · hand-picked by the Mitchell family`}
        </p>
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam("search", q.trim());
          }}
          className="relative flex-1"
        >
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mocha" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search dresses, sweaters, denim…"
            className="w-full rounded-full border border-ink/15 bg-white py-3 pl-11 pr-4 text-[15px] outline-none focus:border-rosewood focus:ring-2 focus:ring-rosewood/20"
          />
        </form>
        <div className="flex gap-2">
          <button onClick={() => setDrawer(true)} className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold ring-1 ring-ink/15 lg:hidden">
            <SlidersHorizontal className="h-4 w-4" /> Filters
            {activeFilters.length > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rosewood text-[11px] text-white">{activeFilters.length}</span>}
          </button>
          <select
            value={sort}
            onChange={(e) => setParam("sort", e.target.value)}
            className="flex-1 rounded-full border border-ink/15 bg-white px-5 py-3 text-sm font-semibold outline-none focus:border-rosewood sm:flex-none"
            aria-label="Sort products"
          >
            {SORTS.map((s) => (
              <option key={s.v} value={s.v}>{s.l}</option>
            ))}
          </select>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {activeFilters.map((f) => (
            <span key={f} className="rounded-full bg-blush px-3.5 py-1.5 text-[13px] font-medium text-rosedeep ring-1 ring-rosewood/20">{f}</span>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[230px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-36 rounded-2xl bg-white/70 p-5 ring-1 ring-ink/5">{filters}</div>
        </aside>
        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse overflow-hidden rounded-2xl bg-white ring-1 ring-ink/5">
                  <div className="aspect-[3/4] bg-linen" />
                  <div className="space-y-2 p-4"><div className="h-4 w-2/3 rounded bg-linen" /><div className="h-4 w-1/3 rounded bg-linen" /></div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center rounded-3xl bg-white/70 px-6 py-20 text-center ring-1 ring-ink/5">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-linen text-mocha"><PackageSearch className="h-7 w-7" /></span>
              <h2 className="font-display mt-4 text-2xl font-bold">Nothing matches — yet</h2>
              <p className="mt-1 max-w-sm text-[15px] text-mocha">Try a different search or browse the full collection. New pieces arrive weekly.</p>
              <button onClick={() => router.push("/shop")} className="mt-5 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-cream hover:bg-rosewood">
                Browse Everything
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50 animate-overlay" onClick={() => setDrawer(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-cream p-6 animate-pop">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Filters</h2>
              <button onClick={() => setDrawer(false)} className="rounded-full p-2 hover:bg-linen" aria-label="Close filters"><X className="h-5 w-5" /></button>
            </div>
            {filters}
            <button onClick={() => setDrawer(false)} className="mt-6 w-full rounded-full bg-ink py-3 text-sm font-semibold text-cream">
              Show {items.length} result{items.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <StoreShell>
      <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-20 text-center text-mocha">Loading the boutique…</div>}>
        <Catalog />
      </Suspense>
    </StoreShell>
  );
}
