import { Link } from "../../lib/router";
import type { DemoProduct } from "../../data/demo-catalog";
import { categoryName } from "../../data/categories";
import { effectivePrice, currency } from "../../lib/pricing";
import { useCommerce } from "../../hooks/useCommerce";
import { FavoriteButton } from "./FavoriteButton";
import { ProductImage } from "./ProductImage";
import { Icon } from "./Icon";
import type { CatalogProduct } from "../../services/catalog";
export function ProductCard({ product: p }: { product: DemoProduct }) {
  const { setQuickView, add } = useCommerce();
  const price = effectivePrice(p);
  return (
    <article className="shop-product-card" data-product-id={p.id}>
      <div className="shop-card-media">
        <Link
          href={`/produto/${p.slug}`}
          aria-label={`Ver ${p.name}`}
          tabIndex={-1}
        >
          <ProductImage
            key={p.images[0]?.src}
            image={p.images[0]}
            name={p.name}
            thumbnailOnly
          />
          {p.images[1] ? (
            <ProductImage
              image={p.images[1]}
              key={p.images[1]?.src}
              thumbnailOnly
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
        <span className="shop-category-label">
          {(p as CatalogProduct).categoryLabel || categoryName(p.category)}
        </span>
        <Link href={`/produto/${p.slug}`}>
          <h3 title={p.name}>{p.name}</h3>
        </Link>
        <p className="shop-card-price">
          {price === null ? "Preço sob consulta" : currency(price)}
        </p>
        <div className="shop-card-bottom">
          <span>
            {(p as CatalogProduct).sku
              ? `Código: ${(p as CatalogProduct).sku} · ${(p as CatalogProduct).availability === "indisponivel" ? "Indisponível" : "Consulte a disponibilidade"}`
              : p.type === "servico"
                ? "Serviço de instalação"
                : p.installation
                  ? "Instalação sob consulta"
                  : "Opções sob consulta"}
          </span>
        </div>
        <button
          className="shop-card-cta"
          disabled={(p as CatalogProduct).availability === 'indisponivel'}
          onClick={() => add(p)}
          aria-label={`Adicionar à lista: ${p.name}`}
        >
          {(p as CatalogProduct).availability === 'indisponivel' ? 'Indisponível' : 'Adicionar à lista'} <Icon name="plus" />
        </button>
      </div>
    </article>
  );
}
