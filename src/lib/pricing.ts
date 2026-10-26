import type { DemoProduct } from "../data/demo-catalog";
export const effectivePrice = (p: DemoProduct) => {
  if (typeof p.price !== "number" || !Number.isFinite(p.price) || p.price < 0)
    return null;
  return typeof p.promotionalPrice === "number" &&
    Number.isFinite(p.promotionalPrice) &&
    p.promotionalPrice >= 0 &&
    p.promotionalPrice < p.price
    ? p.promotionalPrice
    : p.price;
};
export const currency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );
