import { Navigation, Arrow } from "./Navigation";
import { Storefront } from "./Storefront";
import { Link } from "../lib/router";
export function Hero() {
 return <>
 <a className="skip-link" href="#apresentacao">Ir para o conteúdo</a>
 <main>
  <section id="inicio" className="spatial-hero" aria-labelledby="hero-title">
   <Navigation/>
   <div className="spatial-hero-grid" id="apresentacao" tabIndex={-1}>
    <div className="spatial-hero-copy">
     <p className="spatial-eyebrow"><span/> ACESSÓRIOS & TECNOLOGIA AUTOMOTIVA</p>
     <h1 id="hero-title">EQUIPADO<br/>PARA O <em>EXTRAORDINÁRIO.</em></h1>
     <p className="spatial-description">Tecnologia, personalização e acessórios para elevar cada detalhe da sua experiência.</p>
     <div className="spatial-hero-actions"><a className="spatial-cta" href="#produtos">Explorar catálogo <Arrow/></a><a className="spatial-text-link" href="#servicos">Conhecer serviços <Arrow diagonal/></a></div>
     <div className="spatial-hero-location"><span>MOSSORÓ, RN</span><span>A SUA PRÓXIMA ESCOLHA COMEÇA AQUI.</span></div>
    </div>
    <div className="spatial-stage" aria-label="Composição editorial de acessórios automotivos">
     <span className="spatial-stage-type" aria-hidden="true">ELITE</span>
     <div className="spatial-product-stage">
      <div className="spatial-stage-head"><span>01 / ILUMINAÇÃO</span><span className="spatial-stage-dot" aria-hidden="true"/></div>
      <img src="/images/catalog/led-h4.webp" alt="Lâmpada LED automotiva; fotografia ilustrativa de acessório." width="1000" height="667" fetchPriority="high" decoding="async"/>
      <div className="spatial-stage-caption"><div><span>UMA NOVA PERSPECTIVA</span><strong>Veja além.</strong></div><a href="/catalogo?busca=LED" aria-label="Explorar iluminação LED"><Arrow diagonal/></a></div>
     </div>
     <div className="spatial-mini-card"><span className="spatial-mini-symbol" aria-hidden="true">↗</span><div><small>TECNOLOGIA A BORDO</small><strong>Cada detalhe importa.</strong></div><Link href="/catalogo?busca=multimídia" aria-label="Explorar multimídia"><Arrow/></Link></div>
     <span className="spatial-image-disclaimer">Imagem ilustrativa · Consulte os produtos disponíveis no catálogo.</span>
    </div>
   </div>
   <div className="spatial-hero-foot"><span>PRECISION IN MOTION.</span><nav aria-label="Explorar categorias"><Link href="/catalogo?busca=LED">Iluminação</Link><Link href="/catalogo?busca=som">Áudio</Link><Link href="/catalogo?busca=multimídia">Multimídia</Link><Link href="/catalogo?busca=segurança">Segurança</Link></nav><a href="#produtos" aria-label="Rolar até o catálogo">Explore ↓</a></div>
  </section>
  <Storefront/>
 </main>
 </>;
}
