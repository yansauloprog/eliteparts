import { db, check } from "../lib/supabase";
import type { Json, Database } from "../types/database";
import type { DemoProduct } from "../data/demo-catalog";
type Row = Database["public"]["Tables"]["products"]["Row"] & {
  category_name: string | null;
  images: Database["public"]["Tables"]["product_images"]["Row"][];
  attributes: { name: string; value: string; unit: string | null }[];
};
export type CatalogProduct = DemoProduct & {
  sku: string;
  brand: string | null;
  availability: string;
  categoryLabel: string;
};
export function mapProduct(p: Row): CatalogProduct {
  const image = (path: string) =>
    db().storage.from("elite-product-images").getPublicUrl(path).data.publicUrl;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category_id as DemoProduct["category"],
    categoryLabel: p.category_name || "Catálogo",
    sku: p.sku,
    brand: p.brand,
    availability: p.availability,
    description: p.description || "",
    details: p.description || "",
    price: p.price ?? undefined,
    images: p.images.map((i) => ({
      src: image(i.full_path),
      thumbnail: image(i.thumb_path),
      thumbnailWidth: 480,
      width: 1600,
      alt: p.name,
    })),
    specifications: [
      ...Object.entries(p.specifications || {}).map(([label, value]) => ({
        label,
        value: String(value),
      })),
      ...p.attributes.map((a) => ({
        label: a.name,
        value: a.value + (a.unit ? " " + a.unit : ""),
      })),
    ],
    options: [],
    installation: false,
    compatibility: {
      requiresConfirmation: true,
      notes: "Confirme a aplicação com a equipe.",
    },
    type: "produto",
    demonstration: false,
  };
}
export async function catalog(filters: Record<string, unknown> = {}) {
  const { data, error } = await db().rpc(
    "elite_catalog" as never,
    { filters: filters as Json } as never,
  );
  check(error);
  const result = data as unknown as { rows: Row[]; total: number };
  return { rows: result.rows.map(mapProduct), total: result.total };
}
export async function publicCategories() {
  const { data, error } = await db()
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("position")
    .order("name");
  check(error);
  return data!;
}
export async function selectedProducts(ids: string[]) {
  const rows: CatalogProduct[] = [];
  for (let i = 0; i < ids.length; i += 24)
    rows.push(...(await catalog({ ids: ids.slice(i, i + 24) })).rows);
  return rows;
}
