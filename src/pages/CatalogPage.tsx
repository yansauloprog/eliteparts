import { CatalogView } from "../components/commerce/CatalogView";
import { StoreFooter } from "../components/commerce/StoreSections";
export function CatalogPage() {
  return (
    <main className="shop-page">
      <CatalogView />
      <StoreFooter />
    </main>
  );
}
