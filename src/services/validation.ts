export function decimalPrice(value: string): string | null {
  if (!value.trim()) return null;
  const clean = value.trim().replace(",", ".");
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(clean))
    throw new Error(
      "Informe um preço positivo, com até duas casas decimais, sem separador de milhar.",
    );
  const [whole, fraction = ""] = clean.split(".");
  return `${whole.replace(/^0+(?=\d)/, "")}.${fraction.padEnd(2, "0")}`;
}
export function validateSKU(sku: string) {
  if (!sku || sku.length > 120 || sku !== sku.trim())
    throw new Error(
      "Informe o código/SKU original, com até 120 caracteres e sem espaços nas extremidades.",
    );
  return sku;
}
export function validParent(
  id: string,
  parentId: string,
  categories: { id: string; parent_id: string | null }[],
) {
  const seen = new Set<string>(id ? [id] : []);
  let next: string | null = parentId || null;
  while (next) {
    if (seen.has(next)) return false;
    seen.add(next);
    next = categories.find((c) => c.id === next)?.parent_id ?? null;
  }
  return true;
}
