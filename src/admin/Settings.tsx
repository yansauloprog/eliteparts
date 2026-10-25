import { useState, useEffect, type FormEvent } from "react";
import {
  getPublicSettings,
  savePublicSetting,
  publicFields,
} from "../services/settings";
import { message } from "../lib/supabase";
import {
  Field,
  Notice,
  useLoad,
  Loading,
  LoadError,
  useUnsaved,
} from "./shared";
export function Settings() {
  const result = useLoad(getPublicSettings),
    [values, setValues] = useState<Record<string, string>>({}),
    [baseline, setBaseline] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  useEffect(() => {
    if (result.data) {
      const value = Object.fromEntries(
        publicFields.map((f) => [
          f.key,
          String(
            result.data!.find((s) => s.key === f.key)?.value ?? f.fallback,
          ),
        ]),
      );
      setValues(value);
      setBaseline(JSON.stringify(value));
    }
  }, [result.data]);
  useUnsaved(!!baseline && JSON.stringify(values) !== baseline);
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      for (const f of publicFields)
        await savePublicSetting(f.key, values[f.key]);
      setBaseline(JSON.stringify(values));
      setSuccess(
        "Configuração salva. O rodapé usará este texto ao abrir o site.",
      );
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
          <p className="a-kicker">SITE PÚBLICO</p>
          <h1>Configurações</h1>
          <p>Edite os textos públicos disponíveis no site.</p>
        </div>
      </div>
      {result.loading ? (
        <Loading />
      ) : result.error ? (
        <LoadError error={result.error} retry={result.reload} />
      ) : (
        <form className="a-panel a-settings" onSubmit={save}>
          <Notice error={error} success={success} />
          {publicFields.map((f) => (
            <Field key={f.key} label={f.label}>
              <input
                required={f.key!=='whatsapp_number'}
                maxLength={f.max}
                value={values[f.key] ?? ""}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: e.target.value }))
                }
              />
            </Field>
          ))}
          <button className="a-primary" disabled={busy}>
            {busy ? "Salvando…" : "Salvar configurações"}
          </button>
        </form>
      )}
    </>
  );
}
