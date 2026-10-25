import { demoCatalog } from "../../data/demo-catalog";
import { useCommerce } from "../../hooks/useCommerce";
import { effectivePrice, currency } from "../../lib/catalog";
import { totals } from "../../lib/checkout";
import { Link } from "../../lib/router";
import { Modal } from "./Modal";
import { ProductImage } from "./ProductImage";
import { ProductOptions } from "./ProductOptions";
import { Icon } from "./Icon";
import { categoryName } from "../../data/categories";
export function CommerceOverlays() {
  const c = useCommerce();
  const subtotal = totals(c.cart, c.checkout.delivery).subtotal;
  return (
    <>
      {c.quickView ? (
        <Modal
          title="Visualização rápida"
          onClose={() => c.setQuickView(null)}
          wide
        >
          <div className="shop-quick-content">
            <div className="shop-quick-photo">
              <ProductImage
                image={c.quickView.images[0]}
                name={c.quickView.name}
                eager
              />
            </div>
            <div>
              <p className="shop-category-label">
                {categoryName(c.quickView.category)}
              </p>
              <h3>{c.quickView.name}</h3>
              <p>{c.quickView.description}</p>
              <strong className="shop-detail-price">
                {effectivePrice(c.quickView) === null
                  ? "Consultar valor"
                  : currency(effectivePrice(c.quickView)!)}
                <small className="demo-price-label">Valor demonstrativo</small>
              </strong>
              <ProductOptions
                key={c.quickView.id}
                product={c.quickView}
                compact
              />
              <Link
                className="shop-text-link"
                href={`/produto/${c.quickView.slug}`}
                onClick={() => c.setQuickView(null)}
              >
                Ver página completa <Icon name="arrow" />
              </Link>
            </div>
          </div>
        </Modal>
      ) : null}
      {c.cartOpen ? (
        <Modal title="Seu carrinho" onClose={() => c.setCartOpen(false)} drawer>
          <p className="shop-demo-copy">
            Preços fictícios. Explore o checkout sem realizar uma compra.
          </p>
          {c.cart.length ? (
            <>
              <div className="shop-cart-lines">
                {c.cart.map((line) => {
                  const p = demoCatalog.find((p) => p.id === line.productId)!;
                  return (
                    <div key={line.key} className="shop-cart-line">
                      <Link
                        href={`/produto/${p.slug}`}
                        onClick={() => {
                          c.setCartOpen(false);
                          c.setQuickView(null);
                        }}
                      >
                        <ProductImage image={p.images[0]} name={p.name} />
                      </Link>
                      <div>
                        <Link
                          href={`/produto/${p.slug}`}
                          onClick={() => {
                            c.setCartOpen(false);
                            c.setQuickView(null);
                          }}
                        >
                          <h3>{p.name}</h3>
                        </Link>
                        <p>
                          {p.type === "servico"
                            ? "Serviço demonstrativo"
                            : line.installation
                              ? "Instalação a confirmar"
                              : "Somente produto"}
                        </p>
                        <p>{line.option}</p>
                        {Object.values(line.vehicle).some(Boolean) ? (
                          <p>
                            {Object.values(line.vehicle)
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        ) : null}
                        <strong>
                          {currency((effectivePrice(p) ?? 0) * line.quantity)}
                        </strong>
                        <div className="shop-cart-edit">
                          {p.type === "produto" ? (
                            <label>
                              Qtd.{" "}
                              <input
                                type="number"
                                min="1"
                                max="99"
                                aria-label={`Quantidade de ${p.name}`}
                                value={line.quantity}
                                onChange={(e) =>
                                  c.updateQuantity(
                                    line.key,
                                    Number(e.target.value),
                                  )
                                }
                              />
                            </label>
                          ) : (
                            <span>1 serviço</span>
                          )}
                          <button
                            onClick={() => c.remove(line.key)}
                            aria-label={`Remover ${p.name}`}
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="shop-cart-summary">
                <span>Subtotal demonstrativo</span>
                <strong>{currency(subtotal / 100)}</strong>
              </div>
              <p className="shop-subtle">
                Frete fictício na próxima etapa. Instalações dependem de
                confirmação.
              </p>
              <Link
                className="shop-primary"
                href="/checkout/identificacao"
                onClick={() => {
                  c.setCartOpen(false);
                  c.setQuickView(null);
                }}
              >
                Finalizar compra <Icon name="arrow" />
              </Link>
              <button
                className="shop-secondary"
                onClick={() => {
                  c.setCartOpen(false);
                  c.setQuickView(null);
                }}
              >
                Continuar comprando
              </button>
            </>
          ) : (
            <div className="shop-empty">
              <Icon name="bag" />
              <h3>Seu próximo projeto começa no catálogo.</h3>
              <p>Encontre os acessórios para a sua próxima atualização.</p>
              <Link
                href="/catalogo"
                className="shop-primary"
                onClick={() => {
                  c.setCartOpen(false);
                  c.setQuickView(null);
                }}
              >
                Explorar catálogo
              </Link>
            </div>
          )}
        </Modal>
      ) : null}
      {c.quote !== null ? (
        <Modal title={c.quote} onClose={() => c.setQuote(null)}>
          <p className="shop-demo-copy">
            A aplicação deste serviço depende da avaliação da equipe Elite
            Parts. Esta prévia não agenda serviços nem confirma valores.
          </p>
          <Link
            href="/catalogo"
            className="shop-primary"
            onClick={() => c.setQuote(null)}
          >
            Explorar acessórios <Icon name="arrow" />
          </Link>
          <a
            href="https://www.google.com/maps/search/?api=1&query=Rua%20S%C3%ADlvio%20Pedrosa%2016%20Nova%20Bet%C3%A2nia%20Mossor%C3%B3"
            target="_blank"
            rel="noopener noreferrer"
            className="shop-secondary"
          >
            Ver localização da loja <Icon name="arrow" />
          </a>
        </Modal>
      ) : null}
      <div
        className={`shop-toast ${c.toast ? "is-visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {c.toast}
      </div>
    </>
  );
}
