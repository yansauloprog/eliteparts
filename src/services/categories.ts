import { db, check } from "../lib/supabase";
import type { Database } from "../types/database";
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export async function categories() {
  const { data, error } = await db()
    .from("categories")
    .select("*")
    .order("position")
    .order("name");
  check(error);
  return data!;
}
export async function saveCategory(
  value: Database["public"]["Tables"]["categories"]["Insert"],
) {
  const result = value.id
    ? await db()
        .from("categories")
        .update(value)
        .eq("id", value.id)
        .select()
        .single()
    : await db().from("categories").insert(value).select().single();
  check(result.error);
  return result.data!;
}
export async function categoryUsage(id: string) {
  const { count, error } = await db()
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);
  check(error);
  return count ?? 0;
}
export async function deleteCategory(id: string) {
  const { error } = await db()
    .from("categories")
    .delete()
    .eq("id", id)
    .select()
    .single();
  check(error);
}
