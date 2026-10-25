import type { User } from "@supabase/supabase-js";
import { db, check } from "../lib/supabase";
export const isAdmin = (user: User | null) =>
  !!user && ["owner", "admin"].includes(user.app_metadata.eliteparts_role);
export async function currentAdmin() {
  const { data, error } = await db().auth.getUser();
  if (error) {
    if (error.name === "AuthSessionMissingError") return null;
    throw error;
  }
  return data.user;
}
export async function signIn(email: string, password: string) {
  const { data, error } = await db().auth.signInWithPassword({
    email,
    password,
  });
  check(error);
  if (!isAdmin(data.user)) {
    await db().auth.signOut();
    throw new Error(
      "Acesso negado. Esta conta não possui permissão administrativa.",
    );
  }
  return data.user;
}
export async function signOut() {
  const { error } = await db().auth.signOut();
  check(error);
}
export async function recover(email: string) {
  const { error } = await db().auth.resetPasswordForEmail(email, {
    redirectTo: `${location.origin}/admin/redefinir-senha`,
  });
  check(error);
}
export async function updatePassword(password: string) {
  const { error } = await db().auth.updateUser({ password });
  check(error);
}
