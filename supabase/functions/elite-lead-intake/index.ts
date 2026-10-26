import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";
import { intakeHandler } from "../_shared/intake-handler.ts";
const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);
const origins = new Set([
  "https://eliteparts-git-feature-eliteparts-work-c-commerce-crm-yanprog.vercel.app",
  "https://eliteparts-git-feature-eliteparts-work-d-final-audit-yanprog.vercel.app",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);
Deno.serve(
  intakeHandler(async (name, args) => {
    const { data, error } = await db.rpc(name, args);
    return { data, error };
  }, origins),
);
