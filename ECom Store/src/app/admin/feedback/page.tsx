"use client";
// Admin inbox: customer contact messages + feedback with triage actions.
import { useEffect, useMemo, useState } from "react";
import { Search, Star, Trash2, Mail, MessageSquareHeart } from "lucide-react";
import { statusColor, timeAgo } from "@/lib/format";

type Msg = {
  id: number; name: string; email: string; subject: string; message: string;
  type: string; status: string; rating: number | null; createdAt: string;
};

export default function AdminFeedback() {
  const [items, setItems] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/contact", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(d.messages || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return items.filter((m) => {
      if (type !== "all" && m.type !== type) return false;
      if (status !== "all" && m.status !== status) return false;
      if (q && !`${m.name} ${m.email} ${m.subject} ${m.message}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [items, type, status, q]);

  const update = async (id: number, st: string) => {
    const res = await fetch(`/api/contact/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: st }) });
    if (res.ok) setItems((l) => l.map((m) => (m.id === id ? { ...m, status: st } : m)));
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this message?")) return;
    const res = await fetch(`/api/contact/${id}`, { method: "DELETE" });
    if (res.ok) setItems((l) => l.filter((m) => m.id !== id));
  };

  const newCount = items.filter((m) => m.status === "new").length;
  const feedback = items.filter((m) => m.type === "feedback" && m.rating);
  const avgRating = feedback.length ? (feedback.reduce((s, m) => s + (m.rating || 0), 0) / feedback.length).toFixed(1) : "—";

  return (
    <div>
      <div>
        <h1 className="font-display text-[28px] font-bold">Feedback & Inbox</h1>
        <p className="text-sm text-mocha">{newCount} unread · {feedback.length} rated reviews · {avgRating}★ average feedback</p>
      </div>

      <div className="mt-4 flex flex-col gap-2.5 rounded-2xl bg-white p-4 ring-1 ring-ink/5 sm:flex-row sm:items-center">
        <div className="flex gap-1.5 rounded-full bg-cream p-1 ring-1 ring-ink/10">
          {(["all", "contact", "feedback"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-semibold capitalize ${type === t ? "bg-ink text-cream" : "text-cocoa"}`}
            >
              {t === "contact" ? <Mail className="h-3.5 w-3.5" /> : t === "feedback" ? <MessageSquareHeart className="h-3.5 w-3.5" /> : null}
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-full border border-ink/15 bg-cream/50 px-4 py-2 text-sm font-medium outline-none" aria-label="Filter by status">
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
          <option value="archived">Archived</option>
        </select>
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mocha" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages…" className="w-full rounded-full border border-ink/15 bg-cream/50 py-2 pl-10 pr-4 text-sm outline-none focus:border-rosewood" />
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {loading && <p className="rounded-2xl bg-white p-10 text-center text-sm text-mocha ring-1 ring-ink/5">Loading inbox…</p>}
        {!loading && filtered.length === 0 && (
          <p className="rounded-2xl bg-white p-10 text-center text-sm text-mocha ring-1 ring-ink/5">Inbox zero for these filters. 🎉</p>
        )}
        {filtered.map((m) => (
          <article key={m.id} className={`rounded-2xl bg-white p-5 ring-1 ${m.status === "new" ? "ring-rosewood/30 border-l-4 border-l-rosewood" : "ring-ink/5"}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blush text-sm font-bold text-rosedeep">
                {m.name.charAt(0).toUpperCase()}
              </span>
              <div className="mr-auto">
                <p className="text-[14.5px] font-bold">{m.name} <span className="font-normal text-mocha">· {m.email}</span></p>
                <p className="text-xs text-mocha">{timeAgo(m.createdAt)}{m.subject ? ` · ${m.subject}` : ""}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${m.type === "feedback" ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"}`}>
                {m.type}
              </span>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${statusColor(m.status)}`}>{m.status}</span>
            </div>
            {m.rating ? (
              <div className="mt-2 flex text-golddeep">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < (m.rating || 0) ? "fill-current" : "opacity-25"}`} />
                ))}
              </div>
            ) : null}
            <p className="mt-2.5 rounded-xl bg-cream/60 p-3.5 text-[14px] leading-relaxed text-cocoa ring-1 ring-ink/5">{m.message}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {m.status === "new" && (
                <button onClick={() => update(m.id, "read")} className="rounded-full bg-sky-100 px-4 py-1.5 text-[13px] font-semibold text-sky-800 hover:bg-sky-200">Mark read</button>
              )}
              {m.status !== "replied" && (
                <button onClick={() => update(m.id, "replied")} className="rounded-full bg-emerald-100 px-4 py-1.5 text-[13px] font-semibold text-emerald-800 hover:bg-emerald-200">Mark replied</button>
              )}
              {m.status !== "archived" && (
                <button onClick={() => update(m.id, "archived")} className="rounded-full bg-stone-200 px-4 py-1.5 text-[13px] font-semibold text-stone-700 hover:bg-stone-300">Archive</button>
              )}
              {m.status === "archived" && (
                <button onClick={() => update(m.id, "new")} className="rounded-full bg-amber-100 px-4 py-1.5 text-[13px] font-semibold text-amber-800 hover:bg-amber-200">Reopen</button>
              )}
              <button onClick={() => remove(m.id)} className="ml-auto flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-semibold text-mocha hover:bg-rose-100 hover:text-rose-700">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
