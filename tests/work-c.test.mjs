import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import assert from "node:assert/strict";
const db = new PGlite();
try {
  await db.exec(readFileSync("tests/schema-fixture.sql", "utf8"));
  for (const f of readdirSync("supabase/migrations").filter((f) =>
    f.endsWith(".sql"),
  ))
    await db.exec(readFileSync("supabase/migrations/" + f, "utf8"));
  await db.exec(
    "insert into auth.users values('11111111-1111-4111-8111-111111111111');",
  );
  const admin = {
    sub: "11111111-1111-4111-8111-111111111111",
    app_metadata: { eliteparts_role: "owner" },
  };
  async function role(r, claims = {}) {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claims',$1,false)", [
      JSON.stringify(claims),
    ]);
    await db.exec("set role " + r);
  }
  async function call(name, args = []) {
    return (
      await db.query(
        "select " +
          name +
          "(" +
          args.map((_, i) => "$" + (i + 1)).join(",") +
          ") value",
        args,
      )
    ).rows[0].value;
  }
  await db.exec(
    "insert into products(id,sku,slug,name,price,is_active,availability) values('22222222-2222-4222-8222-222222222222','00007','led','Farol LED',42.50,true,'disponivel'),('33333333-3333-4333-8333-333333333333','HIDDEN','hidden','Oculto',null,false,'sob_consulta'); insert into site_settings(key,value,is_public) values('whatsapp_number','\"5511999999999\"',true);",
  );
  await role("anon");
  assert.equal((await call("elite_catalog", [{}])).total, 1);
  assert.equal(
    (await call("elite_catalog", [{ query: "00007" }])).rows[0].sku,
    "00007",
  );
  assert.equal((await call("elite_catalog", [{ query: "LED" }])).total, 1);
  await assert.rejects(call("elite_create_lead", [{}, "a".repeat(64)]));
  await assert.rejects(call("elite_crm_dashboard"));
  await assert.rejects(db.query("select * from leads"));
  console.log(
    "PASS public catalog visibility/search and anonymous CRM/intake RPC denial",
  );
  await role("postgres");
  const payload = {
    key: "44444444-4444-4444-8444-444444444444",
    name: "Teste isolado",
    phone: "+5511999999999",
    privacy: true,
    items: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        quantity: 3,
        price: 0,
        sku: "FAKE",
      },
    ],
  };
  const receipt = await call("elite_create_lead", [payload, "a".repeat(64)]);
  const again = await call("elite_create_lead", [payload, "a".repeat(64)]);
  assert.equal(receipt.id, again.id);
  assert.equal((await db.query("select count(*) n from leads")).rows[0].n, 1);
  let item = (await db.query("select * from lead_items")).rows[0];
  assert.equal(item.price_snapshot, "42.50");
  assert.equal(item.sku_snapshot, "00007");
  assert.equal(item.quantity, 3);
  await assert.rejects(
    call("elite_create_lead", [
      { ...payload, name: "Changed" },
      "a".repeat(64),
    ]),
  );
  console.log(
    "PASS atomic intake, authoritative SKU/price/quantity snapshots and idempotency",
  );
  await assert.rejects(
    call("elite_create_lead", [
      {
        ...payload,
        key: "55555555-5555-4555-8555-555555555555",
        items: [
          ...payload.items,
          { id: "33333333-3333-4333-8333-333333333333", quantity: 1 },
        ],
      },
      "a".repeat(64),
    ]),
  );
  assert.equal((await db.query("select count(*) n from leads")).rows[0].n, 1);
  await db.exec(
    "update products set price=99,name='Novo nome' where sku='00007'",
  );
  assert.equal(
    (await db.query("select price_snapshot from lead_items")).rows[0]
      .price_snapshot,
    "42.50",
  );
  console.log(
    "PASS partial failure rolls back lead/items; later product edits preserve snapshots",
  );
  await role("authenticated", {
    sub: admin.sub,
    user_metadata: { eliteparts_role: "owner" },
  });
  await assert.rejects(call("elite_list_leads", [{}]));
  await assert.rejects(
    call("elite_update_lead", [receipt.id, "convertido", ""]),
  );
  await role("authenticated", admin);
  await call("elite_update_lead", [
    receipt.id,
    "em_atendimento",
    "Contato iniciado",
  ]);
  assert.equal(
    (await db.query("select status from leads")).rows[0].status,
    "em_atendimento",
  );
  const events = (
    await db.query("select * from lead_events where event_type='anotacao'")
  ).rows;
  assert.equal(events[0].actor_user_id, admin.sub);
  assert.equal((await call("elite_crm_dashboard")).statuses.em_atendimento, 1);
  assert.equal((await call("elite_list_leads", [{ query: "Teste" }])).total, 1);
  assert.equal(
    (await call("elite_list_leads", [{ status: "convertido" }])).total,
    0,
  );
  console.log(
    "PASS owner CRM updates, actor attribution, search/filter and dashboard",
  );
  await role("postgres");
  for (let i = 0; i < 30; i++)
    assert.equal(await call("elite_lead_admission", ["b".repeat(64)]), true);
  assert.equal(await call("elite_lead_admission", ["b".repeat(64)]), false);
  console.log("PASS persistent admission rate limit");
} catch (e) {
  console.error(e.message, e.code, e.detail || "", e.where || "");
  process.exitCode = 1;
} finally {
  await db.close();
}
