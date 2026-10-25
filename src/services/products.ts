import { db, check } from "../lib/supabase";
import type { Database, Json } from "../types/database";
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Attribute = {
  name: string;
  value: string;
  unit: string | null;
  position: number;
};
export type ProductRow = Product & {
  category_name: string | null;
  thumbnail: string | null;
};
export type ProductFilters = {
  query: string;
  category: string;
  availability: string;
  publication: string;
  images: string;
  archived: string;
  sort: string;
  page: number;
  size: number;
};
export async function listProducts(filters: ProductFilters) {
  const { data, error } = await db().rpc("elite_admin_products", {
    filters: filters as unknown as Json,
  });
  check(error);
  return data as unknown as { rows: ProductRow[]; total: number };
}
export async function getProduct(id: string) {
  const [p, a] = await Promise.all([
    db().from("products").select("*").eq("id", id).single(),
    db()
      .from("product_attributes")
      .select("*")
      .eq("product_id", id)
      .order("position"),
  ]);
  check(p.error);
  check(a.error);
  return { product: p.data!, attributes: a.data! };
}
export async function saveProduct(
  product: Record<string, unknown>,
  attributes: Attribute[],
) {
  const { data, error } = await db().rpc("elite_save_product", {
    payload: product as Json,
    attributes: attributes as unknown as Json,
  });
  if (error?.code === "23505")
    throw new Error(
      `Código/SKU “${product.sku}” ou slug já cadastrado. Nenhum produto foi sobrescrito.`,
    );
  check(error);
  return data as unknown as Product;
}
export async function changeProduct(id: string, values: Partial<Product>) {
  const { data, error } = await db()
    .from("products")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  check(error);
  return data!;
}
export async function deleteProduct(id: string) {
  // Photos must be explicitly removed first; never leave unmanaged public files after deletion.
  const { count, error: imagesError } = await db()
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);
  check(imagesError);
  if (count)
    throw new Error(
      "Remova as fotografias antes de excluir permanentemente. Você também pode arquivar o produto.",
    );
  const { error } = await db()
    .from("products")
    .delete()
    .eq("id", id)
    .select()
    .single();
  check(error);
}
export async function dashboard() {
  const { data, error } = await db().rpc("elite_admin_dashboard");
  check(error);
  return data as unknown as {
    total: number;
    active: number;
    unavailable: number;
    without_images: number;
    categories: number;
  };
}
// Public query deliberately propagates API/RLS errors; it never falls back to demonstration products.
export async function publicProducts(page = 1) {
  const { data, error, count } = await db()
    .from("products")
    .select("*,product_images(*),product_attributes(*)", { count: "exact" })
    .eq("is_active", true)
    .is("archived_at", null)
    .order("position")
    .order("id")
    .range((page - 1) * 25, page * 25 - 1);
  check(error);
  return { rows: data!, total: count ?? 0 };
}
