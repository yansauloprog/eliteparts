import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase =
  url && key
    ? createClient<Database>(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "pkce",
        },
      })
    : null;
export function db() {
  if (!supabase)
    throw new Error(
      "Conexão não configurada. Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.",
    );
  return supabase;
}
export function message(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "23505"
  )
    return "Código/SKU ou slug já cadastrado. Confira o valor informado.";
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error)
    return String(error.message);
  return "Não foi possível concluir. Verifique a conexão e tente novamente.";
}
export function check(error: unknown) {
  if (error) throw error;
}
