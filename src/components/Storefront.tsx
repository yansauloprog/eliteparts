import { CatalogView } from "./commerce/CatalogView";
import { ProductCarousel } from "./commerce/ProductCarousel";
import {
  EditorialBanner,
  ServicesShowcase,
  LocationSection,
  StoreFooter,
} from "./commerce/StoreSections";
import { catalog, publicCategories } from "../services/catalog";
import { useLoad } from "../admin/shared";
function Selection({
  title,
  query,
  subtitle,
}: {
  title: string;
  query: string;
  subtitle: string;
}) {
  const r = useLoad(async () => {
    const cats = await publicCategories();
    const category = cats.find((c) =>
      c.name.toLocaleLowerCase("pt-BR").includes(query),
    );
    return category ? (await catalog({ category: category.id })).rows : [];
  }, [query]);
  return (
    <ProductCarousel
      title={title}
      subtitle={subtitle}
      products={r.data || []}
    />
  );
}
export function Storefront() {
  return (
    <>
      <CatalogView home />
      <Selection
        title="Iluminação & LED"
        query="led"
        subtitle="OUTRA FORMA DE VER O CAMINHO"
      />
      <EditorialBanner />
      <Selection
        title="Tecnologia a bordo"
        query="multimídia"
        subtitle="CONECTIVIDADE & MANOBRAS"
      />
      <Selection
        title="Experiência sonora"
        query="som"
        subtitle="O SEU SOM, EM CADA DETALHE"
      />
      <ServicesShowcase />
      <LocationSection />
      <StoreFooter />
    </>
  );
}
