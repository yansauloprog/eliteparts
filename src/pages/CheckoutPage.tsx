import { BrandLogo } from "../components/BrandLogo";
import { useEffect, useRef, useState } from "react";
import { useCommerce } from "../hooks/useCommerce";
import { Link, navigate } from "../lib/router";
import { currency } from "../lib/catalog";
import {
  addressErrors,
  buyerErrors,
  checkoutSteps,
  stepLabels,
  deliveryOptions,
  maskCEP,
  maskCPF,
  maskPhone,
  paymentLabel,
  states,
  totals,
  type Address,
  type Buyer,
  type Payment,
} from "../lib/checkout";
import { CheckoutSummary } from "../components/checkout/CheckoutSummary";
import { PaymentPreview } from "../components/checkout/PaymentPreview";
import { Icon } from "../components/commerce/Icon";
const exampleBuyer: Buyer = {
  name: "Cliente Demonstração",
  email: "cliente@example.com",
  phone: "(84) 99999-0000",
  cpf: "123.456.789-09",
};
const exampleAddress: Address = {
  cep: "59600-000",
  street: "Rua de Demonstração",
  number: "100",
  complement: "Exemplo visual",
  district: "Bairro Exemplo",
  city: "Mossoró",
  state: "RN",
};
function Field({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  maxLength = 100,
  optional = false,
  inputMode,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  maxLength?: number;
  optional?: boolean;
  inputMode?: "numeric" | "tel" | "email";
}) {
  return (
    <div className={`shop-field ${error ? "has-error" : ""}`}>
      <label htmlFor={`checkout-${name}`}>{label}</label>
      {optional ? <small>Opcional</small> : null}
      <input
        id={`checkout-${name}`}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode}
        maxLength={maxLength}
        required={!optional}
        autoComplete="off"
        aria-invalid={!!error}
        aria-describedby={error ? `error-${name}` : undefined}
      />
      {error ? (
        <span className="field-error" id={`error-${name}`}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
export function CheckoutPage({ segment }: { segment: string }) {
  const c = useCommerce();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const confirmed = useRef(false);
  const [leaving, setLeaving] = useState(false);
  const [direction, setDirection] = useState(1);
  const transitionTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(transitionTimer.current), []);
  function changeStep(target: string) {
    if (leaving) return;
    const next = checkoutSteps.indexOf(
      target.split("/")[2] as (typeof checkoutSteps)[number],
    );
    setDirection(next < step ? -1 : 1);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      navigate(target);
      return;
    }
    setLeaving(true);
    transitionTimer.current = window.setTimeout(() => {
      navigate(target);
      setLeaving(false);
    }, 120);
  }

  const requested = checkoutSteps.indexOf(
    segment as (typeof checkoutSteps)[number],
  );
  const step = requested < 0 ? 0 : requested;
  const b = c.checkout.buyer,
    a = c.checkout.address;
  const options = deliveryOptions(c.cart);
  const delivery = options.find((o) => o.id === c.checkout.delivery);
  const allowed = Object.keys(buyerErrors(b)).length
    ? 0
    : Object.keys(addressErrors(a)).length || !delivery
      ? 1
      : !c.checkout.payment
        ? 2
        : 3;
  const success = segment === "confirmacao";
  useEffect(() => {
    document.title = success
      ? "Pedido demonstrativo | Elite Parts"
      : `${stepLabels[step]} | Checkout Elite Parts`;
    setErrors({});
    const frame = requestAnimationFrame(() =>
      heading.current?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [step, success]);
  useEffect(() => {
    if (c.cart.length && !success && (requested < 0 || step > allowed))
      navigate(`/checkout/${checkoutSteps[Math.min(step, allowed)]}`, true);
  }, [requested, step, allowed, success, c.cart.length]);
  const fallbackDelivery = options[0].id;
  useEffect(() => {
    if (c.cart.length && !delivery)
      c.setCheckout((d) => ({ ...d, delivery: fallbackDelivery }));
  }, [delivery?.id, fallbackDelivery, c.cart.length, c.setCheckout]);
  useEffect(() => {
    if (success && !c.order && c.cart.length)
      navigate("/checkout/identificacao", true);
  }, [success, c.order, c.cart.length]);
  const buyer = (key: keyof Buyer, value: string) =>
    c.setCheckout((d) => ({
      ...d,
      buyer: {
        ...d.buyer,
        [key]:
          key === "cpf"
            ? maskCPF(value)
            : key === "phone"
              ? maskPhone(value)
              : value,
      },
    }));
  const address = (key: keyof Address, value: string) =>
    c.setCheckout((d) => ({
      ...d,
      address: { ...d.address, [key]: key === "cep" ? maskCEP(value) : value },
    }));
  function showErrors(next: Record<string, string>) {
    setErrors(next);
    const first = Object.keys(next)[0];
    requestAnimationFrame(() =>
      form.current
        ?.querySelector<
          HTMLInputElement | HTMLSelectElement
        >(`[name="${first}"]`)
        ?.focus(),
    );
  }
  function advance() {
    const next =
      step === 0
        ? buyerErrors(b)
        : step === 1
          ? {
              ...addressErrors(a),
              ...(!delivery
                ? { delivery: "Escolha uma modalidade de entrega." }
                : {}),
            }
          : step === 2
            ? !c.checkout.payment
              ? { payment: "Selecione uma forma de pagamento." }
              : {}
            : {};
    if (Object.keys(next).length) {
      showErrors(next);
      return;
    }
    if (step < 3) {
      changeStep(`/checkout/${checkoutSteps[step + 1]}`);
      return;
    }
    if (!c.cart.length || allowed !== 3 || confirmed.current) return;
    confirmed.current = true;
    c.setToast("");
    c.setOrder({
      number: `EP-DEMO-${Date.now().toString(36).slice(-6).toUpperCase()}`,
      draft: structuredClone(c.checkout),
      lines: structuredClone(c.cart),
      amounts: totals(c.cart, c.checkout.delivery),
      deliveryName: delivery!.name,
      deliveryDays: delivery!.days,
    });
    c.clearCart();
    navigate("/checkout/confirmacao");
  }
  const head = (
    <header className="checkout-header">
      <Link href="/" className="checkout-logo">
        <BrandLogo />
      </Link>
      <span className="checkout-demo-tag">CHECKOUT DEMONSTRATIVO</span>
      <Link href="/catalogo" className="checkout-back">
        Continuar comprando <Icon name="arrow" />
      </Link>
    </header>
  );
  if (success && c.order) {
    const order = c.order;
    return (
      <main className="checkout-page checkout-success">
        {head}
        <div className="checkout-success-layout">
          <section className="checkout-success-message">
            <BrandLogo className="checkout-confirmation-logo" />
            <div className="checkout-success-mark">
              <Icon name="check" />
            </div>
            <span className="checkout-eyebrow">
              EXPERIÊNCIA ELITE / SIMULAÇÃO
            </span>
            <h1 data-page-title tabIndex={-1} ref={heading}>
              Pedido
              <br />
              <em>confirmado.</em>
            </h1>
            <p className="checkout-success-notice">
              Simulação demonstrativa — nenhuma compra ou cobrança foi
              realizada.
            </p>
            <div className="checkout-order-number">
              Nº fictício <strong>{order.number}</strong>
            </div>
            <h2>O próximo trajeto começa aqui.</h2>
            <p>
              {order.draft.buyer.name.split(" ")[0]}, esta é uma prévia de como
              será acompanhar sua compra. Nenhum e-mail ou pedido real foi
              enviado.
            </p>
            <div className="checkout-success-delivery">
              <span>Entrega ilustrativa</span>
              <strong>{order.deliveryName}</strong>
              <p>{order.deliveryDays} · prazo simulado</p>
              <p>
                {order.draft.address.city} / {order.draft.address.state}
              </p>
            </div>
            <Link className="shop-primary" href="/">
              Voltar à loja <Icon name="arrow" />
            </Link>
          </section>
          <CheckoutSummary order={order} />
        </div>
      </main>
    );
  }
  if (!c.cart.length)
    return (
      <main className="checkout-page">
        {head}
        <section className="checkout-empty">
          <span className="checkout-eyebrow">SEU PRÓXIMO UPGRADE</span>
          <h1 data-page-title tabIndex={-1}>
            Seu carrinho
            <br />
            <em>está vazio.</em>
          </h1>
          <p>
            {success
              ? "A confirmação desta demonstração fica disponível apenas durante a sessão."
              : "Escolha um produto antes de iniciar o checkout demonstrativo."}
          </p>
          <Link href="/catalogo" className="shop-primary">
            Explorar catálogo <Icon name="arrow" />
          </Link>
        </section>
      </main>
    );
  return (
    <main className="checkout-page">
      {head}
      <section className="checkout-intro">
        <div>
          <span className="checkout-eyebrow">SEU PROJETO. SUA ESCOLHA.</span>
          <h1 data-page-title tabIndex={-1}>
            Na direção do
            <br />
            <em>seu próximo upgrade.</em>
          </h1>
        </div>
        <p>
          Explore a experiência de compra.
          <br />
          <strong>Simulação, do início ao fim.</strong>
        </p>
      </section>
      <nav className="checkout-progress" aria-label="Etapas do checkout">
        <ol>
          {stepLabels.map((label, i) => (
            <li
              key={label}
              className={
                i === step ? "is-current" : i < step ? "is-complete" : ""
              }
              aria-current={i === step ? "step" : undefined}
            >
              <button
                type="button"
                disabled={i > allowed}
                onClick={() => changeStep(`/checkout/${checkoutSteps[i]}`)}
              >
                <span>{i < step ? <Icon name="check" /> : `0${i + 1}`}</span>
                <strong>{label}</strong>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div className="checkout-layout">
        <form
          ref={form}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            advance();
          }}
          className="checkout-form"
        >
          <section
            key={step}
            className={`checkout-step ${leaving ? "is-leaving" : ""} ${direction < 0 ? "is-backward" : ""}`}
          >
            <div className="checkout-step-heading">
              <span>0{step + 1}</span>
              <div>
                <p>ETAPA {step + 1} DE 4</p>
                <h2 ref={heading} tabIndex={-1}>
                  {step === 0
                    ? "Prazer em conhecer você."
                    : step === 1
                      ? "Qual será o destino?"
                      : step === 2
                        ? "Sua forma de pagar."
                        : "Tudo pronto para seguir?"}
                </h2>
              </div>
            </div>
            <p className="checkout-context-note">
              {step === 0
                ? "Use dados fictícios. Nada é enviado ou salvo no armazenamento do navegador."
                : step === 1
                  ? "Endereço manual e opções de entrega fictícias. Não há consulta de frete."
                  : step === 2
                    ? "Escolha uma modalidade ilustrativa. Nenhuma transação será processada."
                    : "Revise sua simulação antes de confirmar. Você pode editar qualquer etapa."}
            </p>
            {Object.keys(errors).length ? (
              <p role="alert" className="checkout-error-summary">
                Confira os campos destacados para continuar.
              </p>
            ) : null}
            {step === 0 ? (
              <>
                <button
                  type="button"
                  className="checkout-example"
                  onClick={() => {
                    c.setCheckout((d) => ({
                      ...d,
                      buyer: { ...exampleBuyer },
                    }));
                    setErrors({});
                  }}
                >
                  Preencher exemplo fictício <Icon name="arrow" />
                </button>
                <div className="checkout-fields">
                  <div className="field-full">
                    <Field
                      label="Nome completo"
                      name="name"
                      value={b.name}
                      onChange={(v) => buyer("name", v)}
                      error={errors.name}
                    />
                  </div>
                  <div className="field-full">
                    <Field
                      label="E-mail"
                      name="email"
                      value={b.email}
                      onChange={(v) => buyer("email", v)}
                      type="email"
                      error={errors.email}
                    />
                  </div>
                  <Field
                    label="Telefone com DDD"
                    name="phone"
                    value={b.phone}
                    onChange={(v) => buyer("phone", v)}
                    inputMode="tel"
                    maxLength={15}
                    error={errors.phone}
                  />
                  <Field
                    label="CPF"
                    name="cpf"
                    value={b.cpf}
                    onChange={(v) => buyer("cpf", v)}
                    inputMode="numeric"
                    maxLength={14}
                    error={errors.cpf}
                  />
                </div>
              </>
            ) : null}
            {step === 1 ? (
              <>
                <button
                  type="button"
                  className="checkout-example"
                  onClick={() => {
                    c.setCheckout((d) => ({
                      ...d,
                      address: { ...exampleAddress },
                    }));
                    setErrors({});
                  }}
                >
                  Usar endereço fictício <Icon name="arrow" />
                </button>
                <div className="checkout-fields">
                  <Field
                    label="CEP"
                    name="cep"
                    value={a.cep}
                    onChange={(v) => address("cep", v)}
                    inputMode="numeric"
                    maxLength={9}
                    error={errors.cep}
                  />
                  <div />
                  <div className="field-full">
                    <Field
                      label="Rua"
                      name="street"
                      value={a.street}
                      onChange={(v) => address("street", v)}
                      error={errors.street}
                    />
                  </div>
                  <Field
                    label="Número"
                    name="number"
                    value={a.number}
                    onChange={(v) => address("number", v)}
                    maxLength={15}
                    error={errors.number}
                  />
                  <Field
                    label="Complemento"
                    name="complement"
                    value={a.complement}
                    onChange={(v) => address("complement", v)}
                    optional
                  />
                  <Field
                    label="Bairro"
                    name="district"
                    value={a.district}
                    onChange={(v) => address("district", v)}
                    error={errors.district}
                  />
                  <Field
                    label="Cidade"
                    name="city"
                    value={a.city}
                    onChange={(v) => address("city", v)}
                    error={errors.city}
                  />
                  <div className="shop-field">
                    <label htmlFor="checkout-state">Estado</label>
                    <select
                      id="checkout-state"
                      name="state"
                      required
                      value={a.state}
                      onChange={(e) => address("state", e.target.value)}
                      aria-invalid={!!errors.state}
                      aria-describedby={
                        errors.state ? "error-state" : undefined
                      }
                    >
                      <option value="">Selecione</option>
                      {states.map((uf) => (
                        <option key={uf}>{uf}</option>
                      ))}
                    </select>
                    {errors.state ? (
                      <span className="field-error" id="error-state">
                        {errors.state}
                      </span>
                    ) : null}
                  </div>
                </div>
                <fieldset className="checkout-delivery">
                  <legend>
                    Modalidade de entrega{" "}
                    <small>Valores e prazos demonstrativos</small>
                  </legend>
                  {options.map((o) => (
                    <label
                      key={o.id}
                      className={
                        c.checkout.delivery === o.id ? "is-selected" : ""
                      }
                    >
                      <input
                        type="radio"
                        name="delivery"
                        checked={c.checkout.delivery === o.id}
                        onChange={() =>
                          c.setCheckout((d) => ({ ...d, delivery: o.id }))
                        }
                      />
                      <span>
                        <strong>{o.name}</strong>
                        <small>{o.days}</small>
                      </span>
                      <b>
                        {currency(o.cents / 100)}
                        <small>Simulado</small>
                      </b>
                    </label>
                  ))}
                </fieldset>
              </>
            ) : null}
            {step === 2 ? (
              <>
                <fieldset className="checkout-payment-methods">
                  <legend className="sr-only">Forma de pagamento</legend>
                  {(
                    [
                      ["pix", "PIX", "Rápido e simples"],
                      ["cartao", "Cartão", "Controle ilustrativo"],
                      ["boleto", "Boleto", "Prévia visual"],
                    ] as const
                  ).map(([id, title, caption]) => (
                    <label
                      key={id}
                      className={c.checkout.payment === id ? "is-selected" : ""}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={id}
                        checked={c.checkout.payment === id}
                        onChange={() => {
                          c.setCheckout((d) => ({
                            ...d,
                            payment: id as Payment,
                          }));
                          setErrors({});
                        }}
                      />
                      <strong>{title}</strong>
                      <small>{caption}</small>
                    </label>
                  ))}
                </fieldset>
                {errors.payment ? (
                  <p className="field-error" role="alert">
                    {errors.payment}
                  </p>
                ) : null}
                <PaymentPreview />
              </>
            ) : null}
            {step === 3 ? (
              <div className="checkout-review">
                <section>
                  <div>
                    <h3>Identificação</h3>
                    <button
                      type="button"
                      onClick={() => changeStep("/checkout/identificacao")}
                    >
                      Editar identificação
                    </button>
                  </div>
                  <p>
                    {b.name}
                    <br />
                    {b.email}
                    <br />
                    {b.phone}
                    <br />
                    CPF: ***.***.***-{b.cpf.slice(-2)}
                  </p>
                </section>
                <section>
                  <div>
                    <h3>Endereço</h3>
                    <button
                      type="button"
                      onClick={() => changeStep("/checkout/entrega")}
                    >
                      Editar entrega
                    </button>
                  </div>
                  <p>
                    {a.street}, {a.number}
                    {a.complement ? ` · ${a.complement}` : ""}
                    <br />
                    {a.district} · {a.city} / {a.state}
                    <br />
                    CEP {a.cep}
                  </p>
                  <strong>
                    {delivery?.name} · {delivery?.days}
                  </strong>
                  <small>Prazo e valor de entrega ilustrativos.</small>
                </section>
                <section>
                  <div>
                    <h3>Pagamento</h3>
                    <button
                      type="button"
                      onClick={() => changeStep("/checkout/pagamento")}
                    >
                      Editar pagamento
                    </button>
                  </div>
                  <p>
                    {paymentLabel(c.checkout.payment, c.checkout.installments)}
                  </p>
                  <small>Nenhuma transação será realizada.</small>
                </section>
                <div className="checkout-review-total">
                  <span>Total demonstrativo</span>
                  <strong>
                    {currency(totals(c.cart, c.checkout.delivery).total / 100)}
                  </strong>
                </div>
              </div>
            ) : null}
            <div className="checkout-step-actions">
              {step > 0 ? (
                <button
                  type="button"
                  className="checkout-previous"
                  onClick={() =>
                    changeStep(`/checkout/${checkoutSteps[step - 1]}`)
                  }
                >
                  ← Voltar
                </button>
              ) : (
                <Link href="/catalogo" className="checkout-previous">
                  ← Loja
                </Link>
              )}
              <button className="shop-primary" type="submit" disabled={leaving}>
                {step === 3 ? "Confirmar pedido" : "Continuar"}
                <Icon name={step === 3 ? "check" : "arrow"} />
              </button>
            </div>
            <Link
              href={`/checkout/${checkoutSteps[step]}#resumo-checkout`}
              className="checkout-summary-shortcut"
            >
              Ver resumo do pedido ·{" "}
              {currency(totals(c.cart, c.checkout.delivery).total / 100)}
            </Link>
          </section>
        </form>
        <CheckoutSummary />
      </div>
      <footer className="checkout-footer">
        <BrandLogo />
        <span>
          Ambiente ilustrativo. Nenhuma compra, cobrança ou entrega real é
          gerada.
        </span>
      </footer>
    </main>
  );
}
