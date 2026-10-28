"use client";
// Admin portal chrome: sidebar navigation, topbar, mobile drawer.
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Inbox, Store, LogOut,
  Menu, X, Flower2, ShieldCheck,
} from "lucide-react";
import { useStore } from "@/lib/store-context";

const NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Feedback & Inbox", href: "/admin/feedback", icon: Inbox },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useStore();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="flex items-center gap-2.5 px-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-ink"><Flower2 className="h-5 w-5" /></span>
        <span className="leading-tight">
          <span className="font-display block text-[18px] font-bold text-cream">Sarah&apos;s Boutique</span>
          <span className="flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-gold"><ShieldCheck className="h-3 w-3" /> Admin Portal</span>
        </span>
      </Link>
      <nav className="mt-7 flex flex-col gap-1">
        {NAV.map((n) => {
          const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition ${
                active ? "bg-cream text-ink shadow" : "text-cream/70 hover:bg-cream/10 hover:text-cream"
              }`}
            >
              <n.icon className="h-5 w-5" /> {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-2 pt-6">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-cream/70 hover:bg-cream/10 hover:text-cream">
          <Store className="h-4.5 w-4.5" /> View Storefront
        </Link>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-cream/70 hover:bg-rose-500/20 hover:text-rose-200">
          <LogOut className="h-4.5 w-4.5" /> Sign Out{user ? ` (${user.name.split(" ")[0]})` : ""}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#efe7dc] lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[270px] shrink-0 bg-ink p-5 lg:block">
        {sidebar}
      </aside>
      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/60 animate-overlay" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[280px] bg-ink p-5 animate-pop">
            <div className="flex justify-end">
              <button onClick={() => setOpen(false)} className="rounded-full p-2 text-cream/70 hover:bg-cream/10" aria-label="Close menu"><X className="h-5 w-5" /></button>
            </div>
            <div className="h-[calc(100%-44px)]">{sidebar}</div>
          </aside>
        </div>
      )}
      <div className="min-w-0 flex-1">
        {/* Mobile topbar */}
        <div className="sticky top-0 z-30 flex items-center justify-between bg-ink px-4 py-3 text-cream lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-cream/10" aria-label="Open admin menu"><Menu className="h-5 w-5" /></button>
          <span className="font-display text-[17px] font-bold">Admin Portal</span>
          <Link href="/" className="rounded-lg p-2 hover:bg-cream/10" aria-label="View store"><Store className="h-5 w-5" /></Link>
        </div>
        <div className="p-4 sm:p-7">{children}</div>
      </div>
    </div>
  );
}
