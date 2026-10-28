"use client";
// Storefront header: announcement bar, sticky nav, live search, account + bag actions, mobile menu.
import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, ShoppingBag, User, Menu, X, Phone, Flower2, LayoutDashboard } from "lucide-react";
import { useStore } from "@/lib/store-context";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Shop All", href: "/shop" },
  { label: "Dresses", href: "/shop?category=Dresses" },
  { label: "Tops", href: "/shop?category=Tops" },
  { label: "Denim & More", href: "/shop?category=Bottoms" },
  { label: "Accessories", href: "/shop?category=Accessories" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const { user, cartCount, setCartOpen } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(q.trim() ? `/shop?search=${encodeURIComponent(q.trim())}` : "/shop");
    setSearchOpen(false);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40">
      {/* Announcement bar */}
      <div className="bg-ink text-cream">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-[12.5px] tracking-wide">
          <p className="flex items-center gap-2">
            <Flower2 className="h-3.5 w-3.5 text-gold" />
            <span className="hidden sm:inline">Free delivery over R1,000 · Family-owned since 1998 · Cape Town, South Africa</span>
            <span className="sm:hidden">Free delivery over R1,000</span>
          </p>
          <div className="flex items-center gap-4">
            <a href="tel:+27214220198" className="hidden items-center gap-1.5 hover:text-gold md:flex">
              <Phone className="h-3.5 w-3.5" /> +27 21 422 0198
            </a>
            <Link href="/admin" className="flex items-center gap-1.5 text-blushdeep hover:text-gold">
              <LayoutDashboard className="h-3.5 w-3.5" /> Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-ink/10 bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5">
          <button className="rounded-lg p-2 hover:bg-linen lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rosewood text-cream">
              <Flower2 className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="font-display block text-[21px] font-bold tracking-tight">Sarah&apos;s Boutique</span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.28em] text-golddeep">Est. 1998 · Family Owned</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.label}
                href={n.href}
                className={`rounded-full px-3.5 py-2 text-[14.5px] font-medium transition ${
                  pathname === n.href.split("?")[0] && (n.href === "/" ? pathname === "/" : pathname.startsWith("/shop") && n.href.includes("category") ? false : pathname === n.href)
                    ? "bg-ink text-cream"
                    : "text-cocoa hover:bg-linen hover:text-ink"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="rounded-full p-2.5 text-cocoa transition hover:bg-linen hover:text-ink"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <Link
              href={user ? "/account" : "/login"}
              className="flex items-center gap-2 rounded-full p-2.5 text-cocoa transition hover:bg-linen hover:text-ink"
              aria-label="Account"
            >
              <User className="h-5 w-5" />
              <span className="hidden max-w-[90px] truncate text-sm font-medium xl:inline">
                {user ? user.name.split(" ")[0] : "Sign in"}
              </span>
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className="relative rounded-full bg-ink p-2.5 text-cream transition hover:bg-rosewood"
              aria-label="Open bag"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-ink">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expanding search row */}
        {searchOpen && (
          <div className="border-t border-ink/10 bg-cream px-4 py-3 animate-fade-up">
            <form onSubmit={submitSearch} className="mx-auto flex max-w-2xl gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mocha" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search dresses, sweaters, denim, handbags…"
                  className="w-full rounded-full border border-ink/15 bg-white py-2.5 pl-10 pr-4 text-[15px] outline-none placeholder:text-mocha/70 focus:border-rosewood focus:ring-2 focus:ring-rosewood/20"
                />
              </div>
              <button type="submit" className="rounded-full bg-rosewood px-5 py-2.5 text-sm font-semibold text-white hover:bg-rosedeep">
                Search
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50 animate-overlay" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-[300px] flex-col bg-cream p-5 shadow-2xl animate-pop">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-bold">Menu</span>
              <button onClick={() => setMenuOpen(false)} className="rounded-full p-2 hover:bg-linen" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-4 flex flex-col gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.label}
                  href={n.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-[16px] font-medium text-ink hover:bg-linen"
                >
                  {n.label}
                </Link>
              ))}
              <div className="my-2 border-t border-ink/10" />
              <Link href={user ? "/account" : "/login"} onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-[16px] font-medium text-rosewood hover:bg-blush">
                {user ? `Hi, ${user.name.split(" ")[0]} — My Account` : "Sign in / Register"}
              </Link>
              <Link href="/admin" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-[16px] font-medium text-cocoa hover:bg-linen">
                Admin Portal
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
