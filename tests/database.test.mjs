import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const db = new PGlite();
const results = [];
async function test(name, fn) {
  await fn();
  results.push({ name, status: "passed" });
  console.log("PASS", name);
}
await db.exec(readFileSync("tests/schema-fixture.sql", "utf8"));
await db.exec(
  `insert into auth.users values('11111111-1111-4111-8111-111111111111');`,
);
for (const file of readdirSync("supabase/migrations").filter((f) =>
  f.endsWith(".sql"),
))
  await db.exec(
    readFileSync(`supabase/migrations/${file}`, "utf8").replace(
      "notify pgrst,'reload schema';",
      "",
    ),
  );
async function role(r, claims = {}) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claims',$1,false)", [
    JSON.stringify(claims),
  ]);
  await db.exec(`set role ${r}`);
}
const admin = {
  sub: "11111111-1111-4111-8111-111111111111",
  app_metadata: { eliteparts_role: "admin" },
};
const save = async (p, a = []) =>
  (
    await db.query("select public.elite_save_product($1::jsonb,$2::jsonb) p", [
      JSON.stringify(p),
      JSON.stringify(a),
    ])
  ).rows[0].p;
const payload = {
  sku: "0004587",
  name: "Farol LED",
  availability: "disponivel",
  price: "123.45",
  brand: "Elite",
  is_active: false,
};
await role("anon");
await test("Anon: public products readable, writes and leads denied", async () => {
  assert.equal((await db.query("select * from products")).rows.length, 0);
  await assert.rejects(
    db.query("insert into products(sku,slug,name) values('X','x','x')"),
  );
  await assert.rejects(db.query("select * from leads"));
  await assert.rejects(db.query("update products set price=1"));
  await assert.rejects(db.query("select elite_save_product('{}','[]')"));
});
await role("authenticated", {
  sub: admin.sub,
  user_metadata: { eliteparts_role: "owner" },
});
await test("User-editable metadata does not authorize administration", async () => {
  await assert.rejects(save(payload));
  await assert.rejects(
    db.query("insert into products(sku,slug,name) values('X','x','x')"),
  );
  assert.equal((await db.query("select * from leads")).rows.length, 0);
});
await role("authenticated", admin);
let p;
await test("Admin: create product and preserve leading zeros / exact decimal", async () => {
  p = await save(payload, [{ name: "Potência", value: "60", unit: "W" }]);
  assert.equal(p.sku, "0004587");
  assert.equal(
    (await db.query("select price::text price from products")).rows[0].price,
    "123.45",
  );
});
await test("Duplicate SKU blocked without overwriting", async () => {
  await assert.rejects(save(payload));
  assert.equal(
    (await db.query("select count(*) n from products")).rows[0].n,
    1,
  );
});
await test("Product + attributes roll back atomically on invalid attribute", async () => {
  await assert.rejects(
    save({ ...payload, id: p.id, price: "2.00" }, [
      { name: "Potência", value: "60" },
      { name: "Potência", value: "70" },
    ]),
  );
  assert.equal(
    (await db.query("select price::text p from products")).rows[0].p,
    "123.45",
  );
});
let imageIds = [];
await test("Change SKU, price and attributes preserves UUID / images", async () => {
  for (let n = 0; n < 3; n++) {
    const r = await db.query(
      "insert into product_images(product_id,full_path,thumb_path,position) values($1,$2,$3,$4) returning id",
      [p.id, `${p.id}/${n}.webp`, `${p.id}/${n}-t.webp`, n],
    );
    imageIds.push(r.rows[0].id);
  }
  const updated = await save(
    { ...payload, id: p.id, sku: "4587-A", price: "99.90" },
    [{ name: "Encaixe", value: "H7", unit: null }],
  );
  assert.equal(updated.id, p.id);
  assert.equal(
    (
      await db.query(
        "select count(*) n from product_images where product_id=$1",
        [p.id],
      )
    ).rows[0].n,
    3,
  );
  assert.equal(
    (
      await db.query(
        "select name from product_attributes where product_id=$1",
        [p.id],
      )
    ).rows[0].name,
    "Encaixe",
  );
});
await test("Cover and ordering transactional; cross-product ID rejected", async () => {
  await db.query("select elite_order_images($1,$2::uuid[],$3)", [
    p.id,
    [...imageIds].reverse(),
    imageIds[2],
  ]);
  const rows = (
    await db.query("select * from product_images order by position")
  ).rows;
  assert.equal(rows[0].id, imageIds[2]);
  assert.equal(rows.filter((i) => i.is_cover).length, 1);
  await assert.rejects(
    db.query("select elite_order_images($1,$2::uuid[],$3)", [
      p.id,
      [imageIds[0]],
      imageIds[0],
    ]),
  );
});
await test("Published, archived and restored visibility enforced by RLS", async () => {
  await db.query(
    "update products set is_active=true,archived_at=now() where id=$1",
    [p.id],
  );
  await role("anon");
  assert.equal((await db.query("select * from products")).rows.length, 0);
  await role("authenticated", admin);
  await db.query("update products set archived_at=null where id=$1", [p.id]);
  await role("anon");
  assert.equal((await db.query("select * from products")).rows.length, 1);
  await role("authenticated", admin);
});
await test("Category links preserved; multi-level cycles rejected", async () => {
  const a = (
    await db.query(
      "insert into categories(name,slug) values('LED','led') returning id",
    )
  ).rows[0].id;
  const b = (
    await db.query(
      "insert into categories(name,slug,parent_id) values('Faróis','farois',$1) returning id",
      [a],
    )
  ).rows[0].id;
  await assert.rejects(
    db.query("update categories set parent_id=$1 where id=$2", [b, a]),
  );
  await db.query("update products set category_id=$1 where id=$2", [a, p.id]);
  await db.query("update categories set name='Iluminação' where id=$1", [a]);
  assert.equal(
    (await db.query("select category_id from products where id=$1", [p.id]))
      .rows[0].category_id,
    a,
  );
});
await test("Audit attribution is database-generated and cannot be forged", async () => {
  const rows = (
    await db.query("select * from admin_audit_logs where entity_id=$1", [p.id])
  ).rows;
  assert.ok(rows.some((l) => l.changes.after?.price === 99.9));
  assert.ok(rows.every((l) => l.actor_user_id === admin.sub));
  await assert.rejects(
    db.query(
      "insert into admin_audit_logs(entity_type,action) values('products','forged')",
    ),
  );
  await assert.rejects(db.query("delete from admin_audit_logs"));
});
await test("Server pagination/search/order across 1,201 isolated records", async () => {
  await db.exec(
    `insert into products(sku,slug,name,brand,price) select 'TEST-'||n,'test-'||n,'Produto '||lpad(n::text,4,'0'),'Teste',n from generate_series(1,1200) n;`,
  );
  const list = async (f) =>
    (
      await db.query("select elite_admin_products($1) data", [
        JSON.stringify(f),
      ])
    ).rows[0].data;
  const a = await list({ page: 1, size: 25, sort: "price" });
  const b = await list({ page: 2, size: 25, sort: "price" });
  assert.equal(a.total, 1201);
  assert.equal(a.rows.length, 25);
  assert.ok(!b.rows.some((r) => a.rows.some((x) => x.id === r.id)));
  assert.equal((await list({ query: "4587-A" })).total, 1);
  assert.equal((await list({ images: "yes" })).total, 1);
  assert.equal((await list({ size: 100 })).rows.length, 100);
  assert.equal((await list({ query: "Teste" })).total, 1200);
});
await test("Dashboard counts use persisted rows; image replacement/removal preserve product", async () => {
  const stats = (await db.query("select elite_admin_dashboard() data")).rows[0].data;
  assert.equal(stats.total, 1201); assert.equal(stats.active, 1); assert.equal(stats.without_images, 1200); assert.equal(stats.categories, 2);
  await db.query("update product_images set full_path=$1,thumb_path=$2 where id=$3", [p.id+"/replacement.webp",p.id+"/replacement-480.webp",imageIds[0]]);
  assert.equal((await db.query("select product_id from product_images where id=$1",[imageIds[0]])).rows[0].product_id,p.id);
  await db.query("delete from product_images where id=$1",[imageIds[0]]);
  assert.equal((await db.query("select count(*) n from product_images where product_id=$1",[p.id])).rows[0].n,2);
  const logs = (await db.query("select action from admin_audit_logs where entity_id=$1",[imageIds[0]])).rows.map(x=>x.action);
  assert.ok(logs.includes("update") && logs.includes("delete"));
});
await test("All existing public tables retain RLS", async () => {
  await role("postgres");
  const rows = (
    await db.query(
      "select relname,relrowsecurity from pg_class where relnamespace='public'::regnamespace and relkind='r'",
    )
  ).rows;
  assert.equal(rows.length, 10);
  assert.ok(rows.every((r) => r.relrowsecurity));
});
writeFileSync(
  "docs/work-a-database-tests.json",
  JSON.stringify(
    {
      environment:
        "isolated PGlite PostgreSQL; synthetic accounts and 1200 records are LOCAL ONLY",
      results,
    },
    null,
    2,
  ),
);
await db.close();
