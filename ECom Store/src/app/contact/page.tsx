"use client";
// Contact + feedback: message forms, store info, hours, FAQ.
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, MapPin, Phone, Clock, Send, MessageSquareHeart, Star, ChevronDown } from "lucide-react";
import StoreShell from "@/components/storefront/StoreShell";
import { useStore } from "@/lib/store-context";

const FAQS = [
  { q: "How long does shipping take?", a: "Orders ship from Cape Town within 1–2 business days. Standard delivery takes 3–5 business days and is free over R1,000; express 2-day is available at checkout." },
  { q: "What is your return policy?", a: "30 days, no questions asked. Start a return from your account page, by email, or in store. Exchanges ship free." },
  { q: "Do you offer in-store pickup?", a: "Yes! Choose 'Cape Town Pickup' at checkout and we'll have your order ready within 4 hours during store hours." },
  { q: "How do sizes run?", a: "Most pieces run true to size. Between sizes? We recommend sizing up in fitted dresses and down in relaxed knits — or call us and we'll measure the garment for you." },
  { q: "Is my payment information safe?", a: "Absolutely. Checkout is encrypted with 256-bit SSL and processed by a PCI-compliant gateway. We never see or store full card numbers." },
];

function ContactInner() {
  const sp = useSearchParams();
  const { user, showToast } = useStore();
  const [kind, setKind] = useState<"contact" | "feedback">(sp.get("type") === "feedback" ? "feedback" : "contact");
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", subject: "", message: "", rating: 5 });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: kind }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not send.");
      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "", rating: 5 });
      showToast("Message sent — we reply within 24h!");
      setTimeout(() => setSent(false), 5000);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not send.");
    } finally {
      setSending(false);
    }
  };

  const input = "w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-[15px] outline-none focus:border-rosewood focus:ring-2 focus:ring-rosewood/20";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-[12px] font-bold uppercase tracking-[0.24em] text-golddeep">We&apos;d love to hear from you</p>
      <h1 className="font-display text-[34px] font-bold sm:text-[42px]">Contact & Feedback</h1>
      <p className="mt-1 max-w-2xl text-[15.5px] text-cocoa">
        Questions about sizing, orders, or returns — or just want to tell us how much you love your new dress? Send a note; a real family member replies within 24 hours.
      </p>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Form card */}
        <div className="rounded-3xl bg-white p-6 ring-1 ring-ink/5 sm:p-8">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-cream p-1.5 ring-1 ring-ink/10">
            {(
              [
                ["contact", "Contact Us", Mail],
                ["feedback", "Leave Feedback", MessageSquareHeart],
              ] as const
            ).map(([v, l, Icon]) => (
              <button
                key={v}
                type="button"
                onClick={() => setKind(v)}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${kind === v ? "bg-ink text-cream shadow" : "text-cocoa hover:text-ink"}`}
              >
                <Icon className="h-4 w-4" /> {l}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-5 grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-cocoa">Your name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" className={input} />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-cocoa">Email *</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className={input} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[13px] font-semibold text-cocoa">Subject</label>
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder={kind === "feedback" ? "e.g. Love my new sweater!" : "e.g. Question about my order #1024"} className={input} />
            </div>
            {kind === "feedback" && (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[13px] font-semibold text-cocoa">Your rating</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })} aria-label={`${n} stars`}>
                      <Star className={`h-7 w-7 transition ${n <= form.rating ? "fill-gold text-golddeep" : "text-stone-300 hover:text-gold"}`} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[13px] font-semibold text-cocoa">Message *</label>
              <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder={kind === "feedback" ? "Tell us what you loved (or what we can do better)…" : "How can we help?"}
                className={input} />
            </div>
            <div className="sm:col-span-2">
              <button disabled={sending} className="flex w-full items-center justify-center gap-2 rounded-full bg-rosewood py-3 text-[15px] font-semibold text-white hover:bg-rosedeep disabled:opacity-60 sm:w-auto sm:px-8">
                {sending ? "Sending…" : <><Send className="h-4 w-4" /> {kind === "feedback" ? "Submit Feedback" : "Send Message"}</>}
              </button>
              {sent && <p className="mt-2 text-sm font-medium text-sagedeep">✓ Received! We&apos;ll be in touch within 24 hours.</p>}
            </div>
          </form>
        </div>

        {/* Side column */}
        <div className="space-y-5">
          <div className="overflow-hidden rounded-3xl bg-ink text-cream">
            <div className="texture-weave p-6">
              <h2 className="font-display text-xl font-bold">Visit the Store</h2>
              <ul className="mt-4 space-y-3.5 text-[14px] text-cream/80">
                <li className="flex gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> 84 Kloof Street, Gardens<br />Cape Town, 8001</li>
                <li className="flex items-center gap-2.5"><Phone className="h-4 w-4 shrink-0 text-gold" /> +27 21 422 0198</li>
                <li className="flex items-center gap-2.5"><Mail className="h-4 w-4 shrink-0 text-gold" /> hello@sarahsboutique.com</li>
                <li className="flex gap-2.5"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> <span>Mon–Sat · 9am–8pm<br />Sunday · 11am–5pm</span></li>
              </ul>
            </div>
            {/* Stylized map placeholder */}
            <div className="relative h-44 bg-sage/30">
              <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(#fff3 1px, transparent 1px), linear-gradient(90deg, #fff3 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-rosewood text-white shadow-xl"><MapPin className="h-5 w-5" /></span>
                <p className="mt-1.5 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold">Rosewater Lane & 5th</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 ring-1 ring-ink/5">
            <h2 className="font-display text-xl font-bold">Quick Answers</h2>
            <div className="mt-3 divide-y divide-ink/8">
              {FAQS.map((f, i) => (
                <div key={i}>
                  <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between gap-2 py-3 text-left text-[14px] font-semibold">
                    {f.q}
                    <ChevronDown className={`h-4 w-4 shrink-0 text-mocha transition ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && <p className="pb-3 text-[13.5px] leading-relaxed text-cocoa">{f.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <StoreShell>
      <Suspense><ContactInner /></Suspense>
    </StoreShell>
  );
}
