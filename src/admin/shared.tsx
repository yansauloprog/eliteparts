import { useEffect, useState, type ReactNode } from "react";
import { message } from "../lib/supabase";
export function Notice({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  return (
    <>
      {error && (
        <p className="a-notice a-error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="a-notice a-success" role="status">
          {success}
        </p>
      )}
    </>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="a-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function useLoad<T>(
  load: () => Promise<T>,
  dependencies: unknown[] = [],
) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    load()
      .then((value) => {
        if (alive) setData(value);
      })
      .catch((e) => {
        if (alive) setError(message(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [...dependencies, revision]);
  return { data, error, loading, reload: () => setRevision((n) => n + 1) };
}
export function Loading() {
  return (
    <p className="a-empty" role="status">
      Carregando…
    </p>
  );
}
export function LoadError({
  error,
  retry,
}: {
  error: string;
  retry: () => void;
}) {
  return (
    <div>
      <Notice error={error} />
      <button onClick={retry}>Tentar novamente</button>
    </div>
  );
}
export function useUnsaved(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const before = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const navigation = (e: Event) => {
      if (
        !window.confirm("Há alterações não salvas. Deseja sair e descartá-las?")
      )
        e.preventDefault();
    };
    const savedURL = location.href;
    const back = () => {
      if (
        location.href !== savedURL &&
        !window.confirm("Há alterações não salvas. Deseja sair e descartá-las?")
      ) {
        history.pushState(null, "", savedURL);
        window.dispatchEvent(new CustomEvent("elite:route-restored"));
      }
    };
    window.addEventListener("popstate", back, true);
    window.addEventListener("beforeunload", before);
    window.addEventListener("elite:before-navigation", navigation);
    return () => {
      window.removeEventListener("popstate", back, true);
      window.removeEventListener("beforeunload", before);
      window.removeEventListener("elite:before-navigation", navigation);
    };
  }, [dirty]);
}
