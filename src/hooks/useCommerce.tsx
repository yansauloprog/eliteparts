import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { CheckoutDraft, DemoOrder } from "../lib/checkout";
const emptyCheckout: CheckoutDraft = {
  buyer: { name: "", email: "", phone: "", cpf: "" },
  address: {
    cep: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
  },
  delivery: "economica",
  payment: "",
  installments: "1",
};
import type { DemoProduct } from "../data/demo-catalog";
import {
  clampQuantity,
  decodeCart,
  lineKey,
  type CartChoice,
  type CartLine,
  emptyChoice,
} from "../lib/cart";
const CART_KEY = "elite-parts.interests.v1",
  FAV_KEY = "elite-parts.favorites.v1";
function loadFavorites() {
  try {
    const v = JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]");
    return Array.isArray(v)
      ? ([
          ...new Set(
            v
              .filter(
                (id: unknown) =>
                  typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id),
              )
              .slice(0, 100),
          ),
        ] as string[])
      : [];
  } catch {
    return [];
  }
}
function loadCart() {
  try {
    return decodeCart(localStorage.getItem(CART_KEY));
  } catch {
    return [];
  }
}
function useValue() {
  const [cart, setCart] = useState<CartLine[]>(loadCart),
    [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const [checkout, setCheckout] = useState<CheckoutDraft>(emptyCheckout);
  const [order, setOrder] = useState<DemoOrder | null>(null);
  const [cartOpen, setCartOpen] = useState(false),
    [quickView, setQuickView] = useState<DemoProduct | null>(null),
    [quote, setQuote] = useState<string | null>(null),
    [toast, setToast] = useState("");
  useEffect(() => {
    try {
      localStorage.setItem(
        CART_KEY,
        JSON.stringify({ version: 1, items: cart }),
      );
    } catch {}
  }, [cart]);
  useEffect(() => {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
    } catch {}
  }, [favorites]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(timer);
  }, [toast]);
  const toggleFavorite = (p: DemoProduct) => {
    setFavorites((prev) =>
      prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id],
    );
    setToast(
      favorites.includes(p.id)
        ? "Removido dos favoritos"
        : "Salvo nos favoritos",
    );
  };
  const add = (
    p: DemoProduct,
    quantity = 1,
    choice: CartChoice = emptyChoice,
  ) => {
    if ("availability" in p && p.availability === "indisponivel") {
      setToast("Este produto está indisponível.");
      return;
    }
    if (cart.length >= 50 && !cart.some((l) => l.productId === p.id)) {
      setToast("Sua lista pode conter até 50 produtos.");
      return;
    }
    const safe = {
      ...choice,
      installation: p.installation && choice.installation,
    };
    const key = lineKey(p.id, safe);
    setCart((prev) => {
      const line = prev.find((l) => l.productId === p.id);
      if (!line && prev.length >= 50) return prev;
      return line
        ? prev.map((l) =>
            l.key === line.key
              ? {
                  ...l,
                  quantity:
                    p.type === "servico"
                      ? 1
                      : clampQuantity(l.quantity + quantity),
                }
              : l,
          )
        : [
            ...prev,
            {
              ...safe,
              key,
              productId: p.id,
              quantity: p.type === "servico" ? 1 : clampQuantity(quantity),
            },
          ];
    });
    setToast("Produto adicionado à lista de interesses");
  };
  const updateQuantity = (key: string, n: number) =>
    setCart((prev) =>
      prev.map((l) =>
        l.key === key
          ? {
              ...l,
              quantity: clampQuantity(n),
            }
          : l,
      ),
    );
  const remove = (key: string) =>
    setCart((prev) => prev.filter((l) => l.key !== key));
  return {
    cart,
    checkout,
    setCheckout,
    order,
    setOrder,
    clearCart: () => setCart([]),
    favorites,
    cartOpen,
    setCartOpen,
    quickView,
    setQuickView,
    quote,
    setQuote,
    toast,
    setToast,
    toggleFavorite,
    add,
    updateQuantity,
    remove,
    count: cart.reduce((s, l) => s + l.quantity, 0),
  };
}
const CommerceContext = createContext<ReturnType<typeof useValue> | null>(null);
export function CommerceProvider({ children }: { children: ReactNode }) {
  const value = useValue();
  return (
    <CommerceContext.Provider value={value}>
      {children}
    </CommerceContext.Provider>
  );
}
export function useCommerce() {
  const v = useContext(CommerceContext);
  if (!v) throw Error("CommerceProvider ausente");
  return v;
}
