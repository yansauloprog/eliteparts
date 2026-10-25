import { useEffect, useState } from "react";
import { findProduct, demoCatalog } from "../data/demo-catalog";
import { categoryName } from "../data/categories";
import { currency, effectivePrice } from "../lib/catalog";
import { Link } from "../lib/router";
import { useCommerce } from "../hooks/useCommerce";
import { CommerceHeader } from "../components/commerce/CommerceHeader";
import { ProductGallery } from "../components/commerce/ProductGallery";
import { ProductOptions } from "../components/commerce/ProductOptions";
import { FavoriteButton } from "../components/commerce/FavoriteButton";
import { ProductCarousel } from "../components/commerce/ProductCarousel";
import { StoreFooter } from "../components/commerce/StoreSections";
import { Icon } from "../components/commerce/Icon";
import { CatalogNotice } from "../components/commerce/CatalogNotice";
export function ProductPage({ slug }: { slug: string }) {
  const p = findProduct(slug);
  const { setToast } = useCommerce();
  const [shared, setShared] = useState(false);
  useEffect(() => {
    document.title = p
      ? `${p.name} | Elite Parts`
      : "Item não encontrado | Elite Parts";
  }, [p]);
  if (!p)
    return (
      <main className="shop-page shop-error">
        <h1 data-page-title tabIndex={-1}>
          Não encontramos esse item.
        </h1>
        <p>O endereço pode ter mudado. Explore a seleção demonstrativa.</p>
        <Link className="shop-primary" href="/catalogo">
          Voltar ao catálogo
        </Link>
      </main>
    );
  const price = effectivePrice(p);
  async function share() {
    try {
      if (typeof navigator.share === "function")
        await navigator.share({ title: p!.name, url: location.href });
      else await navigator.clipboard.writeText(location.href);
      setShared(true);
      setToast(
        typeof navigator.share === "function"
          ? "Compartilhamento concluído"
          : "Link copiado",
      );
    } catch {
      setShared(true);
    }
  }
  return (
    <main className="shop-page shop-product-page">
      <div className="shop-page-surface">
        <CommerceHeader standalone />
        <CatalogNotice />
        <nav className="shop-breadcrumb" aria-label="Caminho">
          <Link href="/">Início</Link>
          <span>/</span>
          <Link href="/catalogo">Catálogo</Link>
          <span>/</span>
          <Link href={`/catalogo?categoria=${p.category}`}>
            {categoryName(p.category)}
          </Link>
        </nav>
        <div className="shop-product-detail">
          <ProductGallery key={p.id} product={p} />
          <section className="shop-product-info">
            <p className="shop-category-label">{categoryName(p.category)}</p>
            <h1 data-page-title tabIndex={-1}>
              {p.name}
            </h1>
            <p className="shop-product-description">{p.description}</p>
            <strong className="shop-detail-price">
              {price === null ? "Consultar valor" : currency(price)}
              <small className="demo-price-label">Valor demonstrativo</small>
            </strong>
            {p.type === "servico" ? (
              <p className="shop-subtle">Serviço sob avaliação da equipe.</p>
            ) : null}
            <div id="opcoes-produto">
              <ProductOptions key={p.id} product={p} />
            </div>
            <div className="shop-detail-actions">
              <FavoriteButton product={p} label />
              <button className="shop-label-action" onClick={share}>
                <Icon name="share" />
                Compartilhar
              </button>
            </div>
            {shared ? (
              <label className="shop-field shop-share-field">
                Link deste item
                <input
                  readOnly
                  value={location.href}
                  onFocus={(e) => e.currentTarget.select()}
                />
              </label>
            ) : null}
          </section>
        </div>
        <section
          className="shop-product-information"
          aria-label="Informações do item"
        >
          <details open>
            <summary>Sobre esta solução</summary>
            <p>{p.details}</p>
          </details>
          <details>
            <summary>Especificações técnicas</summary>
            <dl>
              {p.specifications.map((s) => (
                <div key={s.label}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          </details>
          <details>
            <summary>Compatibilidade</summary>
            <p>{p.compatibility.notes}</p>
          </details>
          <details>
            <summary>Instalação</summary>
            <p>
              {p.slug === "pelicula-residencial"
                ? "Aplicação residencial avaliada conforme o ambiente e o vidro. Confirme os requisitos e o valor com a loja."
                : p.installation
                  ? "Consulte a equipe sobre aplicação, materiais e valor da instalação para o seu veículo."
                  : "Requisitos de aplicação e conexões devem ser confirmados com a loja."}
            </p>
          </details>
        </section>
      </div>
      <ProductCarousel
        title="Continue explorando"
        subtitle="SOLUÇÕES RELACIONADAS"
        products={demoCatalog.filter(
          (item) => item.category === p.category && item.id !== p.id,
        )}
      />
      <StoreFooter />
      <div className="shop-mobile-action">
        <span>
          {price === null ? "Consultar valor" : currency(price)}
          <small>Valor demonstrativo</small>
        </span>
        <Link href={`/produto/${p.slug}#opcoes-produto`}>
          Ver opções <Icon name="arrow" />
        </Link>
      </div>
    </main>
  );
}
