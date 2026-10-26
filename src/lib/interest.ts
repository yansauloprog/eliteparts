export const PRIVACY_VERSION = "2026-10-25";
export async function requestIdentity(
  body: unknown,
  memory: { hash: string; key: string },
  storage: Pick<Storage, "getItem" | "setItem"> | null,
) {
  const hash = Array.from(
    new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(JSON.stringify(body)),
      ),
    ),
  )
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (memory.hash === hash) return memory.key;
  let stored;
  try {
    stored = JSON.parse(storage?.getItem("elite.request") || "null");
  } catch {}
  memory.hash = hash;
  memory.key =
    stored?.hash === hash && /^[0-9a-f-]{36}$/i.test(stored.key)
      ? stored.key
      : crypto.randomUUID();
  try {
    storage?.setItem("elite.request", JSON.stringify(memory));
  } catch {}
  return memory.key;
}
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
        `${n + 1}. ${i.name.slice(0, 100)}\nCódigo: ${i.sku.slice(0, 120)}\nQuantidade: ${i.quantity}`,
    )
    .join("\n\n");
  const text = `Olá! Tenho interesse nos seguintes produtos da Elite Parts:\n\n${list}${r.items.length > 10 ? "\n\nDemais itens registrados no orçamento." : ""}\n\nMeu nome é ${r.name} e gostaria de solicitar um orçamento.\nReferência: ${r.id}`;
  const short = `Olá! Sou ${r.name}. Gostaria de solicitar um orçamento de ${r.items.length} produtos da Elite Parts.\nReferência: ${r.id}\nTodos os itens e quantidades estão registrados nesta solicitação.`;
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${r.number}?text=${encoded.length > 6000 ? encodeURIComponent(short) : encoded}`;
}
