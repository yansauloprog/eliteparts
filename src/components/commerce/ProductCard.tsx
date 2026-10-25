import { Link } from "../../lib/router";
import type { DemoProduct } from "../../data/demo-catalog";
import { categoryName } from "../../data/categories";
import { effectivePrice, currency } from "../../lib/catalog";
import { useCommerce } from "../../hooks/useCommerce";
import { FavoriteButton } from "./FavoriteButton";
import { ProductImage } from "./ProductImage";
import { Icon } from "./Icon";
export function ProductCard({ product: p }: { product: DemoProduct }) {
  const { setQuickView } = useCommerce();
  const price = effectivePrice(p);
  return (
    <article className="shop-product-card" data-product-id={p.id}>
      <div className="shop-card-media">
        <Link
          href={`/produto/${p.slug}`}
          aria-label={`Ver ${p.name}`}
          tabIndex={-1}
        >
          <ProductImage image={p.images[0]} name={p.name} />
          {p.images[1] ? (
            <ProductImage
              image={p.images[1]}
              name={p.name}
              className="shop-second-photo"
            />
          ) : null}
        </Link>
        <FavoriteButton product={p} />
        <button
          className="shop-quick-button"
          onClick={() => setQuickView(p)}
          aria-label={`Visualização rápida: ${p.name}`}
        >
          <Icon name="eye" />
          <span>Ver de perto</span>
        </button>
      </div>
      <div className="shop-card-body">
        <span className="shop-category-label">{categoryName(p.category)}</span>
        <Link href={`/produto/${p.slug}`}>
          <h3>{p.name}</h3>
        </Link>
        <p className="shop-card-price">
          {price === null ? "Consultar valor" : currency(price)}
        </p>
        <div className="shop-card-bottom">
          <span>
            {p.type === "servico"
              ? "Serviço de instalação"
              : p.installation
                ? "Instalação sob consulta"
                : "Opções sob consulta"}
          </span>
        </div>
        <Link
          href={`/produto/${p.slug}`}
          className="shop-card-cta"
          aria-label={`Ver produto: ${p.name}`}
        >
          Ver produto <Icon name="arrow" />
        </Link>
      </div>
    </article>
  );
}
