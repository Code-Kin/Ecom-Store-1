"use client";
// Wraps every storefront page with header, footer, bag drawer and toast notifications.
import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";
import { useStore } from "@/lib/store-context";
import { CheckCircle2 } from "lucide-react";

export default function StoreShell({ children }: { children: ReactNode }) {
  const { toast } = useStore();
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 animate-pop">
          <div className="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream shadow-2xl">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
