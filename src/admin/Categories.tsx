import { useState, type FormEvent } from "react";
import {
  categories,
  saveCategory,
  deleteCategory,
  categoryUsage,
  type Category,
} from "../services/categories";
import { validParent } from "../services/validation";
import { Link } from "../lib/router";
import { message } from "../lib/supabase";
import {
  Field,
  Notice,
  Loading,
  LoadError,
  useLoad,
  useUnsaved,
} from "./shared";
const empty = {
  id: "",
  name: "",
  slug: "",
  parent_id: "",
  position: 0,
  is_active: true,
};
export function Categories() {
  const result = useLoad(categories),
    [form, setForm] = useState(empty),
    [baseline, setBaseline] = useState(JSON.stringify(empty)),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false);
  useUnsaved(JSON.stringify(form) !== baseline);
  function edit(c?: Category) {
    if (
      JSON.stringify(form) !== baseline &&
      !confirm("Descartar alterações não salvas?")
    )
      return;
    const value = c
      ? {
          id: c.id,
          name: c.name,
          slug: c.slug,
          parent_id: c.parent_id || "",
          position: c.position,
          is_active: c.is_active,
        }
      : empty;
    setForm(value);
    setBaseline(JSON.stringify(value));
    setError("");
    setSuccess("");
    document.querySelector<HTMLElement>("#a-category-name")?.focus();
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      if (!validParent(form.id, form.parent_id, result.data ?? []))
        throw new Error("A categoria superior criaria um ciclo.");
      const value = await saveCategory({
        ...form,
        id: form.id || undefined,
        parent_id: form.parent_id || null,
      });
      const fresh = {
        id: value.id,
        name: value.name,
        slug: value.slug,
        parent_id: value.parent_id || "",
        position: value.position,
        is_active: value.is_active,
      };
      setForm(fresh);
      setBaseline(JSON.stringify(fresh));
      setSuccess("Categoria salva.");
      result.reload();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove(c: Category) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const count = await categoryUsage(c.id),
        children = result.data?.filter((x) => x.parent_id === c.id).length ?? 0;
      if (
        !confirm(
          `Excluir a categoria “${c.name}”? ${count} produto(s) ficarão sem categoria; ${children} subcategoria(s) passarão para o nível principal. Os produtos serão preservados.`,
        )
      )
        return;
      await deleteCategory(c.id);
      if (form.id === c.id) {
        setForm(empty);
        setBaseline(JSON.stringify(empty));
      }
      setSuccess("Categoria excluída. Produtos preservados.");
      result.reload();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="a-title">
        <div>
          <p className="a-kicker">ORGANIZAÇÃO</p>
          <h1>Categorias</h1>
          <p>Organize os produtos em categorias e subcategorias.</p>
        </div>
        <button onClick={() => edit()}>+ Nova categoria</button>
      </div>
      <Notice error={error} success={success} />
      <div className="a-category-layout">
        <form className="a-panel" onSubmit={submit}>
          <h2>{form.id ? "Editar categoria" : "Nova categoria"}</h2>
          <Field label="Nome *">
            <input
              id="a-category-name"
              required
              maxLength={160}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="Slug *">
            <input
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              title="Use letras minúsculas sem acentos, números e hífens."
              maxLength={200}
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
          </Field>
          <Field label="Categoria superior">
            <select
              value={form.parent_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, parent_id: e.target.value }))
              }
            >
              <option value="">Nenhuma — nível principal</option>
              {result.data
                ?.filter((c) => validParent(form.id, c.id, result.data!))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Ordem">
            <input
              type="number"
              step="1"
              required
              min={-2147483648}
              max={2147483647}
              value={form.position}
              onChange={(e) =>
                setForm((f) => ({ ...f, position: e.target.valueAsNumber }))
              }
            />
          </Field>
          <label className="a-checkbox">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_active: e.target.checked }))
              }
            />{" "}
            Categoria ativa
          </label>
          <button className="a-primary" disabled={busy}>
            {busy ? "Salvando…" : "Salvar categoria"}
          </button>
        </form>
        <section className="a-panel">
          <h2>Categorias cadastradas</h2>
          {result.loading ? (
            <Loading />
          ) : result.error ? (
            <LoadError error={result.error} retry={result.reload} />
          ) : result.data?.length ? (
            <ul className="a-category-list">
              {result.data.map((c) => (
                <li key={c.id}>
                  <div>
                    <strong>{c.name}</strong>
                    <small>
                      {c.parent_id
                        ? `Dentro de ${result.data?.find((x) => x.id === c.parent_id)?.name ?? "categoria"}`
                        : "Nível principal"}{" "}
                      · {c.is_active ? "Ativa" : "Inativa"} · ordem {c.position}
                    </small>
                    <code>{c.slug}</code>
                  </div>
                  <div className="a-row-actions">
                    <button disabled={busy} onClick={() => edit(c)}>
                      Editar
                    </button>
                    <Link href={`/admin/produtos?categoria=${c.id}`}>
                      Ver produtos
                    </Link>
                    <button
                      className="a-danger"
                      disabled={busy}
                      onClick={() => void remove(c)}
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="a-empty">Nenhuma categoria cadastrada.</p>
          )}
        </section>
      </div>
    </>
  );
}
