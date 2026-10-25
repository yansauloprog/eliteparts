import { useState, type FormEvent } from "react";
import {
  listLeads,
  leadDetail,
  updateLead,
  statuses,
  crmDashboard,
} from "../services/leads";
import { Field, Notice, useLoad, Loading, LoadError } from "./shared";
import { Link, navigate, useRoute, routeURL } from "../lib/router";
import { message } from "../lib/supabase";
import { currency } from "../lib/catalog";
export function CrmDashboard() {
  const r = useLoad(crmDashboard);
  if (r.loading) return <Loading />;
  if (r.error) return <LoadError error={r.error} retry={r.reload} />;
  return (
    <section className="a-panel">
      <h2>Atendimento comercial</h2>
      <div className="a-stats">
        {[
          ["total", "Total de interessados"],
          ["novo", "Novos"],
          ["em_atendimento", "Em atendimento"],
          ["orcamento_enviado", "Orçamentos enviados"],
          ["convertido", "Convertidos"],
        ].map(([s, label]) => (
          <div key={s}>
            <strong>
              {s === "total" ? r.data?.total : r.data?.statuses[s] || 0}
            </strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <h3>Contatos recentes</h3>
      {r.data?.recent.length ? (
        r.data.recent.map((x) => (
          <p key={x.id}>
            <Link href={"/admin/leads/" + x.id}>{x.full_name}</Link> ·{" "}
            {x.status}
          </p>
        ))
      ) : (
        <p>Nenhuma solicitação registrada.</p>
      )}
      <Link href="/admin/leads">Abrir CRM →</Link>
    </section>
  );
}
export function Leads() {
  const route = useRoute(),
    p = routeURL(route).searchParams,
    page = Math.max(1, Number(p.get("page")) || 1);
  const r = useLoad(() => listLeads(Object.fromEntries(p)), [route]);
  function filter(key: string, value: string) {
    const q = new URLSearchParams(p);
    value ? q.set(key, value) : q.delete(key);
    if (key !== "page") q.delete("page");
    navigate("/admin/leads?" + q, true);
  }
  return (
    <>
      <div className="a-title">
        <div>
          <p className="a-kicker">CRM</p>
          <h1>Interessados</h1>
          <p>Solicitações de orçamento não representam vendas confirmadas.</p>
        </div>
      </div>
      <form
        className="a-panel c-crm-filters"
        onSubmit={(e) => {
          e.preventDefault();
          filter(
            "query",
            String(new FormData(e.currentTarget).get("query") || ""),
          );
        }}
      >
        <Field label="Buscar nome, telefone ou referência">
          <input
            name="query"
            key={p.get("query")}
            defaultValue={p.get("query") || ""}
          />
        </Field>
        <button>Buscar</button>
        <Field label="Situação">
          <select
            value={p.get("status") || ""}
            onChange={(e) => filter("status", e.target.value)}
          >
            <option value="">Todas</option>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Origem">
          <input
            value={p.get("source") || ""}
            onChange={(e) => filter("source", e.target.value)}
          />
        </Field>
        {["from", "to"].map((k) => (
          <Field key={k} label={k === "from" ? "Data inicial" : "Data final"}>
            <input
              type="date"
              value={p.get(k) || ""}
              onChange={(e) => filter(k, e.target.value)}
            />
          </Field>
        ))}
      </form>
      {r.loading ? (
        <Loading />
      ) : r.error ? (
        <LoadError error={r.error} retry={r.reload} />
      ) : (
        <>
          <div className="a-panel c-table">
            <table>
              <thead>
                <tr>
                  {[
                    "Cliente",
                    "WhatsApp",
                    "Produtos",
                    "Data",
                    "Situação",
                    "Origem",
                    "Ações",
                  ].map((t) => (
                    <th key={t}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {r.data?.rows.map((x) => (
                  <tr key={x.id}>
                    <td>{x.full_name}</td>
                    <td>{x.phone}</td>
                    <td>{x.lead_items?.length || 0}</td>
                    <td>{new Date(x.created_at).toLocaleString("pt-BR")}</td>
                    <td>{x.status}</td>
                    <td>{x.source}</td>
                    <td>
                      <Link href={"/admin/leads/" + x.id}>Detalhes</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!r.data?.rows.length && <p>Nenhum interessado encontrado.</p>}
          </div>
          <nav className="c-pagination">
            <button
              disabled={page === 1}
              onClick={() => filter("page", String(page - 1))}
            >
              Anterior
            </button>
            <span>
              Página {page} · {r.data?.total} registros
            </span>
            <button
              disabled={page * 25 >= (r.data?.total || 0)}
              onClick={() => filter("page", String(page + 1))}
            >
              Próxima
            </button>
          </nav>
        </>
      )}
    </>
  );
}
export function LeadDetail({ id }: { id: string }) {
  const r = useLoad(() => leadDetail(id), [id]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [success, setSuccess] = useState("");
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      data = new FormData(form);
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await updateLead(
        id,
        String(data.get("status")),
        String(data.get("note")),
      );
      form.reset();
      r.reload();
      setSuccess("Atendimento atualizado.");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  if (r.loading) return <Loading />;
  if (r.error) return <LoadError error={r.error} retry={r.reload} />;
  const d = r.data!;
  return (
    <>
      <Link href="/admin/leads">← Interessados</Link>
      <h1>{d.lead.full_name}</h1>
      <p>Referência: {d.lead.id}</p>
      <p>
        {d.lead.phone} · {new Date(d.lead.created_at).toLocaleString("pt-BR")} ·{" "}
        {d.lead.source}
      </p>
      <a
        className="a-primary"
        href={"https://wa.me/" + d.lead.phone.replace(/\D/g, "")}
        target="_blank"
        rel="noopener noreferrer"
      >
        Abrir conversa com cliente
      </a>
      <section className="a-panel">
        <h2>Produtos solicitados</h2>
        {d.items.map((i) => (
          <article key={i.id}>
            <strong>{i.name_snapshot}</strong>
            <p>
              Código: {i.sku_snapshot} · Quantidade: {i.quantity} ·{" "}
              {i.price_snapshot === null
                ? "Preço sob consulta"
                : currency(i.price_snapshot)}
            </p>
            {i.product_id && (
              <Link href={"/admin/produtos/" + i.product_id}>
                Consultar cadastro atual
              </Link>
            )}
          </article>
        ))}
      </section>
      <form className="a-panel" onSubmit={save}>
        <Notice error={error} success={success} />
        <Field label="Situação">
          <select name="status" defaultValue={d.lead.status}>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Nova anotação">
          <textarea name="note" maxLength={4000} />
        </Field>
        <button className="a-primary" disabled={busy}>
          {busy ? "Salvando…" : "Salvar atendimento"}
        </button>
      </form>
      <section className="a-panel">
        <h2>Histórico</h2>
        {d.events.map((e) => (
          <article key={e.id}>
            <strong>{e.event_type}</strong>
            <p>{e.note}</p>
            <small>
              {new Date(e.created_at).toLocaleString("pt-BR")} ·{" "}
              {e.actor_user_id ? "Administrador " + e.actor_user_id : "Sistema"}
            </small>
          </article>
        ))}
      </section>
    </>
  );
}
