import { build } from "esbuild";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
async function module(path) {
  const r = await build({
    entryPoints: [path],
    bundle: true,
    write: false,
    platform: "node",
    format: "esm",
  });
  return import(
    "data:text/javascript;base64," +
      Buffer.from(r.outputFiles[0].text).toString("base64")
  );
}
const { intakeHandler } = await module(
  "supabase/functions/_shared/intake-handler.ts",
);
const interest = await module("src/lib/interest.ts"),
  cart = await module("src/lib/cart.ts");
let total = 0;
async function test(name, fn) {
  await fn();
  console.log("PASS", name);
  total++;
}
const origin = "https://preview.test",
  id = "22222222-2222-4222-8222-222222222222";
let calls = [];
const fake = async (name, args) => {
  calls.push({ name, args });
  return {
    data:
      name === "elite_lead_admission"
        ? true
        : { id, number: "5584987099386", name: args.payload.name, items: [] },
    error: null,
  };
};
const handler = intakeHandler(fake, new Set([origin]));
const valid = {
  key: crypto.randomUUID(),
  name: "Teste isolado",
  phone: "(84) 98709-9386",
  privacy: true,
  items: [{ id, quantity: 2 }],
};
const post = (p, headers = {}) =>
  new Request("https://edge.test", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json", ...headers },
    body: typeof p === "string" ? p : JSON.stringify(p),
  });
await test("HTTP: Origin, methods and preflight produce 403/405/204", async () => {
  assert.equal(
    (
      await handler(
        new Request("https://edge.test", {
          headers: { Origin: "https://untrusted.test" },
        }),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handler(
        new Request("https://edge.test", { headers: { Origin: origin } }),
      )
    ).status,
    405,
  );
  assert.equal(
    (
      await handler(
        new Request("https://edge.test", {
          method: "OPTIONS",
          headers: { Origin: origin },
        }),
      )
    ).status,
    204,
  );
});
await test("HTTP: empty/malformed JSON, null, name, phone, privacy, IDs and quantities rejected before intake RPC", async () => {
  const invalid = [
    "",
    "{",
    null,
    {},
    { ...valid, name: "x".repeat(181) },
    { ...valid, phone: "123" },
    { ...valid, privacy: false },
    { ...valid, items: [] },
    { ...valid, items: [{ id: "fake", quantity: 1 }] },
    { ...valid, items: [{ id, quantity: -1 }] },
    { ...valid, items: [{ id, quantity: 100 }] },
    { ...valid, items: [{ id, quantity: 1.5 }] },
    {
      ...valid,
      items: [
        { id, quantity: 1 },
        { id: id.toUpperCase(), quantity: 2 },
      ],
    },
    {
      ...valid,
      items: Array.from({ length: 51 }, () => ({ id, quantity: 1 })),
    },
  ];
  for (const p of invalid) {
    calls = [];
    assert.equal((await handler(post(p))).status, 400);
    assert.ok(calls.every((c) => c.name !== "elite_create_lead"));
  }
  assert.equal((await handler(post("x".repeat(16001)))).status, 413);
});
await test("HTTP: canonical payload strips forged price/SKU; no IP/proxy header required", async () => {
  calls = [];
  assert.equal(
    (
      await handler(
        post(
          { ...valid, items: [{ id, quantity: 2, price: 0, sku: "FORGED" }] },
          { "x-forwarded-for": "attacker-chosen" },
        ),
      )
    ).status,
    200,
  );
  const p = calls.find((c) => c.name === "elite_create_lead").args.payload;
  assert.equal(p.phone, "+5584987099386");
  assert.deepEqual(p.items, [{ id, quantity: 2 }]);
  const first = calls[0].args.client_bucket;
  calls = [];
  await handler(post(valid, { "x-forwarded-for": "different" }));
  assert.equal(calls[0].args.client_bucket, first);
});
await test("HTTP: persistent limiter and provider failures are handled without exposing SQL internals", async () => {
  const blocked = intakeHandler(
    async () => ({ data: false, error: null }),
    new Set([origin]),
  );
  assert.equal((await blocked(post(valid))).status, 429);
  const failed = intakeHandler(
    async (n) =>
      n === "elite_lead_admission"
        ? { data: true, error: null }
        : { data: null, error: { message: "secret schema detail" } },
    new Set([origin]),
  );
  assert.ok(
    !(await (await failed(post(valid))).text()).includes("secret schema"),
  );
  const offline = intakeHandler(
    async () => {
      throw Error("network");
    },
    new Set([origin]),
  );
  assert.equal((await offline(post(valid))).status, 503);
});
await test("Frontend: idempotency key stays on retries, rotates on edited data and survives storage denial", async () => {
  const values = new Map(),
    storage = {
      getItem: (k) => values.get(k) || null,
      setItem: (k, v) => values.set(k, v),
    },
    memory = { hash: "", key: "" };
  const first = await interest.requestIdentity(valid, memory, storage);
  assert.equal(await interest.requestIdentity(valid, memory, storage), first);
  assert.equal(
    await interest.requestIdentity(valid, { hash: "", key: "" }, storage),
    first,
  );
  assert.notEqual(
    await interest.requestIdentity(
      { ...valid, name: "Outro nome" },
      memory,
      storage,
    ),
    first,
  );
  const noStorage = {
      getItem() {
        throw Error();
      },
      setItem() {
        throw Error();
      },
    },
    m = { hash: "", key: "" };
  assert.equal(
    await interest.requestIdentity(valid, m, noStorage),
    await interest.requestIdentity(valid, m, noStorage),
  );
  assert.ok(![...values.values()].join().includes(valid.name));
});
await test("Frontend: cart restoration deduplicates product UUIDs, caps 50 items and clamps quantities", () => {
  const items = Array.from({ length: 80 }, (_, n) => ({
    productId: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    quantity: 1000,
  }));
  const loaded = cart.decodeCart(JSON.stringify({ version: 1, items }));
  assert.equal(loaded.length, 50);
  assert.ok(loaded.every((i) => i.quantity === 99));
  assert.equal(
    cart.decodeCart(
      JSON.stringify({
        version: 1,
        items: [
          { productId: id, quantity: 1 },
          { productId: id, quantity: 3, option: "other" },
        ],
      }),
    )[0].quantity,
    4,
  );
  assert.deepEqual(cart.decodeCart("malformed"), []);
});
await test("WhatsApp: 1/3/10/11 products, accents, quantities, reference and bounded URL length", () => {
  for (const n of [1, 3, 10, 11]) {
    const r = {
      id,
      number: "5584987099386",
      name: "João",
      items: Array.from({ length: n }, (_, i) => ({
        name: "Câmera de ré",
        sku: "000" + i,
        quantity: i + 1,
      })),
    };
    const u = new URL(interest.whatsappURL(r));
    assert.equal(u.hostname, "wa.me");
    assert.ok(u.searchParams.get("text").includes(id));
    assert.ok(u.searchParams.get("text").includes("João"));
    assert.ok(u.searchParams.get("text").includes("0000"));
  }
  const u = interest.whatsappURL({
    id,
    number: "5584987099386",
    name: "Teste",
    items: Array.from({ length: 50 }, () => ({
      name: "ç".repeat(240),
      sku: "ç".repeat(120),
      quantity: 99,
    })),
  });
  assert.ok(u.length < 6200);
});
const db = new PGlite();
try {
  await db.exec(readFileSync("tests/schema-fixture.sql", "utf8"));
  for (const f of readdirSync("supabase/migrations").filter((f) =>
    f.endsWith(".sql"),
  ))
    await db.exec(readFileSync("supabase/migrations/" + f, "utf8"));
  await db.exec(
    `insert into auth.users values('11111111-1111-4111-8111-111111111111');insert into products(id,sku,slug,name,price,is_active,availability) values('${id}','00007','led','Farol',42.50,true,'disponivel');insert into site_settings(key,value,is_public) values('whatsapp_number','"5584987099386"',true);`,
  );
  const rpc = async (name, args) => {
    try {
      const keys = Object.keys(args);
      const result = await db.query(
        `select ${name}(${keys.map((k, i) => k + "=> $" + (i + 1)).join(",")}) result`,
        Object.values(args),
      );
      return { data: result.rows[0].result, error: null };
    } catch (e) {
      return { data: null, error: { message: e.message, code: e.code } };
    }
  };
  const real = intakeHandler(rpc, new Set([origin]));
  await test("Isolated HTTP → actual PostgreSQL RPC → atomic snapshots → replay", async () => {
    const first = await real(post(valid));
    assert.equal(first.status, 200);
    const receipt = await first.json();
    const retry = await (await real(post(valid))).json();
    assert.equal(receipt.id, retry.id);
    assert.equal((await db.query("select count(*) n from leads")).rows[0].n, 1);
    const item = (await db.query("select * from lead_items")).rows[0];
    assert.equal(item.sku_snapshot, "00007");
    assert.equal(item.price_snapshot, "42.50");
    assert.equal(item.quantity, 2);
    assert.equal(
      (await real(post({ ...valid, name: "Different" }))).status,
      400,
    );
  });
  await test("DB: inactive/archived/unavailable/missing products cannot leave partially created leads", async () => {
    for (const change of [
      "is_active=false",
      "is_active=true,archived_at=now()",
      "archived_at=null,availability='indisponivel'",
    ]) {
      await db.exec("update products set " + change);
      assert.equal(
        (await real(post({ ...valid, key: crypto.randomUUID() }))).status,
        400,
      );
      assert.equal(
        (await db.query("select count(*) n from leads")).rows[0].n,
        1,
      );
    }
    assert.equal(
      (
        await real(
          post({
            ...valid,
            key: crypto.randomUUID(),
            items: [{ id: crypto.randomUUID(), quantity: 1 }],
          }),
        )
      ).status,
      400,
    );
  });
  await test("DB: malformed public filters bounded; direct status update generates attributed history", async () => {
    await db.exec(
      "update products set is_active=true,archived_at=null,availability='disponivel'",
    );
    assert.equal(
      (await db.query('select elite_catalog(\'{"page":"invalid"}\') r')).rows[0]
        .r.total,
      1,
    );
    await assert.rejects(db.query("select elite_catalog('{\"ids\":5}')"));
    await db.query("select set_config('request.jwt.claims',$1,false)", [
      JSON.stringify({
        sub: "11111111-1111-4111-8111-111111111111",
        app_metadata: { eliteparts_role: "owner" },
      }),
    ]);
    await db.exec(
      "set role authenticated;update leads set status='convertido'",
    );
    const e = (
      await db.query("select * from lead_events where event_type='situacao'")
    ).rows;
    assert.equal(e.length, 1);
    assert.equal(e[0].actor_user_id, "11111111-1111-4111-8111-111111111111");
  });
} finally {
  await db.close();
}
console.log("WORK D checks:", total);
