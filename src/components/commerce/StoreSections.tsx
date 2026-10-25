import { useEffect, useState } from "react";
import { BrandLogo } from "../BrandLogo";
import { services } from "../../data/services";
import { Link } from "../../lib/router";
import { useCommerce } from "../../hooks/useCommerce";
import { Arrow } from "../Navigation";
export function EditorialBanner() {
  return (
    <section className="editorial-banner shop-editorial">
      <div>
        <span className="eyebrow">A EXPERIÊNCIA ELITE</span>
        <h2>
          Tecnologia que transforma
          <br />
          <em>cada trajeto.</em>
        </h2>
      </div>
      <Link href="/#servicos" className="light-link">
        CONHEÇA NOSSOS SERVIÇOS <Arrow diagonal />
      </Link>
    </section>
  );
}
export function ServicesShowcase() {
  const { setQuote } = useCommerce();
  return (
    <section
      className="services-section shop-services"
      id="servicos"
      aria-labelledby="services-title"
    >
      <div className="services-header">
        <span className="eyebrow">ALÉM DOS ACESSÓRIOS</span>
        <h2 id="services-title">
          Tudo para o seu carro.
          <br />
          <em>Em um só lugar.</em>
        </h2>
        <p>
          Quer transformar seu carro com segurança, tecnologia e estilo?
          Converse com a Elite Parts sobre o seu projeto.
        </p>
      </div>
      <div className="service-list">
        {services.map(([name, slug]) =>
          slug ? (
            <Link
              className="service-row"
              key={name}
              href={`/produto/${slug}`}
              aria-label={`Conhecer ${name}`}
            >
              <h3>{name}</h3>
              <span>
                CONHECER <Arrow diagonal />
              </span>
            </Link>
          ) : (
            <button
              className="service-row"
              key={name}
              onClick={() => setQuote(name)}
              aria-label={`Consultar ${name}`}
            >
              <h3>{name}</h3>
              <span>
                CONSULTAR <Arrow diagonal />
              </span>
            </button>
          ),
        )}
      </div>
    </section>
  );
}
export function LocationSection() {
  return (
    <section
      className="visit-section"
      id="visite"
      aria-labelledby="visit-title"
    >
      <div>
        <span className="eyebrow">NOS ENCONTRE</span>
        <h2 id="visit-title">
          Seu próximo projeto
          <br />
          <em>começa aqui.</em>
        </h2>
        <p>
          Rua Sílvio Pedrosa, 16
          <br />
          Nova Betânia — Mossoró, RN
        </p>
        <a
          href="https://www.google.com/maps/search/?api=1&query=Rua%20S%C3%ADlvio%20Pedrosa%2016%20Nova%20Bet%C3%A2nia%20Mossor%C3%B3"
          target="_blank"
          rel="noopener noreferrer"
          className="visit-btn"
        >
          VER LOCALIZAÇÃO <Arrow diagonal />
        </a>
      </div>
      <div className="visit-image">
        <img
          src="/images/elite-parts/fachada.webp"
          width="1672"
          height="941"
          loading="lazy"
          alt="Fachada da Elite Parts em Mossoró"
        />
      </div>
    </section>
  );
}
export function StoreFooter() {
  const [description, setDescription] = useState(
    "Acessórios e serviços automotivos.",
  );
  useEffect(() => {
    let alive = true;
    import("../../services/settings")
      .then((module) => module.getPublicSettings())
      .then((rows) => {
        const value = rows.find((r) => r.key === "footer_description")?.value;
        if (alive && typeof value === "string") setDescription(value);
      })
      .catch((error) =>
        console.error("Configuração do rodapé indisponível", error),
      );
    return () => {
      alive = false;
    };
  }, []);
  return (
    <footer className="store-footer shop-footer">
      <div className="shop-footer-columns">
        <div>
          <Link href="/" aria-label="Elite Parts — início">
            <BrandLogo />
          </Link>
          <p>{description}</p>
        </div>
        <nav aria-label="Rodapé">
          <strong>EXPLORE A ELITE</strong>
          <Link href="/catalogo">Catálogo</Link>
          <Link href="/#servicos">Serviços</Link>
          <Link href="/#visite">Contato</Link>
          <Link href="/#inicio">Início ↑</Link>
          <Link href="/creditos">Créditos das imagens</Link>
        </nav>
        <div>
          <strong>NOS ENCONTRE</strong>
          <p>
            Rua Sílvio Pedrosa, 16
            <br />
            Nova Betânia · Mossoró, RN
          </p>
          <Link href="/#visite">Ver localização ↗</Link>
        </div>
      </div>
      <div className="shop-footer-bottom">
        <span>© {new Date().getFullYear()} Elite Parts.</span>
        <span>Experiência demonstrativa.</span>
      </div>
    </footer>
  );
}
