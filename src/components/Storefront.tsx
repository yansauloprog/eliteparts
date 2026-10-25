import { demoCatalog } from "../data/demo-catalog";
import { CatalogView } from "./commerce/CatalogView";
import { ProductCarousel } from "./commerce/ProductCarousel";
import {
  EditorialBanner,
  ServicesShowcase,
  LocationSection,
  StoreFooter,
} from "./commerce/StoreSections";
export function Storefront() {
  return (
    <>
      <CatalogView home />
      <ProductCarousel
        title="Iluminação & LED"
        subtitle="OUTRA FORMA DE VER O CAMINHO"
        products={demoCatalog.filter((p) => p.category === "led")}
        category="led"
      />
      <EditorialBanner />
      <ProductCarousel
        title="Tecnologia a bordo"
        subtitle="CONECTIVIDADE & MANOBRAS"
        products={demoCatalog.filter((p) =>
          ["multimidia", "cameras"].includes(p.category),
        )}
        category="multimidia"
      />
      <ProductCarousel
        title="Experiência sonora"
        subtitle="O SEU SOM, EM CADA DETALHE"
        products={demoCatalog.filter((p) => p.category === "audio")}
        category="audio"
      />
      <ServicesShowcase />
      <LocationSection />
      <StoreFooter />
    </>
  );
}
