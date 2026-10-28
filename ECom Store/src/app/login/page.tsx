"use client";
// Customer + admin sign-in. Accepts ?next= for post-login redirect.
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Flower2, Mail, Lock, ArrowRight } from "lucide-react";
import StoreShell from "@/components/storefront/StoreShell";
import { useStore } from "@/lib/store-context";

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/account";
  const { refreshUser, showToast } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Login failed.");
      await refreshUser();
      showToast(`Welcome back, ${d.user.name.split(" ")[0]}!`);
      router.push(d.user.role === "admin" && next === "/account" ? "/admin" : next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid overflow-hidden rounded-[28px] bg-white shadow-xl ring-1 ring-ink/10 lg:grid-cols-2">
        <div className="relative hidden lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.pexels.com/photos/8387835/pexels-photo-8387835.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
            alt="Inside Sarah's Boutique"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8 text-cream">
            <p className="font-display text-2xl font-bold">Welcome back to the family.</p>
            <p className="mt-1 text-[14.5px] text-cream/80">Track orders, check out faster, and get first dibs on new arrivals.</p>
          </div>
        </div>
        <div className="p-7 sm:p-10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rosewood text-cream"><Flower2 className="h-5 w-5" /></span>
            <span className="font-display text-xl font-bold">Sign In</span>
          </div>
          <p className="mt-2 text-[14.5px] text-mocha">Good to see you again — let&apos;s get you shopping.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-cocoa">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mocha" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full rounded-xl border border-ink/15 py-2.5 pl-10 pr-4 text-[15px] outline-none focus:border-rosewood focus:ring-2 focus:ring-rosewood/20" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-cocoa">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mocha" />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full rounded-xl border border-ink/15 py-2.5 pl-10 pr-4 text-[15px] outline-none focus:border-rosewood focus:ring-2 focus:ring-rosewood/20" />
              </div>
            </div>
            {error && <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-200">{error}</p>}
            <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 text-[15px] font-semibold text-cream hover:bg-rosewood disabled:opacity-60">
              {busy ? "Signing in…" : <>Sign In <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-mocha">
            New here? <Link href="/register" className="font-semibold text-rosewood underline-offset-4 hover:underline">Create an account</Link>
          </p>
          <div className="mt-6 rounded-2xl bg-cream p-4 text-[13px] leading-relaxed text-cocoa ring-1 ring-ink/10">
            <p className="font-bold text-ink">Try the demo accounts</p>
            <p className="mt-1">Customer: <code className="rounded bg-white px-1.5 py-0.5 ring-1 ring-ink/10">emma@example.com</code> / <code className="rounded bg-white px-1.5 py-0.5 ring-1 ring-ink/10">password123</code></p>
            <p className="mt-1">Admin: <code className="rounded bg-white px-1.5 py-0.5 ring-1 ring-ink/10">admin@sarahsboutique.com</code> / <code className="rounded bg-white px-1.5 py-0.5 ring-1 ring-ink/10">admin123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <StoreShell>
      <Suspense><LoginForm /></Suspense>
    </StoreShell>
  );
}
