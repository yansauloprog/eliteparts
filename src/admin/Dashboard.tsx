import { dashboard } from "../services/products";
import { Link } from "../lib/router";
import { useLoad, Loading, LoadError } from "./shared";
export function Dashboard() {
  const { data, error, loading, reload } = useLoad(dashboard);
  if (loading) return <Loading />;
  if (error) return <LoadError error={error} retry={reload} />;
  return (
    <>
      <div className="a-title">
        <div>
          <p className="a-kicker">ELITE PARTS</p>
          <h1>Seu catálogo, sob controle.</h1>
          <p>Cadastre, organize e mantenha os produtos atualizados.</p>
        </div>
        <Link className="a-primary" href="/admin/produtos/novo">
          + Cadastrar produto
        </Link>
      </div>
      <div className="a-stats">
        {[
          [data?.total, "Total de produtos"],
          [data?.active, "Produtos ativos"],
          [data?.unavailable, "Indisponíveis"],
          [data?.without_images, "Sem fotografias"],
          [data?.categories, "Categorias"],
        ].map(([value, label]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      {data?.total === 0 && (
        <section className="a-panel a-empty">
          <h2>Seu primeiro produto começa aqui.</h2>
          <p>
            Use os códigos comerciais que a empresa já utiliza. Os novos
            produtos começam como rascunho.
          </p>
          <Link href="/admin/produtos/novo">Cadastrar primeiro produto →</Link>
        </section>
      )}
      <section className="a-panel">
        <h2>Operações rápidas</h2>
        <div className="a-quick">
          <Link href="/admin/produtos/novo">Cadastrar produto ↗</Link>
          <Link href="/admin/produtos">Ver produtos ↗</Link>
          <Link href="/admin/categorias">Gerenciar categorias ↗</Link>
        </div>
      </section>
    </>
  );
}
