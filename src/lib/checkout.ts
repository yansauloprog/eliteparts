import type { CartLine } from "./cart";
import { demoCatalog } from "../data/demo-catalog";
import { effectivePrice } from "./catalog";
export const checkoutSteps = [
  "identificacao",
  "entrega",
  "pagamento",
  "revisao",
] as const;
export const stepLabels = ["Identificação", "Entrega", "Pagamento", "Revisão"];
export type Payment = "" | "pix" | "cartao" | "boleto";
export type Buyer = { name: string; email: string; phone: string; cpf: string };
export type Address = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
};
export interface CheckoutDraft {
  buyer: Buyer;
  address: Address;
  delivery: string;
  payment: Payment;
  installments: string;
}
export const emptyCheckout: CheckoutDraft = {
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
export const states =
  "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(
    " ",
  );
export const digits = (s: string) => s.replace(/\D/g, "");
export const maskCPF = (s: string) =>
  digits(s)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1-$2");
export const maskCEP = (s: string) =>
  digits(s)
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
export const maskPhone = (s: string) => {
  const d = digits(s).slice(0, 11);
  return d
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(
      d.length > 10 ? /(\d{5})(\d{1,4})$/ : /(\d{4})(\d{1,4})$/,
      "$1-$2",
    );
};
export function buyerErrors(b: Buyer) {
  const e: Record<string, string> = {};
  if (
    b.name
      .trim()
      .split(/\s+/)
      .filter((p) => p.length >= 2).length < 2
  )
    e.name = "Informe nome e sobrenome.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(b.email.trim()))
    e.email = "Informe um e-mail válido.";
  if (![10, 11].includes(digits(b.phone).length))
    e.phone = "Informe o telefone com DDD.";
  if (digits(b.cpf).length !== 11 || /^(\d)\1{10}$/.test(digits(b.cpf)))
    e.cpf = "Use um CPF fictício com 11 dígitos.";
  return e;
}
export function addressErrors(a: Address) {
  const e: Record<string, string> = {};
  if (digits(a.cep).length !== 8) e.cep = "Informe os 8 dígitos do CEP.";
  for (const key of ["street", "district", "city"] as const)
    if (a[key].trim().length < 2) e[key] = "Preencha este campo.";
  if (!a.number.trim()) e.number = "Informe o número ou S/N.";
  if (!states.includes(a.state)) e.state = "Selecione o estado.";
  return e;
}
export function deliveryOptions(lines: CartLine[]) {
  const physical = lines.some(
    (l) => demoCatalog.find((p) => p.id === l.productId)?.type === "produto",
  );
  return physical
    ? [
        {
          id: "economica",
          name: "Entrega econômica",
          days: "7 a 10 dias úteis",
          cents: 1990,
        },
        {
          id: "expressa",
          name: "Entrega expressa",
          days: "2 a 4 dias úteis",
          cents: 3490,
        },
      ]
    : [
        {
          id: "avaliacao",
          name: "Atendimento a combinar",
          days: "Aplicação e data sob avaliação",
          cents: 0,
        },
      ];
}
export function totals(lines: CartLine[], delivery: string) {
  const subtotal = lines.reduce(
    (s, l) =>
      s +
      Math.round(
        (effectivePrice(demoCatalog.find((p) => p.id === l.productId)!) ?? 0) *
          100,
      ) *
        l.quantity,
    0,
  );
  const shipping =
    deliveryOptions(lines).find((o) => o.id === delivery)?.cents ?? 0;
  return { subtotal, shipping, total: subtotal + shipping };
}
export const paymentLabel = (p: Payment, installments = "1") =>
  p === "pix"
    ? "PIX ilustrativo"
    : p === "cartao"
      ? `Cartão demonstrativo · ${installments}x`
      : p === "boleto"
        ? "Boleto ilustrativo"
        : "A selecionar";
export interface DemoOrder {
  number: string;
  draft: CheckoutDraft;
  lines: CartLine[];
  amounts: ReturnType<typeof totals>;
  deliveryName: string;
  deliveryDays: string;
}
