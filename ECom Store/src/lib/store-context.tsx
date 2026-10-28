"use client";
// Global storefront state: current user + cart drawer + cart contents.
// Guest carts live in localStorage; logged-in carts sync to the DB via /api/cart.
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export type UserShape = {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  zip?: string | null;
} | null;

export type CartLine = {
  key: string; // productId:size
  productId: number;
  name: string;
  image: string;
  priceCents: number;
  size: string;
  quantity: number;
  stock: number;
};

type StoreCtx = {
  user: UserShape;
  loadingUser: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  cart: CartLine[];
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  addToCart: (line: Omit<CartLine, "key" | "quantity">, qty?: number) => Promise<void>;
  updateQty: (key: string, qty: number) => Promise<void>;
  removeLine: (key: string) => Promise<void>;
  clearCart: () => Promise<void>;
  cartCount: number;
  cartTotal: number;
  toast: string | null;
  showToast: (msg: string) => void;
};

const Ctx = createContext<StoreCtx | null>(null);

const GUEST_KEY = "sb_guest_cart";

function loadGuest(): CartLine[] {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserShape>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  // Load cart: server cart when logged in, guest cart otherwise.
  const refreshCart = useCallback(async (u: UserShape) => {
    if (u) {
      try {
        const res = await fetch("/api/cart", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const lines: CartLine[] = (data.items || []).map((it: {
            productId: number; name: string; image: string; priceCents: number; size: string; quantity: number; stock: number;
          }) => ({
            key: `${it.productId}:${it.size}`,
            productId: it.productId,
            name: it.name,
            image: it.image,
            priceCents: it.priceCents,
            size: it.size,
            quantity: it.quantity,
            stock: it.stock,
          }));
          setCart(lines);
          return;
        }
      } catch { /* fall through */ }
      setCart([]);
    } else {
      setCart(loadGuest());
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!loadingUser) refreshCart(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loadingUser]);

  // Merge guest cart into account on login.
  useEffect(() => {
    if (user) {
      const guest = loadGuest();
      if (guest.length > 0) {
        (async () => {
          for (const g of guest) {
            await fetch("/api/cart", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId: g.productId, quantity: g.quantity, size: g.size }),
            });
          }
          localStorage.removeItem(GUEST_KEY);
          refreshCart(user);
        })();
      }
    }
  }, [user, refreshCart]);

  const persistGuest = (lines: CartLine[]) => {
    setCart(lines);
    try {
      localStorage.setItem(GUEST_KEY, JSON.stringify(lines));
    } catch { /* ignore */ }
  };

  const addToCart: StoreCtx["addToCart"] = async (line, qty = 1) => {
    const key = `${line.productId}:${line.size}`;
    if (user) {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: line.productId, quantity: qty, size: line.size }),
      });
      await refreshCart(user);
    } else {
      const existing = loadGuest();
      const found = existing.find((l) => l.key === key);
      if (found) {
        found.quantity = Math.min(found.stock || 99, found.quantity + qty);
        persistGuest([...existing]);
      } else {
        persistGuest([...existing, { ...line, key, quantity: qty }]);
      }
    }
    showToast(`Added to bag — ${line.name}`);
    setCartOpen(true);
  };

  const updateQty: StoreCtx["updateQty"] = async (key, qty) => {
    if (qty < 1) return removeLine(key);
    if (user) {
      const line = cart.find((l) => l.key === key);
      if (!line) return;
      // find server item id via re-fetch approach: update by product+size
      await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: line.productId, size: line.size, quantity: qty }),
      });
      await refreshCart(user);
    } else {
      const lines = loadGuest().map((l) => (l.key === key ? { ...l, quantity: Math.min(qty, l.stock || 99) } : l));
      persistGuest(lines);
    }
  };

  const removeLine: StoreCtx["removeLine"] = async (key) => {
    if (user) {
      const line = cart.find((l) => l.key === key);
      if (!line) return;
      await fetch(`/api/cart?productId=${line.productId}&size=${encodeURIComponent(line.size)}`, { method: "DELETE" });
      await refreshCart(user);
    } else {
      persistGuest(loadGuest().filter((l) => l.key !== key));
    }
  };

  const clearCart: StoreCtx["clearCart"] = async () => {
    if (user) {
      await fetch("/api/cart?all=1", { method: "DELETE" });
      await refreshCart(user);
    } else {
      persistGuest([]);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setCart([]);
    try { localStorage.removeItem(GUEST_KEY); } catch { /* ignore */ }
    window.location.href = "/";
  };

  const cartCount = cart.reduce((s, l) => s + l.quantity, 0);
  const cartTotal = cart.reduce((s, l) => s + l.quantity * l.priceCents, 0);

  return (
    <Ctx.Provider
      value={{
        user, loadingUser, refreshUser, logout,
        cart, cartOpen, setCartOpen, addToCart, updateQty, removeLine, clearCart,
        cartCount, cartTotal, toast, showToast,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}
