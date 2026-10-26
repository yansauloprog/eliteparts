import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .trim()
    .split("\n")
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const client = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false } },
);
const results = [];
async function test(name, fn) {
  if(!process.env.ELITE_ALLOW_WRITE_PROBES && /creation|update|upload/.test(name)){
    results.push({name,status:'skipped',reason:'Requires explicit authorization for hosted write probes (ELITE_ALLOW_WRITE_PROBES=1).'});
    console.log('SKIP',name,'— hosted write probe not enabled');return;
  }
  await fn();
  results.push({ name, status: "passed" });
  console.log("PASS", name);
}
await test("Hosted public products query with publishable key", async () => {
  const r = await client
    .from("products")
    .select("id,sku,name", { count: "exact" })
    .limit(25);
  assert.ifError(r.error);
  assert.ok(Array.isArray(r.data));
  console.log("Visible products:", r.count);
});
await test('Hosted paginated catalog RPC',async()=>{
 const r=await client.rpc('elite_catalog',{filters:{page:1}});assert.ifError(r.error);
 assert.ok(Array.isArray(r.data.rows));assert.ok(r.data.rows.length<=24);
});
await test("Hosted anonymous product creation denied", async () => {
  const r = await client
    .from("products")
    .insert({
      sku: "WORK-A-DENIED-TEST",
      slug: "work-a-denied-test",
      name: "Must never be persisted",
    });
  assert.ok(r.error);
  assert.equal(r.error.code, "42501");
});
await test("Hosted anonymous price update denied", async () => {
  const r = await client
    .from("products")
    .update({ price: 1 })
    .eq("id", "00000000-0000-0000-0000-000000000000");
  assert.ok(r.error);
  assert.equal(r.error.code, "42501");
});
await test("Hosted leads and audit reads denied", async () => {
  for (const table of ["leads", "admin_audit_logs"]) {
    const r = await client.from(table).select("*").limit(1);
    assert.ok(r.error);
    assert.equal(r.error.code, "42501");
  }
});
await test("Hosted admin RPC denied to anonymous callers", async () => {
  for (const fn of ["elite_admin_dashboard", "elite_admin_products"]) {
    const r = await client.rpc(fn);
    assert.ok(r.error);
  }
});
await test("Hosted anonymous storage upload denied", async () => {
  const r = await client.storage
    .from("elite-product-images")
    .upload(
      "work-a-denied-test.webp",
      new Blob(["denied"], { type: "image/webp" }),
      { contentType: "image/webp" },
    );
  assert.ok(r.error);
});
writeFileSync(
  "docs/work-a-live-api-tests.json",
  JSON.stringify({ project: "iyaytyinftdihwpfmcwy", results }, null, 2),
);
