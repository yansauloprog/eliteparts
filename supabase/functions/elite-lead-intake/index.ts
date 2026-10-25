import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";
const allowed = new Set([
  "https://eliteparts-git-feature-eliteparts-work-c-commerce-crm-yanprog.vercel.app",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "";
  const headers = {
    "Access-Control-Allow-Origin": allowed.has(origin) ? origin : "null",
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };
  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers });
  if (!allowed.has(origin))
    return respond({ error: "Origem não permitida." }, 403);
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  if (req.method !== "POST")
    return respond({ error: "Método não permitido." }, 405);
  try {
    // Trusted gateway address header. Hash includes a server-only secret; no raw IP is stored.
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim();
    if (!ip)
      return respond({ error: "Não foi possível validar a origem." }, 400);
    const bytes = new TextEncoder().encode(
      ip + ":" + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    );
    const hash = Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    )
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const admission = await db.rpc("elite_lead_admission", {
      client_bucket: hash,
    });
    if (admission.error)
      return respond({ error: "Serviço temporariamente indisponível." }, 503);
    if (!admission.data)
      return respond(
        { error: "Limite de solicitações atingido. Tente mais tarde." },
        429,
      );
    const reader = req.body?.getReader();
    let size = 0;
    const chunks: Uint8Array[] = [];
    if (!reader) return respond({ error: "Solicitação inválida." }, 400);
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > 16000) {
        await reader.cancel();
        return respond({ error: "Solicitação muito grande." }, 413);
      }
      chunks.push(next.value);
    }
    const raw = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      raw.set(chunk, offset);
      offset += chunk.length;
    }
    const payload = JSON.parse(new TextDecoder().decode(raw));
    const { normalizePhone } = await import("../_shared/interest.ts");
    payload.phone = normalizePhone(String(payload.phone || ""));
    if (
      payload.privacy !== true ||
      !Array.isArray(payload.items) ||
      payload.items.length < 1 ||
      payload.items.length > 50 ||
      !/^[-0-9a-f]{36}$/i.test(payload.key || "")
    )
      return respond({ error: "Solicitação inválida." }, 400);
    const { data, error } = await db.rpc("elite_create_lead", {
      payload,
      client_bucket: hash,
    });
    if (error)
      return respond(
        {
          error: error.message.includes("exception")
            ? "Não foi possível registrar a solicitação."
            : error.message,
        },
        400,
      );
    return respond(data);
  } catch {
    return respond(
      { error: "Dados inválidos ou serviço indisponível. Tente novamente." },
      400,
    );
  }
});
