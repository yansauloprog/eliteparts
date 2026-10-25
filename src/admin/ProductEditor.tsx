import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, navigate } from "../lib/router";
import {
  getProduct,
  saveProduct,
  deleteProduct,
  type Attribute,
  type Product,
} from "../services/products";
import { categories, type Category } from "../services/categories";
import { decimalPrice, validateSKU } from "../services/validation";
import { db, message, check } from "../lib/supabase";
import { Field, Loading, Notice, useUnsaved } from "./shared";
import { ImageManager } from "./ImageManager";
import { availabilityNames } from "./Products";
const empty = {
  sku: "",
  name: "",
  brand: "",
  category_id: "",
  price: "",
  description: "",
  availability: "sob_consulta",
  position: 0,
  is_active: false,
};
export function ProductEditor({ id }: { id?: string }) {
  const [form, setForm] = useState(empty),
    [original, setOriginal] = useState<Product | null>(null),
    [attrs, setAttrs] = useState<Attribute[]>([]),
    [cats, setCats] = useState<Category[]>([]),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [baseline, setBaseline] = useState(""),
    [logs, setLogs] = useState<
      {
        id: string;
        action: string;
        created_at: string;
        actor_user_id: string | null;
        changes: unknown;
      }[]
    >([]);
  const leave = useRef(false);
  const dirty = !!baseline && baseline !== JSON.stringify({ form, attrs });
  useUnsaved(dirty && !leave.current);
  async function audit(productId: string) {
    const { data, error } = await db()
      .from("admin_audit_logs")
      .select("*")
      .eq("entity_type", "products")
      .eq("entity_id", productId)
      .order("created_at", { ascending: false })
      .limit(15);
    check(error);
    setLogs(data!);
  }
  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const cs = await categories();
      if (!active) return;
      setCats(cs);
      const source = id || new URLSearchParams(location.search).get("duplicar");
      if (source) {
        const result = await getProduct(source);
        if (!active) return;
        const p = result.product;
        const value = {
          sku: id ? p.sku : "",
          name: p.name,
          brand: p.brand || "",
          category_id: p.category_id || "",
          price: p.price === null ? "" : String(p.price),
          description: p.description || "",
          availability: p.availability,
          position: p.position,
          is_active: id ? p.is_active : false,
        };
        setOriginal(id ? p : null);
        setForm(value);
        setAttrs(result.attributes);
        setBaseline(JSON.stringify({ form: value, attrs: result.attributes }));
        if (id) await audit(id);
      } else setBaseline(JSON.stringify({ form: empty, attrs: [] }));
    })()
      .catch((e) => {
        if (active) setError(message(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);
  function field<K extends keyof typeof empty>(
    key: K,
    value: (typeof empty)[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      validateSKU(form.sku);
      if (!form.name.trim()) throw new Error("Informe o nome do produto.");
      const seen = new Set();
      for (const a of attrs) {
        if (!a.name.trim() || !a.value.trim())
          throw new Error("Preencha nome e valor de cada especificação.");
        if (seen.has(a.name))
          throw new Error(`Especificação repetida: ${a.name}`);
        seen.add(a.name);
      }
      const p = await saveProduct(
        {
          ...form,
          id,
          price: decimalPrice(form.price),
          specifications: original?.specifications ?? {},
        },
        attrs,
      );
      setOriginal(p);
      setBaseline(JSON.stringify({ form, attrs }));
      setSuccess("Produto salvo com sucesso.");
      if (!id) {
        leave.current = true;
        navigate(`/admin/produtos/${p.id}`, true);
      } else await audit(p.id);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (
      !id ||
      !window.confirm(
        `Excluir permanentemente o produto “${form.sku} — ${form.name}”? Esta ação não pode ser desfeita.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await deleteProduct(id);
      leave.current = true;
      navigate("/admin/produtos");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading />;
  if (id && !original)
    return (
      <>
        <Notice error={error} />
        <Link href="/admin/produtos">Voltar aos produtos</Link>
      </>
    );
  return (
    <>
      <div className="a-title">
        <div>
          <Link href="/admin/produtos">← Produtos</Link>
          <h1>{id ? "Editar produto" : "Cadastrar produto"}</h1>
          <p>
            {id
              ? `Código atual: ${original?.sku}`
              : "Informe o código comercial existente. O novo cadastro começa como rascunho."}
          </p>
        </div>
        {dirty && <span className="a-badge">Alterações não salvas</span>}
      </div>
      <Notice error={error} success={success} />
      <form className="a-editor" onSubmit={save}>
        <section className="a-panel">
          <h2>Informações do produto</h2>
          <div className="a-form-grid">
            <Field label="Código/SKU *">
              <input
                required
                maxLength={120}
                value={form.sku}
                onChange={(e) => field("sku", e.target.value)}
              />
            </Field>
            <Field label="Nome do produto *">
              <input
                required
                maxLength={240}
                value={form.name}
                onChange={(e) => field("name", e.target.value)}
              />
            </Field>
            <Field label="Marca">
              <input
                maxLength={200}
                value={form.brand}
                onChange={(e) => field("brand", e.target.value)}
              />
            </Field>
            <Field label="Categoria">
              <select
                value={form.category_id}
                onChange={(e) => field("category_id", e.target.value)}
              >
                <option value="">Sem categoria</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {!c.is_active ? " (inativa)" : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Preço (R$) — deixe vazio para sob consulta">
              <input
                inputMode="decimal"
                placeholder="Ex.: 129,90"
                value={form.price}
                onChange={(e) => field("price", e.target.value)}
              />
            </Field>
            <Field label="Disponibilidade *">
              <select
                required
                value={form.availability}
                onChange={(e) => field("availability", e.target.value)}
              >
                {Object.entries(availabilityNames).map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Ordem de exibição">
              <input
                type="number"
                min={-2147483648}
                max={2147483647}
                step="1"
                required
                value={form.position}
                onChange={(e) => field("position", e.target.valueAsNumber)}
              />
            </Field>
          </div>
          <Field label="Descrição">
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => field("description", e.target.value)}
            />
          </Field>
          <label className="a-checkbox">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => field("is_active", e.target.checked)}
            />{" "}
            Publicar produto
          </label>
          {original?.archived_at && (
            <p>
              Este produto está arquivado. Desarquive na listagem para torná-lo
              visível.
            </p>
          )}
        </section>
        <section className="a-panel">
          <h2>Especificações técnicas</h2>
          <p>Adicione os atributos adequados ao produto.</p>
          {attrs.map((a, i) => (
            <div className="a-attribute" key={i}>
              <Field label="Nome">
                <input
                  required
                  maxLength={120}
                  value={a.name}
                  onChange={(e) =>
                    setAttrs((arr) =>
                      arr.map((v, n) =>
                        n === i ? { ...v, name: e.target.value } : v,
                      ),
                    )
                  }
                />
              </Field>
              <Field label="Valor">
                <input
                  required
                  maxLength={1500}
                  value={a.value}
                  onChange={(e) =>
                    setAttrs((arr) =>
                      arr.map((v, n) =>
                        n === i ? { ...v, value: e.target.value } : v,
                      ),
                    )
                  }
                />
              </Field>
              <Field label="Unidade">
                <input
                  value={a.unit || ""}
                  onChange={(e) =>
                    setAttrs((arr) =>
                      arr.map((v, n) =>
                        n === i ? { ...v, unit: e.target.value } : v,
                      ),
                    )
                  }
                />
              </Field>
              <button
                type="button"
                onClick={() => setAttrs((arr) => arr.filter((_, n) => n !== i))}
              >
                Remover
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setAttrs((arr) => [
                ...arr,
                { name: "", value: "", unit: null, position: arr.length },
              ])
            }
          >
            + Adicionar especificação
          </button>
        </section>
        <div className="a-save-bar">
          <button className="a-primary" disabled={busy}>
            {busy ? "Salvando…" : "Salvar produto"}
          </button>
          <Link href="/admin/produtos">Cancelar</Link>
          {id && (
            <button
              type="button"
              className="a-danger"
              disabled={busy}
              onClick={() => void remove()}
            >
              Excluir permanentemente
            </button>
          )}
        </div>
      </form>
      {id ? (
        <ImageManager productId={id} />
      ) : (
        <section className="a-panel">
          <h2>Fotografias</h2>
          <p>
            Salve o produto para adicionar fotografias vinculadas ao seu
            identificador permanente.
          </p>
        </section>
      )}
      {id && (
        <section className="a-panel">
          <h2>Histórico deste produto</h2>
          {logs.length === 0 ? (
            <p>Nenhuma operação registrada.</p>
          ) : (
            <ul className="a-history">
              {logs.map((l) => (
                <li key={l.id}>
                  <strong>
                    {l.action === "insert"
                      ? "Criação"
                      : l.action === "update"
                        ? "Alteração"
                        : "Exclusão"}
                  </strong>
                  <span>{new Date(l.created_at).toLocaleString("pt-BR")}</span>
                  <small>
                    Administrador: {l.actor_user_id || "Operação de sistema"}
                  </small>
                  <details>
                    <summary>Ver alterações</summary>
                    <pre>{JSON.stringify(l.changes, null, 2)}</pre>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
