import { Link } from "../lib/router";
import credits from "../data/photo-credits.json";
export function CreditsPage() {
  return (
    <main className="shop-page shop-credits">
      <Link href="/">← Elite Parts</Link>
      <h1 data-page-title tabIndex={-1}>
        Créditos das imagens
      </h1>
      <p>
        Fotografias utilizadas para ilustrar tipos de produtos. Não representam
        estoque ou modelos confirmados da Elite Parts. Fotos contextuais não
        representam trabalhos realizados pela loja.
      </p>
      <p>
        As fotografias da fachada e do carro foram fornecidas para este projeto.
      </p>
      {credits.map((c) => (
        <article key={c.filename}>
          <img
            src={`/images/${c.directory}/${c.thumbnail}`}
            alt={c.alt}
            width="140"
            height="100"
            loading="lazy"
          />
          <h2>{c.alt}</h2>
          <p>
            Autor: {c.author}.{" "}
            <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer">
              {c.license}
            </a>{" "}
            ·{" "}
            <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer">
              Fotografia original
            </a>
          </p>
          <p>
            {c.changes} As fotografias e suas adaptações mantêm a licença
            indicada, incluindo a condição de compartilhamento pela mesma
            licença quando aplicável.
          </p>
        </article>
      ))}
    </main>
  );
}
