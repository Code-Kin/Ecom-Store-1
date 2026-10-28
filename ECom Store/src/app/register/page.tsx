"use client";
// New customer registration with instant sign-in.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flower2, User, Mail, Lock, ArrowRight, Gift } from "lucide-react";
import StoreShell from "@/components/storefront/StoreShell";
import { useStore } from "@/lib/store-context";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser, showToast } = useStore();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Registration failed.");
      await refreshUser();
      showToast("Welcome to Sarah's Boutique! Enjoy 10% off.");
      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full rounded-xl border border-ink/15 py-2.5 pl-10 pr-4 text-[15px] outline-none focus:border-rosewood focus:ring-2 focus:ring-rosewood/20";

  return (
    <StoreShell>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid overflow-hidden rounded-[28px] bg-white shadow-xl ring-1 ring-ink/10 lg:grid-cols-2">
          <div className="p-7 sm:p-10">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rosewood text-cream"><Flower2 className="h-5 w-5" /></span>
              <span className="font-display text-xl font-bold">Create Account</span>
            </div>
            <p className="mt-2 text-[14.5px] text-mocha">Join the boutique family — 10% off your first order.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-cocoa">Full name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mocha" />
                  <input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Doe" className={input} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-cocoa">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mocha" />
                  <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" className={input} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-cocoa">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mocha" />
                    <input required type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="6+ characters" className={input} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-cocoa">Confirm</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mocha" />
                    <input required type="password" value={form.confirm} onChange={(e) => set("confirm", e.target.value)} placeholder="Repeat password" className={input} />
                  </div>
                </div>
              </div>
              {error && <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-200">{error}</p>}
              <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-rosewood py-3 text-[15px] font-semibold text-white hover:bg-rosedeep disabled:opacity-60">
                {busy ? "Creating account…" : <>Create Account <ArrowRight className="h-4 w-4" /></>}
              </button>
              <p className="text-center text-xs leading-relaxed text-mocha">
                By creating an account you agree to our Terms of Service and Privacy Policy. We never share your data.
              </p>
            </form>
            <p className="mt-4 text-center text-sm text-mocha">
              Already have an account? <Link href="/login" className="font-semibold text-rosewood underline-offset-4 hover:underline">Sign in</Link>
            </p>
          </div>
          <div className="relative hidden lg:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.pexels.com/photos/9218397/pexels-photo-9218397.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
              alt="Boutique clothing rack"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-8 text-cream">
              <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.22em] text-gold"><Gift className="h-4 w-4" /> Member perks</p>
              <ul className="mt-3 space-y-2 text-[14.5px] text-cream/85">
                <li>✦ 10% off your first order</li>
                <li>✦ Early access to new arrivals</li>
                <li>✦ Faster checkout & order tracking</li>
                <li>✦ Birthday surprise every year</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </StoreShell>
  );
}
