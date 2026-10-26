import { build } from "esbuild";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
const results = [];
async function test(name, fn) {
  await fn();
  results.push({ name, status: "passed" });
  console.log("PASS", name);
}
async function module(path, mock = false) {
  const r = await build({
    entryPoints: [path],
    bundle: true,
    write: false,
    platform: "node",
    format: "esm",
    plugins: mock
      ? [
          {
            name: "test-db",
            setup(b) {
              b.onResolve({ filter: /lib\/supabase$/ }, () => ({
                path: "db",
                namespace: "mock",
              }));
              b.onLoad({ filter: /.*/, namespace: "mock" }, () => ({
                contents:
                  "export const db=()=>globalThis.__eliteClient; export function check(e){if(e)throw e;}",
                loader: "js",
              }));
            },
          },
        ]
      : [],
  });
  return import(
    "data:text/javascript;base64," +
      Buffer.from(r.outputFiles[0].text).toString("base64")
  );
}
const v = await module("src/services/validation.ts");
await test("Exact decimal input; invalid/negative/precision values rejected", () => {
  assert.equal(v.decimalPrice("00123,40"), "123.40");
  assert.equal(v.decimalPrice(""), null);
  assert.equal(v.decimalPrice("99.9"), "99.90");
  for (const s of ["-1", "0.001", "1e3", "1.234,56", "Infinity"])
    assert.throws(() => v.decimalPrice(s));
});
await test("SKU unchanged, zeros preserved; accidental whitespace rejected", () => {
  assert.equal(v.validateSKU("0004587"), "0004587");
  assert.equal(v.validateSKU("LED-H7-001"), "LED-H7-001");
  assert.throws(() => v.validateSKU(" 0045"));
});
await test("Client hierarchy rejects own parent and descendant", () => {
  const c = [
    { id: "a", parent_id: null },
    { id: "b", parent_id: "a" },
    { id: "c", parent_id: "b" },
  ];
  assert.equal(v.validParent("a", "c", c), false);
  assert.equal(v.validParent("b", "b", c), false);
  assert.equal(v.validParent("c", "a", c), true);
});
const auth = await module("src/services/auth.ts", true);
let signedOut = 0;
const user = { id: "local-test", app_metadata: { eliteparts_role: "admin" } };
globalThis.location = { origin: "https://preview.example" };
globalThis.__eliteClient = {
  auth: {
    getUser: async () => ({ data: { user }, error: null }),
    signInWithPassword: async () => ({ data: { user }, error: null }),
    signOut: async () => {
      signedOut++;
      return { error: null };
    },
    resetPasswordForEmail: async (email, options) => {
      assert.equal(email, "owner@example.test");
      assert.equal(
        options.redirectTo,
        "https://preview.example/admin/redefinir-senha",
      );
      return { error: null };
    },
    updateUser: async () => ({ error: null }),
  },
};
await test("Admin identity verified through getUser and app_metadata", async () => {
  assert.equal((await auth.currentAdmin()).id, user.id);
  assert.equal(
    auth.isAdmin({
      ...user,
      app_metadata: {},
      user_metadata: { eliteparts_role: "owner" },
    }),
    false,
  );
  assert.equal(
    (await auth.signIn("owner@example.test", "test-only")).id,
    user.id,
  );
});
await test("Common user login denied and session signed out", async () => {
  globalThis.__eliteClient.auth.signInWithPassword = async () => ({
    data: { user: { ...user, app_metadata: {} } },
    error: null,
  });
  await assert.rejects(
    auth.signIn("common@example.test", "test-only"),
    /Acesso negado/,
  );
  assert.equal(signedOut, 1);
});
await test("Recovery redirect and explicit logout use SDK", async () => {
  await auth.recover("owner@example.test");
  await auth.signOut();
  assert.equal(signedOut, 2);
});
const media = await module("src/services/productImages.ts", true);
let uploads = [],
  removed = [],
  rows = [];
let failUpload = false,
  failDB = false;
globalThis.createImageBitmap = async () => ({
  width: 800,
  height: 400,
  close() {},
});
globalThis.document = {
  createElement: () => ({
    getContext: () => ({ drawImage() {} }),
    toBlob: (fn) => fn(new Blob(["webp"], { type: "image/webp" })),
  }),
};
const storage = {
  getPublicUrl: (path) => ({
    data: { publicUrl: "https://example.test/" + path },
  }),
  upload: async (path) => {
    uploads.push(path);
    return {
      error:
        failUpload && path.endsWith("-480.webp") ? new Error("upload failed") : null,
    };
  },
  remove: async (paths) => {
    removed.push(...paths);
    return { error: null };
  },
};
globalThis.__eliteClient = {
  storage: { from: () => storage },
  from: () => ({
    insert: (value) => ({
      select: () => ({
        single: async () => {
          if (!failDB) rows.push(value);
          return { data: value, error: failDB ? new Error("db failed") : null };
        },
      }),
    }),
    update: (value) => ({
      eq() {
        return this;
      },
      select: () => ({ single: async () => ({ data: value, error: null }) }),
    }),
  }),
};
const file = new File(["test"], "original.png", { type: "image/png" });
const productId = "11111111-1111-4111-8111-111111111111";
await test("Three image uploads generate gallery + thumbnails linked by UUID", async () => {
  for (let n = 0; n < 3; n++) await media.uploadImage(productId, file, n);
  assert.equal(rows.length, 3);
  assert.equal(uploads.length, 6);
  assert.ok(
    rows.every(
      (r) =>
        r.product_id === productId &&
        r.full_path.startsWith(productId + "/") &&
        r.thumb_path.endsWith("-480.webp"),
    ),
  );
});
await test("Failed thumbnail upload compensates previously uploaded gallery", async () => {
  failUpload = true;
  uploads = [];
  removed = [];
  await assert.rejects(media.uploadImage(productId, file, 3), /upload failed/);
  assert.deepEqual(removed, [uploads[0]]);
  failUpload = false;
});
await test("Failed metadata save compensates both newly uploaded files", async () => {
  failDB = true;
  uploads = [];
  removed = [];
  await assert.rejects(media.uploadImage(productId, file, 3), /db failed/);
  assert.deepEqual(removed, uploads);
  failDB = false;
});
await test("Replacement keeps row ID and cleans old image pair after save", async () => {
  removed = [];
  await media.uploadImage(productId, file, 0, {
    id: "image-id",
    product_id: productId,
    full_path: "old.webp",
    thumb_path: "old-480.webp",
  });
  assert.deepEqual(removed, ["old.webp", "old-480.webp"]);
});
writeFileSync(
  "docs/work-a-service-tests.json",
  JSON.stringify(
    {
      environment:
        "isolated service tests; SDK mocked, hosted credentials never created",
      results,
    },
    null,
    2,
  ),
);
