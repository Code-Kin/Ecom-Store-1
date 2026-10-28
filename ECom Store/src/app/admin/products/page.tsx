"use client";
// Admin product management: add / edit / delete, stock controls, featured + visibility toggles.
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Star, X, Minus } from "lucide-react";
import { cents } from "@/lib/format";

type Product = {
  id: number; name: string; description: string; priceCents: number; compareAtCents: number | null;
  category: string; imageUrl: string; stock: number; sizes: string; featured: boolean; isActive: boolean;
  rating: number; reviewCount: number;
};

const CATS = ["Dresses", "Tops", "Bottoms", "Outerwear", "Accessories"];
const PRESET_IMAGES = [
  "https://images.pexels.com/photos/2859118/pexels-photo-2859118.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  "https://images.pexels.com/photos/6181955/pexels-photo-6181955.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  "https://images.pexels.com/photos/35027340/pexels-photo-35027340.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  "https://images.pexels.com/photos/27288209/pexels-photo-27288209.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  "https://images.pexels.com/photos/14642651/pexels-photo-14642651.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  "https://images.pexels.com/photos/5789005/pexels-photo-5789005.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  "https://images.pexels.com/photos/19238449/pexels-photo-19238449.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  "https://images.pexels.com/photos/30526284/pexels-photo-30526284.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  "https://images.pexels.com/photos/29096397/pexels-photo-29096397.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.pexels.com/photos/11031118/pexels-photo-11031118.png?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
];

const EMPTY = {
  name: "", description: "", price: "", compareAt: "", category: "Dresses",
  imageUrl: PRESET_IMAGES[0], stock: "10", sizes: "XS,S,M,L,XL", featured: false, isActive: true,
};

export default function AdminProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [stockFilter, setStockFilter] = useState("all");
  const [modal, setModal] = useState<null | { mode: "add" | "edit"; id?: number }>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/products?includeInactive=1&limit=100", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(d.products || []))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (cat !== "All" && p.category !== cat) return false;
      if (q && !`${p.name} ${p.description} ${p.category}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (stockFilter === "low" && !(p.stock <= 6 && p.stock > 0)) return false;
      if (stockFilter === "out" && p.stock !== 0) return false;
      if (stockFilter === "hidden" && p.isActive) return false;
      return true;
    });
  }, [items, q, cat, stockFilter]);

  const patch = async (id: number, body: Partial<Product>) => {
    const res = await fetch(`/api/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      const d = await res.json();
      setItems((list) => list.map((p) => (p.id === id ? d.product : p)));
    }
  };

  const openAdd = () => {
    setForm(EMPTY);
    setModal({ mode: "add" });
  };
  const openEdit = (p: Product) => {
    setForm({
      name: p.name,
      description: p.description,
      price: (p.priceCents / 100).toFixed(2),
      compareAt: p.compareAtCents ? (p.compareAtCents / 100).toFixed(2) : "",
      category: p.category,
      imageUrl: p.imageUrl,
      stock: String(p.stock),
      sizes: p.sizes,
      featured: p.featured,
      isActive: p.isActive,
    });
    setModal({ mode: "edit", id: p.id });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        name: form.name,
        description: form.description,
        priceCents: Math.round(Number(form.price || 0) * 100),
        compareAtCents: form.compareAt ? Math.round(Number(form.compareAt) * 100) : null,
        category: form.category,
        imageUrl: form.imageUrl,
        stock: Number(form.stock || 0),
        sizes: form.sizes,
        featured: form.featured,
        isActive: form.isActive,
      };
      const url = modal?.mode === "edit" ? `/api/products/${modal.id}` : "/api/products";
      const res = await fetch(url, { method: modal?.mode === "edit" ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Save failed.");
      if (modal?.mode === "edit") setItems((l) => l.map((p) => (p.id === modal.id ? d.product : p)));
      else setItems((l) => [d.product, ...l]);
      setModal(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"? Order history is preserved, but this cannot be undone.`)) return;
    const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    if (res.ok) setItems((l) => l.filter((x) => x.id !== p.id));
    else alert("Delete failed.");
  };

  const input = "w-full rounded-xl border border-ink/15 bg-cream/50 px-3.5 py-2 text-sm outline-none focus:border-rosewood focus:ring-2 focus:ring-rosewood/20";

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-[28px] font-bold">Products</h1>
          <p className="text-sm text-mocha">{items.length} SKUs · {items.filter((p) => p.isActive).length} visible in store</p>
        </div>
        <button onClick={openAdd} className="flex w-fit items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream hover:bg-rosewood">
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-col gap-2.5 rounded-2xl bg-white p-4 ring-1 ring-ink/5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mocha" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="w-full rounded-full border border-ink/15 bg-cream/50 py-2 pl-10 pr-4 text-sm outline-none focus:border-rosewood" />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-full border border-ink/15 bg-cream/50 px-4 py-2 text-sm font-medium outline-none" aria-label="Filter by category">
          <option>All</option>
          {CATS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="rounded-full border border-ink/15 bg-cream/50 px-4 py-2 text-sm font-medium outline-none" aria-label="Filter by stock">
          <option value="all">All stock</option>
          <option value="low">Low stock ≤6</option>
          <option value="out">Out of stock</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      {/* Table */}
      <div className="mt-3 overflow-hidden rounded-2xl bg-white ring-1 ring-ink/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/8 bg-cream/60 text-[12px] uppercase tracking-wider text-mocha">
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-3 py-3 font-semibold">Category</th>
                <th className="px-3 py-3 font-semibold">Price</th>
                <th className="px-3 py-3 font-semibold">Stock</th>
                <th className="px-3 py-3 font-semibold">Featured</th>
                <th className="px-3 py-3 font-semibold">Visible</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-mocha">Loading products…</td></tr>
              )}
              {!loading && filtered.map((p) => (
                <tr key={p.id} className={`border-b border-ink/5 last:border-0 hover:bg-cream/40 ${!p.isActive ? "opacity-60" : ""}`}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.imageUrl} alt={p.name} className="h-12 w-10 rounded-lg object-cover" />
                      <div>
                        <p className="font-semibold leading-tight">{p.name}</p>
                        <p className="text-xs text-mocha">#{p.id} · ★ {Number(p.rating).toFixed(1)} ({p.reviewCount})</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5"><span className="rounded-full bg-linen px-2.5 py-1 text-xs font-medium">{p.category}</span></td>
                  <td className="px-3 py-2.5">
                    <span className="font-bold">{cents(p.priceCents)}</span>
                    {p.compareAtCents ? <span className="ml-1.5 text-xs text-mocha line-through">{cents(p.compareAtCents)}</span> : null}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => patch(p.id, { stock: Math.max(0, p.stock - 1) })} className="rounded-md p-1 hover:bg-linen" aria-label="Decrease stock"><Minus className="h-3.5 w-3.5" /></button>
                      <span className={`min-w-8 rounded-lg px-1.5 py-0.5 text-center font-bold ${p.stock === 0 ? "bg-rose-100 text-rose-700" : p.stock <= 6 ? "bg-amber-100 text-amber-800" : "bg-stone-100"}`}>{p.stock}</span>
                      <button onClick={() => patch(p.id, { stock: p.stock + 1 })} className="rounded-md p-1 hover:bg-linen" aria-label="Increase stock"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <button onClick={() => patch(p.id, { featured: !p.featured })} aria-label="Toggle featured">
                      <Star className={`h-5 w-5 ${p.featured ? "fill-gold text-golddeep" : "text-stone-300 hover:text-gold"}`} />
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => patch(p.id, { isActive: !p.isActive })}
                      className={`relative h-6 w-11 rounded-full transition ${p.isActive ? "bg-sagedeep" : "bg-stone-300"}`}
                      aria-label="Toggle visibility"
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${p.isActive ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-cocoa hover:bg-sky-100 hover:text-sky-700" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => remove(p)} className="rounded-lg p-2 text-cocoa hover:bg-rose-100 hover:text-rose-700" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-mocha">No products match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-ink/60 animate-overlay" onClick={() => setModal(null)} />
          <form onSubmit={save} className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-cream p-6 animate-pop sm:rounded-3xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">{modal.mode === "add" ? "Add Product" : `Edit #${modal.id}`}</h2>
              <button type="button" onClick={() => setModal(null)} className="rounded-full p-2 hover:bg-linen" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[13px] font-semibold text-cocoa">Product name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} placeholder="e.g. Rosalind Floral Midi Dress" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[13px] font-semibold text-cocoa">Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={input} placeholder="Fabric, fit, styling notes…" />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-cocoa">Price (ZAR) *</label>
                <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={input} placeholder="89.00" />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-cocoa">Compare-at price (sale)</label>
                <input type="number" min="0" step="0.01" value={form.compareAt} onChange={(e) => setForm({ ...form, compareAt: e.target.value })} className={input} placeholder="Optional" />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-cocoa">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={input}>
                  {CATS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-cocoa">Stock</label>
                <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={input} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[13px] font-semibold text-cocoa">Sizes (comma-separated)</label>
                <input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} className={input} placeholder="XS,S,M,L,XL or OS for one-size" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[13px] font-semibold text-cocoa">Image URL</label>
                <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className={input} placeholder="https://…" />
                <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {form.imageUrl && <img src={form.imageUrl} alt="Preview" className="h-16 w-13 shrink-0 rounded-lg object-cover ring-2 ring-rosewood" />}
                  {PRESET_IMAGES.filter((u) => u !== form.imageUrl).map((u) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={u} src={u} alt="Preset" onClick={() => setForm({ ...form, imageUrl: u })} className="h-16 w-13 shrink-0 cursor-pointer rounded-lg object-cover opacity-70 ring-1 ring-ink/10 hover:opacity-100" />
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2.5 rounded-xl bg-white p-3 text-sm font-medium ring-1 ring-ink/10">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="h-4 w-4 accent-rose-800" />
                Featured on homepage
              </label>
              <label className="flex items-center gap-2.5 rounded-xl bg-white p-3 text-sm font-medium ring-1 ring-ink/10">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-emerald-700" />
                Visible in store
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 rounded-full border border-ink/20 py-2.5 text-sm font-semibold hover:bg-linen">Cancel</button>
              <button disabled={saving} className="flex-1 rounded-full bg-ink py-2.5 text-sm font-semibold text-cream hover:bg-rosewood disabled:opacity-60">
                {saving ? "Saving…" : modal.mode === "add" ? "Add Product" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
