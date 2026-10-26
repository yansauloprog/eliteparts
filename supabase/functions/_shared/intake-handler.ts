import { normalizePhone } from "./interest.ts";
export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Rpc = (
  name: string,
  args: Record<string, unknown>,
) => Promise<{
  data: unknown;
  error: { message: string; code?: string } | null;
}>;
export function intakeHandler(rpc: Rpc, origins: Set<string>) {
  return async (req: Request) => {
    const origin = req.headers.get("origin") || "";
    const headers: Record<string, string> = {
      "Access-Control-Allow-Origin": origins.has(origin) ? origin : "null",
      "Access-Control-Allow-Headers":
        "authorization, apikey, content-type, x-client-info",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      Vary: "Origin",
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    };
    const respond = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), { status, headers });
    if (!origins.has(origin))
      return respond({ error: "Origem não permitida." }, 403);
    if (req.method === "OPTIONS")
      return new Response(null, { status: 204, headers });
    if (req.method !== "POST")
      return respond({ error: "Método não permitido." }, 405);
    try {
      // Origin is a browser CORS policy, not authentication. The global DB admission
      // counter cannot be bypassed by changing Origin, IP or proxy headers.
      const admission = await rpc("elite_lead_admission", {
        client_bucket: "0".repeat(64),
      });
      if (admission.error)
        return respond({ error: "Serviço temporariamente indisponível." }, 503);
      if (admission.data !== true) {
        headers["Retry-After"] = "60";
        return respond(
          { error: "Limite de solicitações atingido. Tente mais tarde." },
          429,
        );
      }
      const reader = req.body?.getReader();
      if (!reader) return respond({ error: "Solicitação inválida." }, 400);
      const chunks: Uint8Array[] = [];
      let size = 0;
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
      let p;
      try {
        p = JSON.parse(new TextDecoder().decode(raw));
      } catch {
        return respond({ error: "JSON inválido." }, 400);
      }
      if (
        !p ||
        typeof p !== "object" ||
        Array.isArray(p) ||
        typeof p.name !== "string" ||
        typeof p.phone !== "string" ||
        p.privacy !== true ||
        !UUID.test(p.key || "") ||
        !Array.isArray(p.items) ||
        p.items.length < 1 ||
        p.items.length > 50
      )
        return respond({ error: "Solicitação inválida." }, 400);
      const name = p.name.trim().replace(/\s+/g, " ");
      if (name.length < 3 || name.length > 180 || /[\u0000-\u001f]/.test(name))
        return respond(
          { error: "Informe seu nome (3 a 180 caracteres)." },
          400,
        );
      let phone;
      try {
        phone = normalizePhone(p.phone);
      } catch {
        return respond(
          { error: "Informe um telefone válido, com DDD e código do país." },
          400,
        );
      }
      const seen = new Set<string>();
      for (const i of p.items) {
        if (
          !i ||
          typeof i !== "object" ||
          !UUID.test(i.id || "") ||
          seen.has(i.id.toLowerCase()) ||
          !Number.isInteger(i.quantity) ||
          i.quantity < 1 ||
          i.quantity > 99
        )
          return respond({ error: "Produtos ou quantidades inválidos." }, 400);
        seen.add(i.id.toLowerCase());
      }
      // A phone hash supplies a supplementary bucket; no raw IP headers are trusted.
      const hash = Array.from(
        new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(phone),
          ),
        ),
      )
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const payload = {
        key: p.key,
        name,
        phone,
        privacy: true,
        items: p.items.map((i: { id: string; quantity: number }) => ({
          id: i.id.toLowerCase(),
          quantity: i.quantity,
        })),
      };
      const { data, error } = await rpc("elite_create_lead", {
        payload,
        client_bucket: hash,
      });
      if (error) {
        // Return only deliberate business errors, never SQL/schema/provider details.
        const safe = [
          "Um produto foi removido ou está indisponível. Atualize sua lista.",
          "Atendimento comercial aguardando configuração.",
          "Esta solicitação já foi utilizada com outros dados.",
          "Limite de solicitações atingido. Tente mais tarde.",
        ];
        return respond(
          {
            error: safe.includes(error.message)
              ? error.message
              : "Não foi possível registrar a solicitação. Tente novamente.",
          },
          error.message.startsWith("Limite") ? 429 : 400,
        );
      }
      return respond(data);
    } catch {
      return respond(
        { error: "Serviço temporariamente indisponível. Tente novamente." },
        503,
      );
    }
  };
}
