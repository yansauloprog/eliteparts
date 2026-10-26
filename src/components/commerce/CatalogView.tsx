import { useEffect, useState } from "react";
import { catalog, publicCategories } from "../../services/catalog";
import { useLoad, Loading, LoadError } from "../../admin/shared";
import { navigate, useRoute, routeURL } from "../../lib/router";
import { useCommerce } from "../../hooks/useCommerce";
import { ProductCard } from "./ProductCard";
import { CommerceHeader } from "./CommerceHeader";
import { Modal } from "./Modal";
export function CatalogView({ home = false }: { home?: boolean }) {
  const route = useRoute(),
    params = routeURL(route).searchParams,
    c = useCommerce();
  const [mobile, setMobile] = useState(false),
    [query, setQuery] = useState(params.get("busca") || "");
  const set = (key: string, value: string) => {
    const p = new URLSearchParams(params);
    value ? p.set(key, value) : p.delete(key);
    if (key !== "pagina") p.delete("pagina");
    navigate(
      `${home ? "/" : "/catalogo"}?${p}${home ? "#produtos" : ""}`,
      true,
    );
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== (params.get("busca") || "")) set("busca", query);
    }, 350);
    return () => clearTimeout(timer);
  }, [query, route]);
  useEffect(() => setQuery(params.get("busca") || ""), [route]);
  const page = /^[1-9][0-9]{0,4}$/.test(params.get("pagina") || "")
    ? Number(params.get("pagina"))
    : 1;
  const result = useLoad(
    () =>
      catalog({
        query: params.get("busca") || "",
        category: params.get("categoria") || "",
        brand: params.get("marca") || "",
        availability: params.get("disponibilidade") || "",
        min: params.get("min") || "",
        max: params.get("max") || "",
        sort: params.get("ordem") || "",
        page,
        ...(params.has("favoritos") ? { ids: c.favorites } : {}),
      }),
    [route, c.favorites.join(",")],
  );
  const cats = useLoad(publicCategories);
  const controls = (
    <>
      <h3>Categorias</h3>
      <select
        aria-label="Categoria"
        value={params.get("categoria") || ""}
        onChange={(e) => set("categoria", e.target.value)}
      >
        <option value="">Todas as categorias</option>
        {cats.data?.map((x) => (
          <option key={x.id} value={x.id}>
            {x.parent_id ? "↳ " : ""}
            {x.name}
          </option>
        ))}
      </select>
      <label>
        Marca
        <input
          value={params.get("marca") || ""}
          onChange={(e) => set("marca", e.target.value)}
        />
      </label>
      <label>
        Disponibilidade
        <select
          value={params.get("disponibilidade") || ""}
          onChange={(e) => set("disponibilidade", e.target.value)}
        >
          <option value="">Todas</option>
          <option value="disponivel">Disponível</option>
          <option value="sob_consulta">Sob consulta</option>
          <option value="indisponivel">Indisponível</option>
        </select>
      </label>
      {["min", "max"].map((k) => (
        <label key={k}>
          {k === "min" ? "Preço mínimo" : "Preço máximo"}
          <input
            type="number"
            min="0"
            step="0.01"
            value={params.get(k) || ""}
            onChange={(e) => set(k, e.target.value)}
          />
        </label>
      ))}
      <button onClick={() => navigate(home ? "/#produtos" : "/catalogo", true)}>
        Limpar filtros
      </button>
      {cats.error && (
        <p role="alert">Não foi possível carregar as categorias.</p>
      )}
    </>
  );
  return (
    <section
      className="commerce"
      id={home ? "produtos" : undefined}
      aria-label="Catálogo"
    >
      <CommerceHeader
        standalone={!home}
        query={query}
        onQuery={setQuery}
        onFilters={() => setMobile(true)}
      />
      <div className="shop-catalog-layout">
        <aside className="shop-sidebar c-filters">{controls}</aside>
        <div className="shop-results">
          <div className="shop-results-heading">
            <div>
              <p className="shop-category-label">PRODUTOS & SOLUÇÕES</p>
              {home ? (
                <h2>
                  Seu próximo <em>upgrade.</em>
                </h2>
              ) : (
                <h1>Catálogo Elite Parts</h1>
              )}
            </div>
            <label>
              Ordenar
              <select
                value={params.get("ordem") || ""}
                onChange={(e) => set("ordem", e.target.value)}
              >
                {[
                  ["", "Mais recentes"],
                  ["nome", "Nome A–Z"],
                  ["nome-desc", "Nome Z–A"],
                  ["preco", "Menor preço"],
                  ["preco-desc", "Maior preço"],
                ].map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            className="shop-mobile-filter"
            onClick={() => setMobile(true)}
          >
            Filtros
          </button>
          {result.loading ? (
            <Loading />
          ) : result.error ? (
            <LoadError error={result.error} retry={result.reload} />
          ) : (
            <>
              <p>{result.data?.total} produtos</p>
              <div className="shop-product-grid">
                {result.data?.rows.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {!result.data?.total && (
                <div className="shop-empty">
                  <h3>
                    {params.size
                      ? "Nenhum resultado encontrado."
                      : "Nosso catálogo está sendo preparado."}
                  </h3>
                  <p>
                    Em breve, novidades por aqui. Você também pode visitar a
                    loja.
                  </p>
                </div>
              )}
              <nav className="c-pagination" aria-label="Paginação">
                <button
                  disabled={page === 1}
                  onClick={() => set("pagina", String(page - 1))}
                >
                  Anterior
                </button>
                <span>Página {page}</span>
                <button
                  disabled={page * 24 >= (result.data?.total || 0)}
                  onClick={() => set("pagina", String(page + 1))}
                >
                  Próxima
                </button>
              </nav>
            </>
          )}
        </div>
      </div>
      {mobile && (
        <Modal title="Filtrar catálogo" onClose={() => setMobile(false)}>
          <div className="c-filters">{controls}</div>
        </Modal>
      )}
    </section>
  );
}
