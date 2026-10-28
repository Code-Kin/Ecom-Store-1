// Shared formatting helpers for the boutique storefront + admin.
// South African Rand formatting, e.g. R1,349.00 (amounts stored in cents).
export function cents(n: number | null | undefined): string {
  const v = Number(n || 0) / 100;
  return "R" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Store pricing rules (ZAR, cents). Prices are VAT-inclusive (15% SA VAT).
export const FREE_DELIVERY_CENTS = 100000; // R1,000
export const DELIVERY_CENTS = 9900; // R99
export const VAT_RATE = 0.15;

export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fullDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export const CATEGORIES = ["Dresses", "Tops", "Bottoms", "Outerwear", "Accessories"] as const;

export const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;

export function statusColor(status: string): string {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "processing":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "shipped":
      return "bg-violet-100 text-violet-800 border-violet-200";
    case "delivered":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "cancelled":
      return "bg-rose-100 text-rose-800 border-rose-200";
    case "paid":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "new":
      return "bg-rose-100 text-rose-800 border-rose-200";
    case "read":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "replied":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "archived":
      return "bg-stone-200 text-stone-600 border-stone-300";
    default:
      return "bg-stone-100 text-stone-700 border-stone-200";
  }
}
