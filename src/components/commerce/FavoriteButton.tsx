import { useCommerce } from "../../hooks/useCommerce";
import type { DemoProduct } from "../../data/demo-catalog";
import { Icon } from "./Icon";
export function FavoriteButton({
  product,
  label = false,
}: {
  product: DemoProduct;
  label?: boolean;
}) {
  const { favorites, toggleFavorite } = useCommerce();
  const selected = favorites.includes(product.id);
  return (
    <button
      className={`shop-favorite ${selected ? "is-favorite" : ""} ${label ? "shop-label-action" : ""}`}
      aria-label={`${selected ? "Remover dos" : "Adicionar aos"} favoritos: ${product.name}`}
      aria-pressed={selected}
      onClick={() => toggleFavorite(product)}
    >
      <Icon name="heart" />
      {label ? <span>{selected ? "Salvo" : "Salvar"}</span> : null}
    </button>
  );
}
