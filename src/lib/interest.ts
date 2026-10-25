export const PRIVACY_VERSION = "2026-10-25";
export function normalizePhone(input: string) {
  let n = input.replace(/[\s().-]/g, "");
  if (!n.startsWith("+") && /^\d{10,11}$/.test(n)) n = "+55" + n;
  else if (!n.startsWith("+")) n = "+" + n;
  if (
    !/^\+[1-9]\d{7,14}$/.test(n) ||
    (n.startsWith("+55") && !/^\+55[1-9][0-9][0-9]{8,9}$/.test(n))
  )
    throw new Error("Informe um telefone válido, com DDD e código do país.");
  return n;
}
export type Receipt = {
  id: string;
  number: string;
  name: string;
  items: { sku: string; name: string; quantity: number }[];
};
export function whatsappURL(r: Receipt) {
  if (!/^[1-9]\d{7,14}$/.test(r.number))
    throw new Error("Atendimento comercial aguardando configuração.");
  const list = r.items
    .slice(0, 10)
    .map(
      (i, n) =>
        `${n + 1}. ${i.name}\nCódigo: ${i.sku}\nQuantidade: ${i.quantity}`,
    )
    .join("\n\n");
  const text = `Olá! Tenho interesse nos seguintes produtos da Elite Parts:\n\n${list}${r.items.length > 10 ? "\n\nDemais itens registrados no orçamento." : ""}\n\nMeu nome é ${r.name} e gostaria de solicitar um orçamento.\nReferência: ${r.id}`;
  return `https://wa.me/${r.number}?text=${encodeURIComponent(text)}`;
}
