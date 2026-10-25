import { useEffect, useState } from "react";
import { BrandLogo } from "../BrandLogo";
import { useCommerce } from "../../hooks/useCommerce";
import { Link, navigate } from "../../lib/router";
import { Icon } from "./Icon";
export function CommerceHeader({
  query,
  onQuery,
  onFilters,
  standalone = false,
}: {
  query?: string;
  onQuery?: (q: string) => void;
  onFilters?: () => void;
  standalone?: boolean;
}) {
  const c = useCommerce();
  const [input, setInput] = useState("");
  const [compact, setCompact] = useState(() => scrollY > 60);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const scroll = () => setCompact(window.scrollY > 60);
    window.addEventListener("scroll", scroll, { passive: true });
    return () => window.removeEventListener("scroll", scroll);
  }, []);
  useEffect(() => {
    if (!menu) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        document.querySelector<HTMLButtonElement>(".shop-menu-toggle")?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [menu]);
  return (
    <header
      className={`shop-header ${standalone ? "shop-standalone-header" : ""} ${compact ? "is-compact" : ""}`}
    >
      <Link href="/" className="shop-brand" aria-label="Elite Parts — início">
        <BrandLogo />
      </Link>
      <form
        className="shop-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (!onQuery)
            navigate(`/catalogo?busca=${encodeURIComponent(input)}`);
        }}
      >
        <label
          className="sr-only"
          htmlFor={standalone ? "standalone-search" : "home-search"}
        >
          Buscar produtos
        </label>
        <Icon name="search" />
        <input
          id={standalone ? "standalone-search" : "home-search"}
          type="search"
          placeholder="O que seu carro precisa?"
          value={query ?? input}
          onChange={(e) =>
            onQuery ? onQuery(e.target.value) : setInput(e.target.value)
          }
        />
        <button aria-label="Buscar no catálogo" type="submit">
          <Icon name="arrow" />
        </button>
      </form>
      <nav className="shop-header-actions" aria-label="Navegação comercial">
        <Link href="/#servicos" className="shop-services-link">
          Serviços
        </Link>
        <Link
          href="/catalogo?favoritos=1"
          aria-label={`Favoritos: ${c.favorites.length}`}
        >
          <Icon name="heart" />
          {c.favorites.length > 0 ? (
            <span className="shop-count">{c.favorites.length}</span>
          ) : null}
        </Link>
        <button
          onClick={() => c.setCartOpen(true)}
          aria-label={`Carrinho: ${c.count} ${c.count === 1 ? "item" : "itens"}`}
        >
          <Icon name="bag" />
          {c.count > 0 ? (
            <span key={c.count} className="shop-count">
              {c.count}
            </span>
          ) : null}
        </button>
        <button
          className="shop-menu-toggle"
          aria-label="Navegação da loja"
          aria-expanded={menu}
          aria-controls="store-menu"
          onClick={() => setMenu(!menu)}
        >
          <span aria-hidden="true">{menu ? "✕" : "☰"}</span>
        </button>
      </nav>
      <nav
        id="store-menu"
        className="shop-store-menu"
        hidden={!menu}
        aria-label="Atalhos da loja"
      >
        <Link href="/catalogo" onClick={() => setMenu(false)}>
          Catálogo
        </Link>
        <Link href="/#servicos" onClick={() => setMenu(false)}>
          Serviços
        </Link>
        <Link href="/#visite" onClick={() => setMenu(false)}>
          Contato
        </Link>
        {onFilters ? (
          <button
            onClick={() => {
              setMenu(false);
              onFilters();
            }}
          >
            Filtrar catálogo
          </button>
        ) : null}
      </nav>
    </header>
  );
}
