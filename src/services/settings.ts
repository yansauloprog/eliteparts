import { db, check } from "../lib/supabase";
export const publicFields = [
  {
    key: "footer_description",
    label: "Descrição no rodapé",
    fallback: "Acessórios e serviços automotivos.",
    max: 180,
  },
];
export async function getPublicSettings() {
  const { data, error } = await db()
    .from("site_settings")
    .select("*")
    .eq("is_public", true)
    .in(
      "key",
      publicFields.map((f) => f.key),
    );
  check(error);
  return data!;
}
export async function savePublicSetting(key: string, value: string) {
  const field = publicFields.find((f) => f.key === key);
  if (!field || !value.trim() || value.length > field.max)
    throw new Error("Configuração inválida.");
  const { error } = await db()
    .from("site_settings")
    .upsert({ key, value, is_public: true });
  check(error);
}
