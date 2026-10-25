import { useState } from "react";
import { categories } from "../../data/categories";
import { useCatalogFilters } from "../../hooks/useCatalogFilters";
import { Link } from "../../lib/router";
import { ProductCard } from "./ProductCard";
import { CommerceHeader } from "./CommerceHeader";
import { Modal } from "./Modal";
import { Icon } from "./Icon";
import { CatalogNotice } from "./CatalogNotice";
export function CatalogView({ home = false }: { home?: boolean }) {
  const f = useCatalogFilters();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const controls = (
    <>
      <p className="shop-small-heading">CATEGORIAS</p>
      <div className="shop-category-list">
        {[{ id: "", name: "Todas as categorias" }, ...categories].map((c) => (
          <button
            key={c.id}
            aria-pressed={f.category === c.id}
            onClick={() => f.setCategory(c.id)}
          >
            {c.name}
            <span aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
      <fieldset className="shop-type-filter">
        <legend>O que procura?</legend>
        {[
          ["", "Produtos e serviços"],
          ["produto", "Produtos"],
          ["servico", "Serviços de instalação"],
        ].map(([value, label]) => (
          <label key={value}>
            <input
              type="radio"
              name={filtersOpen ? "drawer-type" : "catalog-type"}
              checked={f.type === value}
              onChange={() => f.setType(value)}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <button className="shop-text-link" onClick={f.reset}>
        Limpar filtros
      </button>
    </>
  );
  return (
    <section
      className="commerce"
      id={home ? "produtos" : undefined}
      aria-label="Catálogo de produtos demonstrativos"
    >
      <CommerceHeader
        query={f.query}
        onQuery={f.setQuery}
        onFilters={() => setFiltersOpen(true)}
        standalone={!home}
      />
      <CatalogNotice />
      <nav className="shop-category-strip" aria-label="Atalhos de categorias">
        {categories.map((c) => (
          <button
            key={c.id}
            aria-pressed={f.category === c.id}
            onClick={() => f.setCategory(c.id)}
          >
            {c.short}
          </button>
        ))}
      </nav>
      <div className="shop-catalog-layout">
        <aside className="shop-sidebar" aria-label="Filtros do catálogo">
          {controls}
          <div className="shop-sidebar-note">
            <p>
              Seu projeto.
              <br />
              <em>Do seu jeito.</em>
            </p>
            <Link href="/#visite">
              Visite a Elite Parts <Icon name="arrow" />
            </Link>
          </div>
        </aside>
        <div className="shop-results">
          <button
            className="shop-mobile-filter"
            aria-label="Filtros"
            onClick={() => setFiltersOpen(true)}
          >
            <Icon name="filter" /> FILTRAR
          </button>
          <div className="shop-results-heading">
            <div>
              <p className="shop-category-label">
                {f.favoriteOnly ? "SUA SELEÇÃO" : "PRODUTOS & SOLUÇÕES"}
              </p>
              {home ? (
                <h2>
                  Seu próximo <em>upgrade.</em>
                </h2>
              ) : (
                <h1 data-page-title tabIndex={-1}>
                  {f.favoriteOnly ? (
                    "Seus favoritos."
                  ) : (
                    <>
                      Encontre seu <em>próximo upgrade.</em>
                    </>
                  )}
                </h1>
              )}
            </div>
            <label className="shop-sort">
              Ordenar por
              <select
                value={f.sort}
                onChange={(e) => f.setSort(e.target.value)}
              >
                <option value="curadoria">Seleção do catálogo</option>
                <option value="nome">Nome: A–Z</option>
                <option value="nome-desc">Nome: Z–A</option>
              </select>
            </label>
          </div>
          <p className="shop-result-count" role="status">
            {f.products.length}{" "}
            {f.products.length === 1 ? "resultado" : "resultados"}
            {f.query ? ` para “${f.query}”` : ""}
          </p>
          {f.products.length ? (
            <div className="shop-product-grid">
              {f.products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="shop-empty">
              <Icon name={f.favoriteOnly ? "heart" : "search"} />
              <h3>
                {f.favoriteOnly
                  ? "Sua seleção começa por um favorito."
                  : "Vamos encontrar outro caminho."}
              </h3>
              <p>
                {f.favoriteOnly
                  ? "Toque no coração dos itens que deseja guardar."
                  : "Tente um termo mais curto ou escolha outra categoria."}
              </p>
              {f.favoriteOnly ? (
                <Link href="/catalogo" className="shop-primary">
                  Explorar catálogo
                </Link>
              ) : (
                <button className="shop-primary" onClick={f.reset}>
                  Limpar busca e filtros
                </button>
              )}
            </div>
          )}
          {home ? (
            <div className="shop-catalog-bottom">
              <Link href="/catalogo" className="shop-text-link">
                Abrir catálogo completo <Icon name="arrow" />
              </Link>
            </div>
          ) : null}
        </div>
      </div>
      {filtersOpen ? (
        <Modal
          title="Filtrar catálogo"
          onClose={() => setFiltersOpen(false)}
          drawer
        >
          <div className="shop-filter-controls">
            {controls}
            <button
              className="shop-primary"
              onClick={() => setFiltersOpen(false)}
            >
              Ver {f.products.length} resultados
            </button>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
