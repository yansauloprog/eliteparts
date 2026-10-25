import { useState } from "react";
import { filterCatalog } from "../lib/catalog";
import { routeURL, useRoute } from "../lib/router";
import { useCommerce } from "./useCommerce";
export function useCatalogFilters() {
  const params = routeURL(useRoute()).searchParams;
  const [query, setQuery] = useState(() => params.get("busca") ?? ""),
    [category, setCategory] = useState(() => params.get("categoria") ?? ""),
    [type, setType] = useState(""),
    [sort, setSort] = useState("curadoria");
  const favoriteOnly = params.get("favoritos") === "1";
  const { favorites } = useCommerce();
  const products = filterCatalog(
    query,
    category,
    type,
    sort,
    favoriteOnly ? favorites : undefined,
  );
  const reset = () => {
    setQuery("");
    setCategory("");
    setType("");
    setSort("curadoria");
  };
  return {
    query,
    setQuery,
    category,
    setCategory,
    type,
    setType,
    sort,
    setSort,
    products,
    favoriteOnly,
    reset,
  };
}
