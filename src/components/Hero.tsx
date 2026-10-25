import { Navigation, Arrow } from "./Navigation";
import { Storefront } from "./Storefront";

/**
 * Fase 1 — nova abertura editorial sem automóveis.
 * O lettering da marca é o arquivo oficial da Elite Parts; as demais
 * chamadas usam a família Barlow Condensed já incluída no projeto.
 * Toda a loja abaixo desta seção é reaproveitada sem alterações.
 */
export function Hero() {
  return (
    <>
      <a className="skip-link" href="#apresentacao">
        Ir para o conteúdo
      </a>
      <main>
        <section
          id="inicio"
          className="hero hero--catalog"
          aria-labelledby="hero-title"
        >
          <div className="hero-catalog-grain" aria-hidden="true" />
          <div className="hero-catalog-rail" aria-hidden="true" />
          <Navigation />

          <div className="hero-catalog-body" id="apresentacao" tabIndex={-1}>
            <div className="hero-catalog-copy">
              <p className="hero-catalog-eyebrow">
                <span className="hero-catalog-status" aria-hidden="true" />
                MOSSORÓ, RN <span aria-hidden="true">/</span> ACESSÓRIOS AUTOMOTIVOS
              </p>
              <img
                className="hero-catalog-wordmark"
                src="/images/brand/elite-parts-logo.png"
                alt=""
                aria-hidden="true"
                width="659"
                height="171"
                decoding="async"
                fetchPriority="high"
              />
              <h1 id="hero-title" className="hero-catalog-title">
                <span>O PRÓXIMO</span>
                <strong>NÍVEL.</strong>
              </h1>
              <p className="hero-catalog-description">
                Iluminação, som, multimídia e acessórios para transformar
                cada detalhe do seu veículo.
              </p>
              <div className="hero-catalog-actions">
                <a className="hero-catalog-primary" href="#produtos">
                  EXPLORAR CATÁLOGO <Arrow />
                </a>
                <a className="hero-catalog-secondary" href="#servicos">
                  CONHECER SERVIÇOS <Arrow diagonal />
                </a>
              </div>
              <div className="hero-catalog-caption" aria-hidden="true">
                <span>SELEÇÃO AUTOMOTIVA</span>
                <i />
                <span>TECNOLOGIA &amp; PERFORMANCE</span>
              </div>
            </div>

            <div className="hero-catalog-showcase" aria-label="Destaques ilustrativos de acessórios automotivos">
              <div className="hero-catalog-showcase-graphics" aria-hidden="true">
                <span className="hero-catalog-gridline hero-catalog-gridline--one" />
                <span className="hero-catalog-gridline hero-catalog-gridline--two" />
                <span className="hero-catalog-vertical-text">ELITE / EQUIPAMENTOS</span>
              </div>
              <div className="hero-catalog-showcase-label" aria-hidden="true">
                <span>01 / 02</span>
                <span>EM DESTAQUE</span>
              </div>
              <div className="hero-catalog-product hero-catalog-product--led">
                <img
                  src="/images/catalog/led-h4.webp"
                  alt="Kit de lâmpadas LED automotivas, fotografia ilustrativa de produto."
                  width="1000"
                  height="667"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
                <div className="hero-catalog-product-name" aria-hidden="true">
                  <span>01</span>
                  <strong>ILUMINAÇÃO</strong>
                </div>
              </div>
              <div className="hero-catalog-product hero-catalog-product--audio">
                <img
                  src="/images/catalog-refined/amplifier-clarion.webp"
                  alt="Módulo amplificador automotivo, fotografia ilustrativa de produto."
                  width="1000"
                  height="765"
                  loading="lazy"
                  decoding="async"
                />
                <div className="hero-catalog-product-name" aria-hidden="true">
                  <span>02</span>
                  <strong>ÁUDIO</strong>
                </div>
              </div>
              <span className="hero-catalog-artmark" aria-hidden="true">E</span>
              <div className="hero-catalog-showcase-foot" aria-hidden="true">
                <span>ESCOLHA O SEU PRÓXIMO UPGRADE</span>
                <span>↗</span>
              </div>
            </div>
          </div>

          <div className="hero-catalog-bottom" aria-hidden="true">
            <span>ELITE PARTS / ACESSÓRIOS &amp; SERVIÇOS AUTOMOTIVOS</span>
            <span>ILUMINAÇÃO <i /> MULTIMÍDIA <i /> SOM <i /> SEGURANÇA</span>
            <span>ROLE PARA EXPLORAR ↓</span>
          </div>
        </section>
        <Storefront />
      </main>
    </>
  );
}
