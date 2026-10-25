import { demoCatalog } from "../data/demo-catalog";
export interface CartChoice {
  option: string;
  installation: boolean;
  vehicle: { brand: string; model: string; year: string };
}
export interface CartLine extends CartChoice {
  key: string;
  productId: string;
  quantity: number;
}
export const emptyChoice: CartChoice = {
  option: "Avaliar opções com a loja",
  installation: false,
  vehicle: { brand: "", model: "", year: "" },
};
export const clampQuantity = (n: number) =>
  Number.isFinite(n) ? Math.min(99, Math.max(1, Math.trunc(n))) : 1;
const clean = (s: unknown) => (typeof s === "string" ? s.slice(0, 160) : "");
export const lineKey = (id: string, c: CartChoice) =>
  JSON.stringify([
    id,
    c.option,
    c.installation,
    c.vehicle.brand,
    c.vehicle.model,
    c.vehicle.year,
  ]);
export function decodeCart(raw: string | null): CartLine[] {
  try {
    const value = JSON.parse(raw ?? "null");
    if (value?.version !== 1 || !Array.isArray(value.items)) return [];
    const result: CartLine[] = [];
    for (const v of value.items.slice(0, 100)) {
      const p = demoCatalog.find((p) => p.id === v?.productId);
      if (!p || typeof v.quantity !== "number") continue;
      const choice: CartChoice = {
        option: clean(v.option),
        installation: p.installation && v.installation === true,
        vehicle: {
          brand: clean(v.vehicle?.brand),
          model: clean(v.vehicle?.model),
          year: clean(v.vehicle?.year),
        },
      };
      const key = lineKey(p.id, choice);
      const existing = result.find((l) => l.key === key);
      const quantity = p.type === "servico" ? 1 : clampQuantity(v.quantity);
      if (existing)
        existing.quantity =
          p.type === "servico"
            ? 1
            : clampQuantity(existing.quantity + quantity);
      else result.push({ ...choice, key, productId: p.id, quantity });
    }
    return result;
  } catch {
    return [];
  }
}
