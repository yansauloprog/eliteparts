import { catalog } from "../services/catalog";
import { useLoad, Loading, LoadError } from "../admin/shared";
import { Link } from "../lib/router";
import { useCommerce } from "../hooks/useCommerce";
import { CommerceHeader } from "../components/commerce/CommerceHeader";
import { ProductGallery } from "../components/commerce/ProductGallery";
import { StoreFooter } from "../components/commerce/StoreSections";
import { ProductCarousel } from "../components/commerce/ProductCarousel";
import { FavoriteButton } from "../components/commerce/FavoriteButton";
import { currency } from "../lib/pricing";
export function ProductPage({ slug }: { slug: string }) {
  const c = useCommerce(),
    r = useLoad(async () => {
      const p = (await catalog({ slug })).rows[0];
      return {
        p,
        related: p
          ? (await catalog({ category: p.category })).rows.filter(
              (x) => x.id !== p.id,
            )
          : [],
      };
    }, [slug]);
  if (r.loading) return <Loading />;
  if (r.error)
    return (
      <main className="shop-page">
        <LoadError error={r.error} retry={r.reload} />
      </main>
    );
  const p = r.data?.p;
  return (
    <main className="shop-page shop-product-page">
      <CommerceHeader standalone />
      {!p ? (
        <div className="shop-error">
          <h1>Produto não encontrado</h1>
          <Link href="/catalogo">Voltar ao catálogo</Link>
        </div>
      ) : (
        <>
          <nav className="shop-breadcrumb">
            <Link href="/catalogo">Catálogo</Link>
            {p.category && (
              <> / <Link href={`/catalogo?categoria=${p.category}`}>{p.categoryLabel}</Link></>
            )}
          </nav>
          <div className="shop-product-detail">
            <ProductGallery product={p} />
            <section className="shop-product-info">
              <p className="shop-category-label">
                {p.brand} · {p.categoryLabel}
              </p>
              <h1>{p.name}</h1>
              <p>Código: {p.sku}</p>
              <p className="shop-product-description">{p.description}</p>
              <strong className="shop-detail-price">
                {p.price === undefined
                  ? "Preço sob consulta"
                  : currency(p.price)}
              </strong>
              <p>
                {p.availability === "disponivel"
                  ? "Disponível"
                  : p.availability === "indisponivel"
                    ? "Indisponível"
                    : "Disponibilidade sob consulta"}
              </p>
              <button
                className="shop-primary"
                disabled={p.availability === "indisponivel"}
                onClick={() => {
                  c.add(p);
                  c.setCartOpen(true);
                }}
              >
                Adicionar à lista de interesses
              </button>
              <FavoriteButton product={p} label />
            </section>
          </div>
          <section className="shop-product-information">
            <h2>Especificações técnicas</h2>
            <dl>
              {p.specifications.map((s, i) => (
                <div key={i}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <ProductCarousel
            title="Continue explorando"
            subtitle="PRODUTOS RELACIONADOS"
            products={r.data!.related}
          />
        </>
      )}
      <StoreFooter />
    </main>
  );
}
