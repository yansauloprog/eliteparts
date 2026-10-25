import { BrandLogo } from "./BrandLogo";
import { useEffect, useRef, useState } from "react";

export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const links = [
  { href: "#inicio", label: "Início" },
  { href: "#produtos", label: "Produtos" },
  { href: "#visite", label: "Contato" },
];

export function Navigation() {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    const closeOutside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !menu.current?.contains(event.target) &&
        !menuButton.current?.contains(event.target)
      )
        setOpen(false);
    };
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", closeOutside);
    };
  }, [open]);

  return (
    <header className="navigation">
      <a className="brand" href="#inicio" aria-label="Elite Parts — início">
        <BrandLogo />
      </a>
      <nav className="desktop-links" aria-label="Navegação principal">
        {links.map((link) => (
          <a href={link.href} key={link.href}>
            {link.label}
          </a>
        ))}
        <a
          href="#produtos"
          className="nav-arrow"
          aria-label="Explorar produtos"
        >
          <Arrow />
        </a>
      </nav>
      <button
        ref={menuButton}
        className="menu-button"
        type="button"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(!open)}
      >
        <span className={open ? "menu-icon is-open" : "menu-icon"}>
          <i />
          <i />
        </span>
      </button>
      <nav
        ref={menu}
        id="mobile-menu"
        className="mobile-links"
        hidden={!open}
        aria-label="Navegação mobile"
      >
        {links.map((link) => (
          <a href={link.href} key={link.href} onClick={() => setOpen(false)}>
            {link.label}
            <Arrow diagonal />
          </a>
        ))}
      </nav>
    </header>
  );
}
