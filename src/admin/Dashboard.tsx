import { dashboard } from "../services/products";
import { Link } from "../lib/router";
import { useLoad, Loading, LoadError } from "./shared";
import { CrmDashboard } from "./Leads";
import { Symbol } from "../components/ui/Symbol";
type Stats = Awaited<ReturnType<typeof dashboard>>;
export function DashboardMetrics({ data }: { data: Stats }) {
  return <div className="a-stats">
    <div className="a-stat-featured"><div className="a-stat-top"><span>Seu catálogo</span><Symbol name="box" /></div><strong>{data.total}</strong><span>Total de produtos cadastrados</span><Link className="a-stat-footer" href="/admin/produtos">Gerenciar catálogo ↗</Link></div>
    {([[data.active,"Publicados","check"],[data.unavailable,"Indisponíveis","clock"],[data.without_images,"Sem fotografias","image"],[data.categories,"Categorias","layers"]] as const).map(([value,label,icon])=><div key={label}><div className="a-stat-top"><span>{label}</span><Symbol name={icon}/></div><strong>{value}</strong></div>)}
  </div>;
}
export function Dashboard() {
  const { data,error,loading,reload }=useLoad(dashboard);
  if(loading) return <Loading/>;
  if(error) return <LoadError error={error} retry={reload}/>;
  return <>
    <div className="a-title"><div><p className="a-kicker">VISÃO GERAL / ELITE PARTS</p><h1>Seu negócio, em perspectiva.</h1><p>Uma visão do catálogo e das conversas que começam por aqui.</p></div><Link className="a-primary" href="/admin/produtos/novo"><Symbol name="plus"/> Cadastrar produto</Link></div>
    <DashboardMetrics data={data!}/>
    <CrmDashboard/>
    <section className="a-panel"><div className="a-section-heading"><h2>Seu próximo passo</h2><span className="a-badge">Gestão do catálogo</span></div><div className="a-quick">
      <Link href="/admin/produtos/novo"><span>Cadastrar um produto</span><Symbol name="plus"/></Link>
      <Link href="/admin/produtos"><span>Revisar produtos e fotografias</span><Symbol name="arrow"/></Link>
      <Link href="/admin/categorias"><span>Organizar categorias</span><Symbol name="layers"/></Link>
    </div></section>
  </>;
}
