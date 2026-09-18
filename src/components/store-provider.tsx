"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  initialSettings,
  type Product,
  type CartItem,
  type Order,
  type Settings,
} from "@/lib/data";
type State = {
  products: Product[];
  cart: CartItem[];
  favorites: string[];
  orders: Order[];
  settings: Settings;
  profile: { name: string; email: string };
  messages: {
    id: string;
    name: string;
    email: string;
    message: string;
    date: string;
  }[];
  authenticated: boolean;
  admin: boolean;
  paymentConfigured: boolean;
  mastercardEnabled: boolean;
};
const defaults: State = {
  products: [],
  cart: [],
  favorites: [],
  orders: [],
  settings: initialSettings,
  profile: { name: "", email: "" },
  messages: [],
  authenticated: false,
  admin: false,
  paymentConfigured: false,
  mastercardEnabled: false,
};
export async function api(path: string, data?: unknown) {
  const r = await fetch(path, {
    method: data === undefined ? "GET" : "POST",
    credentials: "same-origin",
    headers:
      data === undefined ? undefined : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
    cache: "no-store",
  });
  const json = await r.json();
  if (!r.ok) throw new Error(json.error || "Service indisponible.");
  return json;
}
type CheckoutDetails = {
  customer: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  method: string;
  coupon?: string;
  acceptedTerms: boolean;
};
type Context = State & {
  ready: boolean;
  busy: boolean;
  refresh: () => Promise<void>;
  update: (s: Partial<State>) => Promise<boolean>;
  add: (id: string, q?: number) => void;
  quantity: (id: string, q: number) => void;
  favorite: (id: string) => void;
  notify: (t: string) => void;
  checkout: (d: CheckoutDetails) => Promise<string | null>;
};
const StoreContext = createContext<Context | null>(null);
const key = "mada-shopping-v2";
export function StoreProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial?: Pick<State, "products" | "settings">;
}) {
  const [state, setState] = useState({ ...defaults, ...initial }),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useState(""),
    [loadError, setLoadError] = useState("");
  const current = useRef(state);
  useEffect(() => {
    current.current = state;
  }, [state]);
  const mutation = useRef(false);
  const refresh = useCallback(async () => {
    const result = await api("/api/store");
    setState((s) => ({ ...s, ...result }));
    setLoadError("");
    setReady(true);
  }, []);
  useEffect(() => {
    const read = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(key) || "{}");
        const quantities = new Map<string, number>();
        if (Array.isArray(saved.cart))
          for (const x of saved.cart) {
            if (
              typeof x?.id === "string" &&
              Number.isInteger(x.quantity) &&
              x.quantity > 0 &&
              x.quantity <= 1000
            )
              quantities.set(
                x.id,
                Math.min(1000, (quantities.get(x.id) || 0) + x.quantity),
              );
          }
        setState((s) => ({
          ...s,
          cart: [...quantities].map(([id, quantity]) => ({ id, quantity })),
          favorites: Array.isArray(saved.favorites)
            ? saved.favorites
                .filter((x: unknown) => typeof x === "string")
                .slice(0, 1000)
            : [],
        }));
      } catch {
        setToast("Panier local illisible. Il a été réinitialisé.");
      }
    };
    queueMicrotask(read);
    void api("/api/store")
      .then((result) => {
        setState((s) => ({ ...s, ...result }));
        setLoadError("");
        setReady(true);
      })
      .catch((e) => setLoadError(e.message));
    const sync = (e: StorageEvent) => {
      if (e.key === key) read();
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [refresh]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ cart: state.cart, favorites: state.favorites }),
      );
    } catch {
      queueMicrotask(() =>
        setToast(
          "Le panier ne pourra pas être conservé sur cet appareil. Les commandes restent enregistrées sur le serveur.",
        ),
      );
    }
  }, [state.cart, state.favorites, ready]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 7000);
    return () => clearTimeout(t);
  }, [toast]);
  const update: Context["update"] = async (value) => {
    if (mutation.current) return false;
    mutation.current = true;
    setBusy(true);
    try {
      if (value.products) {
        const changed = value.products.filter(
          (p) =>
            JSON.stringify(
              current.current.products.find((x) => x.id === p.id),
            ) !== JSON.stringify(p),
        );
        for (const p of changed)
          await api("/api/admin/product", {
            ...p,
            sku: p.sku || p.id,
            group: p.group || "",
          });
      }
      if (value.settings) await api("/api/admin/settings", value.settings);
      if (value.orders) {
        for (const o of value.orders.filter(
          (o) =>
            JSON.stringify(
              current.current.orders.find((x) => x.id === o.id),
            ) !== JSON.stringify(o),
        ))
          await api("/api/admin/order", {
            id: o.id,
            status: o.status,
            tracking: o.tracking || "",
          });
      }
      if (value.profile)
        await api("/api/auth/profile", { name: value.profile.name });
      if (value.messages) {
        const message = value.messages.find(
          (x) => !current.current.messages.some((m) => m.id === x.id),
        );
        if (message)
          await api("/api/contact", {
            name: message.name,
            email: message.email,
            message: message.message,
          });
      }
      await refresh();
      setToast("Enregistré dans la base de données.");
      return true;
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Enregistrement impossible.");
      return false;
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  };
  const add = (id: string, q = 1) => {
    setState((s) => {
      const p = s.products.find((p) => p.id === id);
      if (!p?.active || !Number.isInteger(q) || q < 1) return s;
      const old = s.cart.find((x) => x.id === id)?.quantity || 0;
      if (old + q > p.stock) return s;
      return {
        ...s,
        cart: [...s.cart.filter((x) => x.id !== id), { id, quantity: old + q }],
      };
    });
  };
  const quantity = (id: string, q: number) => {
    if (!Number.isInteger(q)) return;
    setState((s) => ({
      ...s,
      cart:
        q <= 0
          ? s.cart.filter((x) => x.id !== id)
          : s.cart
              .map((x) =>
                x.id === id
                  ? {
                      id,
                      quantity: Math.min(
                        q,
                        s.products.find((p) => p.id === id)?.stock || 0,
                      ),
                    }
                  : x,
              )
              .filter((x) => x.quantity > 0),
    }));
  };
  const checkout: Context["checkout"] = async (details) => {
    if (mutation.current) return null;
    mutation.current = true;
    setBusy(true);
    try {
      const fingerprint = JSON.stringify({
        items: current.current.cart,
        ...details,
      });
      let saved;
      try {
        saved = JSON.parse(sessionStorage.getItem("mada-checkout") || "null");
      } catch {}
      if (!saved || saved.fingerprint !== fingerprint)
        saved = { fingerprint, id: crypto.randomUUID() };
      sessionStorage.setItem("mada-checkout", JSON.stringify(saved));
      const { id } = await api("/api/checkout", {
        ...details,
        coupon: details.coupon || "",
        items: current.current.cart,
        idempotencyKey: saved.id,
      });
      setState((s) => ({ ...s, cart: [] }));
      sessionStorage.removeItem("mada-checkout");
      await refresh().catch(() =>
        setToast(
          "Commande enregistrée. Actualisez votre compte pour la retrouver.",
        ),
      );
      return id;
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Commande impossible.");
      return null;
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  };
  return (
    <StoreContext.Provider
      value={{
        ...state,
        ready,
        busy,
        refresh,
        update,
        add,
        quantity,
        checkout,
        favorite: (id) =>
          setState((s) => ({
            ...s,
            favorites: s.favorites.includes(id)
              ? s.favorites.filter((x) => x !== id)
              : [...s.favorites, id],
          })),
        notify: setToast,
      }}
    >
      {loadError && (
        <div className="notice" role="alert">
          {loadError}{" "}
          <button
            onClick={() => void refresh().catch((e) => setLoadError(e.message))}
          >
            Réessayer
          </button>
        </div>
      )}
      {children}
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button
            aria-label="Fermer la notification"
            onClick={() => setToast("")}
          >
            ×
          </button>
        </div>
      )}
    </StoreContext.Provider>
  );
}
export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("StoreProvider missing");
  return ctx;
}
