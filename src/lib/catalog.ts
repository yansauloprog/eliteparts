import { demoCatalog, type DemoProduct } from "../data/demo-catalog";
import { categoryName } from "../data/categories";
export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
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
const curated = [
  1, 5, 9, 18, 10, 12, 2, 17, 11, 6, 20, 23, 16, 21, 4, 14, 3, 7, 8, 13, 15, 19,
  22, 24,
].map((n) => `demo-${n}`);
export function filterCatalog(
  query: string,
  category: string,
  type: string,
  sort: string,
  favorites?: string[],
) {
  return demoCatalog
    .filter(
      (p) =>
        (!favorites || favorites.includes(p.id)) &&
        (!category || p.category === category) &&
        (!type || p.type === type) &&
        normalize(
          `${p.name} ${p.description} ${categoryName(p.category)}`,
        ).includes(normalize(query.trim())),
    )
    .sort((a, b) =>
      sort === "nome-desc"
        ? b.name.localeCompare(a.name, "pt-BR")
        : sort === "nome"
          ? a.name.localeCompare(b.name, "pt-BR")
          : curated.indexOf(a.id) - curated.indexOf(b.id),
    );
}
