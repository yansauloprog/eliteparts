import { useRef, useState, type FormEvent } from "react";
import { useCommerce } from "../hooks/useCommerce";
import { selectedProducts } from "../services/catalog";
import { useLoad, Loading, LoadError } from "../admin/shared";
import { db, message } from "../lib/supabase";
import { normalizePhone, whatsappURL, type Receipt } from "../lib/interest";
import { Link } from "../lib/router";
import { currency } from "../lib/catalog";
import { ProductImage } from "../components/commerce/ProductImage";
import { CommerceHeader } from "../components/commerce/CommerceHeader";
import { StoreFooter } from "../components/commerce/StoreSections";
export function InterestPanel() {
  const c = useCommerce(),
    [form, setForm] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [url, setURL] = useState(""),
    [receipt, setReceipt] = useState<Receipt | null>(null);
  const key = useRef(crypto.randomUUID()),
    lock = useRef(false);
  const r = useLoad(
    () => selectedProducts([...new Set(c.cart.map((x) => x.productId))]),
    [c.cart.map((x) => x.productId).join(",")],
  );
  const invalid = c.cart.some(
    (l) =>
      !r.data?.some(
        (p) => p.id === l.productId && p.availability !== "indisponivel",
      ),
  );
  const complete = c.cart.every(
    (l) => r.data?.find((p) => p.id === l.productId)?.price !== undefined,
  );
  const total = c.cart.reduce(
    (s, l) =>
      s + (r.data?.find((p) => p.id === l.productId)?.price || 0) * l.quantity,
    0,
  );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lock.current || receipt) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const data = new FormData(e.currentTarget),
        name = String(data.get("name")).trim().replace(/\s+/g, " "),
        phone = normalizePhone(String(data.get("phone")));
      if (name.length < 3 || name.length > 180)
        throw new Error("Informe seu nome (3 a 180 caracteres).");
      const body = {
        name,
        phone,
        privacy: data.get("privacy") === "on",
        items: c.cart.map((l) => ({ id: l.productId, quantity: l.quantity })),
      };
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
      try {
        const previous = JSON.parse(
          sessionStorage.getItem("elite.request") || "null",
        );
        if (previous?.hash === hash) key.current = previous.key;
        else
          sessionStorage.setItem(
            "elite.request",
            JSON.stringify({ hash, key: key.current }),
          );
      } catch {}
      const response = await db().functions.invoke("elite-lead-intake", {
        body: { ...body, key: key.current },
      });
      if (response.error) {
        let detail = "Não foi possível registrar. Tente novamente.";
        try {
          detail = (await response.error.context.json()).error || detail;
        } catch {}
        throw new Error(detail);
      }
      const saved = response.data as Receipt;
      setReceipt(saved);
      const target = whatsappURL(saved);
      setURL(target);
      // This is only a redirect attempt, never evidence of message delivery.
      window.open(target, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(message(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (r.loading) return <Loading />;
  if (r.error) return <LoadError error={r.error} retry={r.reload} />;
  if (!c.cart.length)
    return (
      <div className="shop-empty">
        <h3>Sua lista está vazia.</h3>
        <Link href="/catalogo" onClick={() => c.setCartOpen(false)}>
          Explorar catálogo
        </Link>
      </div>
    );
  if (receipt)
    return (
      <section className="c-interest">
        <h2>Solicitação registrada</h2>
        <p>Referência: {receipt.id}</p>
        <p>
          Seu interesse está registrado com a Elite Parts. Continue no WhatsApp
          para enviar a mensagem; o site não confirma esse envio.
        </p>
        {url ? (
          <a
            className="shop-primary"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Continuar no WhatsApp
          </a>
        ) : (
          <p role="alert">{error}</p>
        )}
      </section>
    );
  return (
    <section className="c-interest">
      {c.cart.map((l) => {
        const p = r.data?.find((p) => p.id === l.productId);
        return (
          <article className="c-interest-item" key={l.key}>
            <div>
              <ProductImage
                image={p?.images[0]}
                name={p?.name || "Produto removido"}
              />
            </div>
            <div>
              <strong>{p?.name || "Produto removido ou arquivado"}</strong>
              <p>Código: {p?.sku || "Indisponível"}</p>
              <p>
                {p?.price === undefined
                  ? "Preço sob consulta"
                  : currency(p.price)}
              </p>
              {p?.availability === "indisponivel" && <p>Indisponível</p>}
              <label>
                Quantidade
                <input
                  disabled={busy}
                  aria-label={"Quantidade de " + p?.name}
                  type="number"
                  min="1"
                  max="99"
                  value={l.quantity}
                  onChange={(e) =>
                    c.updateQuantity(l.key, Number(e.target.value))
                  }
                />
              </label>
              <button disabled={busy} onClick={() => c.remove(l.key)}>
                Remover
              </button>
            </div>
          </article>
        );
      })}
      <p>
        {complete
          ? "Subtotal informativo: " + currency(total)
          : "Há valores sob consulta. O orçamento final será confirmado pela empresa."}
      </p>
      {invalid && (
        <p role="alert">
          Atualize sua seleção removendo os produtos indisponíveis antes de
          continuar.
        </p>
      )}
      <Link href="/catalogo" onClick={() => c.setCartOpen(false)}>
        Continuar navegando
      </Link>
      {!form ? (
        <button
          className="shop-primary"
          disabled={invalid}
          onClick={() => setForm(true)}
        >
          Solicitar orçamento pelo WhatsApp
        </button>
      ) : (
        <form className="c-lead-form" onSubmit={submit}>
          <h2>Quase lá!</h2>
          <p>
            Identifique-se para registrar seu interesse e conversar com a Elite
            Parts.
          </p>
          <label>
            Nome completo
            <input
              autoFocus
              required
              name="name"
              autoComplete="name"
              minLength={3}
              maxLength={180}
              disabled={busy}
            />
          </label>
          <label>
            WhatsApp/telefone
            <input
              required
              name="phone"
              type="tel"
              autoComplete="tel"
              maxLength={30}
              placeholder="+55 (84) 99999-9999"
              disabled={busy}
            />
          </label>
          <p>
            Registraremos seu nome, contato e produtos selecionados para
            preparar seu orçamento e realizar o atendimento relacionado à
            solicitação.
          </p>
          <label className="c-checkbox">
            <input type="checkbox" required name="privacy" disabled={busy} />
            Li o{" "}
            <a href="/privacidade" target="_blank" rel="noopener noreferrer">
              aviso de privacidade
            </a>{" "}
            e estou ciente do registro para atendimento.
          </label>
          {error && <p role="alert">{error}</p>}
          <button className="shop-primary" disabled={busy || invalid}>
            {busy
              ? "Registrando solicitação…"
              : "Registrar e continuar no WhatsApp"}
          </button>
        </form>
      )}
    </section>
  );
}
export function InterestPage() {
  return (
    <main className="shop-page">
      <CommerceHeader standalone />
      <div className="c-interest-page">
        <h1>Lista de interesses</h1>
        <InterestPanel />
      </div>
      <StoreFooter />
    </main>
  );
}
export function PrivacyPage() {
  return (
    <main className="shop-page">
      <CommerceHeader standalone />
      <article className="c-interest-page">
        <h1>Aviso de privacidade</h1>
        <p>Versão 2026-10-25.</p>
        <p>
          A Elite Parts registra seu nome, telefone e os produtos escolhidos
          para preparar sua solicitação de orçamento e dar continuidade ao
          atendimento. A solicitação fica registrada mesmo se você não enviar a
          mensagem no WhatsApp.
        </p>
        <p>
          O acesso aos contatos é restrito à equipe administrativa autorizada.
          Utilizamos Supabase para armazenamento e Vercel para hospedagem. Ao
          continuar no WhatsApp, você acessa um serviço com políticas próprias.
        </p>
        <p>
          Esta solicitação não autoriza campanhas promocionais. Para consultar,
          corrigir ou solicitar exclusão de seus dados, entre em contato com a
          loja no atendimento comercial ou presencialmente na Rua Sílvio
          Pedrosa, 16, Nova Betânia, Mossoró/RN.
        </p>
        <p>
          O prazo de retenção e os procedimentos internos de atendimento aos
          direitos dos titulares dependem de definição pela empresa.
        </p>
        <Link href="/catalogo">Voltar ao catálogo</Link>
      </article>
      <StoreFooter />
    </main>
  );
}
