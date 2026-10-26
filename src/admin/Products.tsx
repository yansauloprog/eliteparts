import { useEffect, useState } from "react";
import { Link, navigate, useRoute, routeURL } from "../lib/router";
import {
  listProducts,
  changeProduct,
  getProduct,
  type ProductFilters,
  type ProductRow,
} from "../services/products";
import { categories } from "../services/categories";
import { imageURL } from "../services/productImages";
import { message } from "../lib/supabase";
import { Field, Notice, useLoad, Loading, LoadError } from "./shared";
export const availabilityNames: Record<string, string> = {
  disponivel: "Disponível",
  sob_consulta: "Sob consulta",
  indisponivel: "Indisponível",
};
export function Products() {
  const route = useRoute();
  const category = routeURL(route).searchParams.get("categoria") || "";
  const [filters, setFilters] = useState<ProductFilters>({
      query: "",
      category,
      availability: "",
      publication: "",
      images: "",
      archived: "",
      sort: "recent",
      page: 1,
      size: 25,
    }),
    [search, setSearch] = useState(""),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setFilters((f) => ({ ...f, category, page: 1 }));
  }, [category]);
  useEffect(() => {
    const timer = setTimeout(
      () => setFilters((f) => ({ ...f, query: search, page: 1 })),
      300,
    );
    return () => clearTimeout(timer);
  }, [search]);
  const result = useLoad(
      () => listProducts(filters),
      [JSON.stringify(filters)],
    ),
    cats = useLoad(categories);
  function filter(key: keyof ProductFilters, value: string | number) {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  }
  async function action(p: ProductRow, kind: string) {
    setError("");
    setSuccess("");
    if (kind === "duplicate") {
      navigate(`/admin/produtos/novo?duplicar=${p.id}`);
      return;
    }
    setBusy(true);
    try {
      await changeProduct(
        p.id,
        kind === "archive"
          ? { archived_at: p.archived_at ? null : new Date().toISOString() }
          : { is_active: !p.is_active },
      );
      setSuccess("Produto atualizado.");
      result.reload();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  const total = result.data?.total ?? 0,
    pages = Math.max(1, Math.ceil(total / filters.size));
  return (
    <>
      <div className="a-title">
        <div>
          <p className="a-kicker">CATÁLOGO</p>
          <h1>Produtos</h1>
          <p>
            {result.loading ? "Consultando…" : `${total} produtos encontrados`}
          </p>
        </div>
        <Link className="a-primary" href="/admin/produtos/novo">
          + Cadastrar produto
        </Link>
      </div>
      <Notice error={error || cats.error} success={success} />
      <section className="a-panel a-filters">
        <Field label="Buscar por código, nome ou marca">
          <input
            type="search"
            placeholder="Código exato ou palavras do nome/marca"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Field>
        <div className="a-filter-grid">
          <Field label="Categoria">
            <select
              value={filters.category}
              onChange={(e) => filter("category", e.target.value)}
            >
              <option value="">Todas</option>
              {cats.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Disponibilidade">
            <select
              value={filters.availability}
              onChange={(e) => filter("availability", e.target.value)}
            >
              <option value="">Todas</option>
              {Object.entries(availabilityNames).map(([v, n]) => (
                <option key={v} value={v}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Publicação">
            <select
              value={filters.publication}
              onChange={(e) => filter("publication", e.target.value)}
            >
              <option value="">Todas</option>
              <option value="published">Publicado</option>
              <option value="draft">Rascunho</option>
            </select>
          </Field>
          <Field label="Fotografias">
            <select
              value={filters.images}
              onChange={(e) => filter("images", e.target.value)}
            >
              <option value="">Todas</option>
              <option value="yes">Com fotografias</option>
              <option value="no">Sem fotografias</option>
            </select>
          </Field>
          <Field label="Arquivo">
            <select
              value={filters.archived}
              onChange={(e) => filter("archived", e.target.value)}
            >
              <option value="">Todos</option>
              <option value="no">Não arquivados</option>
              <option value="yes">Arquivados</option>
            </select>
          </Field>
          <Field label="Ordenar">
            <select
              value={filters.sort}
              onChange={(e) => filter("sort", e.target.value)}
            >
              {[
                ["recent", "Mais recentes"],
                ["name", "Nome A–Z"],
                ["name_desc", "Nome Z–A"],
                ["sku", "Código"],
                ["price", "Menor preço"],
                ["price_desc", "Maior preço"],
              ].map(([v, n]) => (
                <option key={v} value={v}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>
      {result.loading ? (
        <Loading />
      ) : result.error ? (
        <LoadError error={result.error} retry={result.reload} />
      ) : (
        <section className="a-panel a-table-panel">
          <div
            className="a-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Lista de produtos; role horizontalmente para ver todas as colunas"
          >
            <table>
              <thead>
                <tr>
                  {[
                    "Imagem",
                    "Código/SKU",
                    "Nome",
                    "Categoria",
                    "Preço",
                    "Disponibilidade",
                    "Publicação",
                    "Atualizado",
                    "Ações",
                  ].map((t) => (
                    <th key={t}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.data?.rows.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Imagem">
                      {p.thumbnail ? (
                        <img
                          className="a-thumb"
                          src={imageURL(p.thumbnail)}
                          alt=""
                        />
                      ) : (
                        <span className="a-no-image">—</span>
                      )}
                    </td>
                    <td data-label="Código">
                      <code>{p.sku}</code>
                    </td>
                    <td data-label="Produto">
                      <Link href={`/admin/produtos/${p.id}`}>{p.name}</Link>
                      {p.brand && <small>{p.brand}</small>}
                      {p.archived_at && (
                        <span className="a-badge">Arquivado</span>
                      )}
                    </td>
                    <td data-label="Categoria">{p.category_name || "Sem categoria"}</td>
                    <td data-label="Preço">
                      {p.price === null
                        ? "Sob consulta"
                        : new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(Number(p.price))}
                    </td>
                    <td data-label="Disponibilidade">{availabilityNames[p.availability]}</td>
                    <td data-label="Publicação">
                      <span
                        className={`a-badge ${p.is_active ? "a-live" : ""}`}
                      >
                        {p.is_active ? "Publicado" : "Rascunho"}
                      </span>
                    </td>
                    <td data-label="Atualizado">
                      {new Date(p.updated_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td data-label="Ações">
                      <div className="a-row-actions">
                        <Link href={`/admin/produtos/${p.id}`}>Editar</Link>
                        <details className="a-more-actions"><summary>Mais</summary><div>
                        <button
                          disabled={busy}
                          onClick={() => void action(p, "duplicate")}
                        >
                          Duplicar
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => void action(p, "archive")}
                        >
                          {p.archived_at ? "Desarquivar" : "Arquivar"}
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => void action(p, "publish")}
                        >
                          {p.is_active ? "Despublicar" : "Publicar"}
                        </button>
                        </div></details>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!total && (
            <div className="a-empty">
              <h2>Nenhum produto encontrado.</h2>
              <p>Revise os filtros ou cadastre o primeiro produto.</p>
            </div>
          )}
          <div className="a-pagination">
            <Field label="Por página">
              <select
                value={filters.size}
                onChange={(e) => filter("size", Number(e.target.value))}
              >
                {[25, 50, 100].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </Field>
            <span>
              Página {filters.page} de {pages}
            </span>
            <button
              disabled={filters.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
            >
              Anterior
            </button>
            <button
              disabled={filters.page >= pages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
            >
              Próxima
            </button>
          </div>
        </section>
      )}
    </>
  );
}
