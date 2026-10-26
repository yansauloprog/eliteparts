import { lazy, Suspense, useEffect } from "react";
const AdminApp = lazy(() => import("./admin/AdminApp"));
import { Hero } from "./components/Hero";
import { CatalogPage } from "./pages/CatalogPage";
import { ProductPage } from "./pages/ProductPage";
import { CommerceProvider } from "./hooks/useCommerce";
import { CommerceOverlays } from "./components/commerce/CommerceOverlays";
import {
  useRoute,
  RouteScroll,
  Link,
  routeURL,
  decodeSlug,
} from "./lib/router";
import { useReveal } from "./hooks/useReveal";
import { InterestPage, PrivacyPage } from "./pages/InterestPage";
const CreditsPage = lazy(() =>
  import("./pages/CreditsPage").then((m) => ({ default: m.CreditsPage })),
);
export function App() {
  const route = useRoute();
  useReveal(route);
  const path = routeURL(route).pathname;
  useEffect(() => {
    if (!path.startsWith("/produto/") && !path.startsWith("/checkout"))
      document.title =
        path === "/catalogo"
          ? "Catálogo | Elite Parts"
          : "Elite Parts | Acessórios Automotivos";
  }, [path]);
  if (path.startsWith("/admin"))
    return (
      <Suspense fallback={<p role="status">Carregando administração…</p>}>
        <AdminApp />
      </Suspense>
    );
  return (
    <CommerceProvider>
      <RouteScroll route={route} />
      {path === "/" ? (
        <Hero />
      ) : path === "/catalogo" ? (
        <CatalogPage />
      ) : path.startsWith("/produto/") ? (
        <ProductPage key={path} slug={decodeSlug(path.slice(9))} />
      ) : path === "/checkout" || path.startsWith("/checkout/") ? (
        <InterestPage />
      ) : path === "/privacidade" ? (
        <PrivacyPage />
      ) : path === "/creditos" ? (
        <Suspense fallback={<p role="status">Carregando créditos…</p>}>
          <CreditsPage />
        </Suspense>
      ) : (
        <main className="shop-page shop-error">
          <h1 data-page-title tabIndex={-1}>
            Página não encontrada.
          </h1>
          <Link href="/catalogo" className="shop-primary">
            Explorar catálogo
          </Link>
        </main>
      )}
      <CommerceOverlays />
    </CommerceProvider>
  );
}
