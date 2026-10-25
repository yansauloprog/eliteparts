import { useState } from "react";
import { useCommerce } from "../../hooks/useCommerce";
import { demoCatalog } from "../../data/demo-catalog";
import { currency, effectivePrice } from "../../lib/catalog";
import { totals, paymentLabel, type DemoOrder } from "../../lib/checkout";
import { ProductImage } from "../commerce/ProductImage";
export function CheckoutSummary({ order }: { order?: DemoOrder }) {
  const c = useCommerce();
  const [open, setOpen] = useState(() => innerWidth > 900);
  const lines = order?.lines ?? c.cart;
  const draft = order?.draft ?? c.checkout;
  const amounts = order?.amounts ?? totals(lines, draft.delivery);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  return (
    <aside
      className="checkout-summary"
      id="resumo-checkout"
      aria-label="Resumo do pedido"
    >
      <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
        <summary>
          <span>
            Seu projeto{" "}
            <small>
              {itemCount} {itemCount === 1 ? "item" : "itens"} · resumo do pedido
            </small>
          </span>
          <strong>
            {currency(amounts.total / 100)}
            <small>{open ? "Recolher −" : "Ver resumo +"}</small>
          </strong>
        </summary>
        <div className="checkout-summary-content">
          <div className="checkout-summary-items">
            {lines.map((line) => {
              const p = demoCatalog.find((p) => p.id === line.productId)!;
              return (
                <article key={line.key} className="checkout-summary-item">
                  <div className="checkout-summary-photo">
                    <ProductImage image={p.images[0]} name={p.name} eager />
                  </div>
                  <div>
                    <h3>{p.name}</h3>
                    <p>
                      {p.type === "servico"
                        ? "Serviço demonstrativo"
                        : line.installation
                          ? "Instalação a confirmar"
                          : "Somente produto"}
                    </p>
                    <strong>
                      {currency((effectivePrice(p) ?? 0) * line.quantity)}
                    </strong>
                    {!order && p.type === "produto" ? (
                      <div className="checkout-quantity">
                        <span>Qtd.</span>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={line.quantity}
                          aria-label={`Quantidade de ${p.name}`}
                          onChange={(e) =>
                            c.updateQuantity(line.key, Number(e.target.value))
                          }
                        />
                        <button
                          type="button"
                          onClick={() => c.remove(line.key)}
                          aria-label={`Remover ${p.name}`}
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <p>Quantidade: {line.quantity}</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          <dl className="checkout-totals">
            <div>
              <dt>Subtotal</dt>
              <dd data-testid="subtotal">{currency(amounts.subtotal / 100)}</dd>
            </div>
            <div>
              <dt>Entrega simulada</dt>
              <dd data-testid="shipping">
                {amounts.shipping
                  ? currency(amounts.shipping / 100)
                  : "A combinar"}
              </dd>
            </div>
            <div className="checkout-total">
              <dt>Total demonstrativo</dt>
              <dd data-testid="total">{currency(amounts.total / 100)}</dd>
            </div>
          </dl>
          <p className="checkout-payment-summary">
            {paymentLabel(draft.payment, draft.installments)}
          </p>
          {lines.some(
            (l) =>
              l.installation &&
              demoCatalog.find((p) => p.id === l.productId)?.type === "produto",
          ) ? (
            <p className="checkout-small">
              Instalação não incluída nos valores simulados.
            </p>
          ) : null}
          <p className="checkout-small">
            Todos os valores são fictícios. Nenhum pedido real é enviado.
          </p>
        </div>
      </details>
    </aside>
  );
}
