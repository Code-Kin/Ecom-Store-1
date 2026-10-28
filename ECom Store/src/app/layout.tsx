import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StoreProvider } from "@/lib/store-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sarah's Boutique — Family-Owned Fashion, Online",
  description:
    "Sarah's Boutique is a small, family-owned clothing store. Shop dresses, tops, denim, knitwear and accessories with fast shipping and easy returns.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-cream text-ink antialiased min-h-screen">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
