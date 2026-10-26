import { useEffect, useRef, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { BrandLogo } from "../components/BrandLogo";
import { Link, navigate, useRoute, routeURL } from "../lib/router";
import { supabase, message } from "../lib/supabase";
import {
  currentAdmin,
  isAdmin,
  recover,
  signIn,
  signOut,
  updatePassword,
} from "../services/auth";
import { Dashboard } from "./Dashboard";
import { Products } from "./Products";
import { ProductEditor } from "./ProductEditor";
import { Categories } from "./Categories";
import { Settings } from "./Settings";
import {Leads,LeadDetail} from './Leads';
import { Field, Loading, Notice } from "./shared";
import { Symbol } from "../components/ui/Symbol";
import "./admin.css";
import "./spatial-admin.css";
export default function AdminApp() {
  const path = routeURL(useRoute()).pathname;
  const [user, setUser] = useState<User | null>(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [drawer, setDrawer] = useState(false);
  const menu = useRef<HTMLButtonElement>(null),
    drawerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    document.title = "Administração | Elite Parts";
    let alive = true;
    const validate = () =>
      currentAdmin()
        .then((u) => {
          if (alive) {
            setUser(u);
            setError("");
          }
        })
        .catch((e) => {
          if (alive) {
            setUser(null);
            setError(message(e));
          }
        })
        .finally(() => {
          if (alive) setReady(true);
        });
    if (!supabase) {
      setError("Conexão não configurada. Confira as variáveis de ambiente.");
      setReady(true);
      return;
    }
    void validate();
    const { data } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => {
        if (alive) void validate();
      }, 0);
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    setDrawer(false);
  }, [path]);
  useEffect(() => {
    if (
      ready &&
      !user &&
      path != "/admin/login" &&
      path != "/admin/redefinir-senha" &&
      !error
    )
      navigate("/admin/login", true);
  }, [ready, user, path, error]);
  useEffect(() => {
    if (!drawer) return;
    const previous = document.activeElement as HTMLElement | null;
    drawerRef.current?.querySelector<HTMLElement>("a")?.focus();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer(false);
      if (e.key === "Tab") {
        const els = Array.from(
          drawerRef.current?.querySelectorAll<HTMLElement>("a,button") ?? [],
        );
        const first = els[0],
          last = els.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", key);
      (previous ?? menu.current)?.focus();
    };
  }, [drawer]);
  if (!ready)
    return (
      <div className="admin-root">
        <Loading />
      </div>
    );
  if (path === "/admin/redefinir-senha")
    return <Login reset onLogin={setUser} />;
  if (path === "/admin/login" && !isAdmin(user))
    return <Login onLogin={setUser} initialError={error} />;
  if (!isAdmin(user))
    return (
      <div className="admin-root a-login a-access-denied"><div className="a-login-box">
        <BrandLogo />
        <h1>Acesso negado</h1>
        <Notice
          error={error || "Sua conta não possui autorização administrativa."}
        />
        <button
          onClick={() =>
            void signOut()
              .then(() => navigate("/admin/login"))
              .catch((e) => setError(message(e)))
          }
        >
          Voltar ao login
        </button>
        <Link href="/">Voltar ao site</Link>
        </div>
      </div>
    );
  const title = path.includes("/produtos")
    ? "Produtos"
    : path.includes("/categorias")
      ? "Categorias"
      : path.includes("/configuracoes")
        ? "Configurações"
        : path.includes("/leads") ? "Interessados / CRM" : "Visão geral";
  async function logout() {
    try {
      await signOut();
      setUser(null);
      navigate("/admin/login", true);
    } catch (e) {
      setError(message(e));
    }
  }
  return (
    <div className="admin-root a-shell">
      {drawer && (
        <button
          className="a-overlay"
          aria-label="Fechar menu"
          onClick={() => setDrawer(false)}
        />
      )}
      <aside
        ref={drawerRef}
        className={`a-sidebar ${drawer ? "is-open" : ""}`}
        aria-label="Navegação administrativa"
        role={drawer ? "dialog" : undefined}
        aria-modal={drawer || undefined}
      >
        <BrandLogo />
        <p className="a-sidebar-caption">CATÁLOGO & ATENDIMENTO</p>
        <button className="a-drawer-close" onClick={() => setDrawer(false)}>
          Fechar menu ×
        </button>
        <span className="a-kicker">ADMINISTRAÇÃO</span>
        <nav>
          {([
            ["/admin", "Visão geral", "grid"],
            ["/admin/produtos", "Produtos", "box"],
            ["/admin/categorias", "Categorias", "layers"],
            ["/admin/leads", "Interessados", "people"],
            ["/admin/configuracoes", "Configurações", "settings"],
          ] as const).map(([href, label, icon]) => (
            <Link
              key={href}
              href={href}
              aria-current={
                (href === "/admin" ? path === href : path.startsWith(href))
                  ? "page"
                  : undefined
              }
            >
              <Symbol name={icon} /><span>{label}</span><Symbol name="arrow" />
            </Link>
          ))}
        </nav>
        <div className="a-sidebar-bottom">
          <Link href="/"><Symbol name="external" /> Ver site</Link>
          <div className="a-identity"><span className="a-avatar" aria-hidden="true">{user?.email?.slice(0,1).toUpperCase()}</span><div><strong>{user?.app_metadata?.eliteparts_role === 'owner' ? 'Proprietário' : 'Administrador'}</strong><small>{user?.email}</small></div></div>
          <button onClick={() => void logout()}><Symbol name="logout" /> Sair da conta</button>
        </div>
      </aside>
      <div className="a-workspace" inert={drawer || undefined}>
        <header className="a-header">
          <button
            ref={menu}
            className="a-menu"
            aria-expanded={drawer}
            aria-label="Abrir menu"
            onClick={() => setDrawer(true)}
          >
            <Symbol name="menu" />
          </button>
          <div className="a-header-breadcrumb"><small>Workspace / Administração</small><strong>{title}</strong></div>
          <Link className="a-header-site" href="/catalogo">Ver catálogo <Symbol name="external" /></Link>
        </header>
        <main className="a-main">
          <Notice error={error} />
          {path === "/admin" || path === "/admin/login" ? (
            <Dashboard />
          ) : path === "/admin/produtos" ? (
            <Products />
          ) : path === "/admin/produtos/novo" ? (
            <ProductEditor />
          ) : path.startsWith("/admin/produtos/") ? (
            <ProductEditor key={path} id={path.split("/")[3]} />
          ) : path === "/admin/categorias" ? (
            <Categories />
          ) : path === "/admin/configuracoes" ? (
            <Settings />
          ) : path === '/admin/leads' ? (
            <Leads />
          ) : path.startsWith('/admin/leads/') ? (
            <LeadDetail key={path} id={path.split('/')[3]} />
          ) : (
            <>
              <h1>Página não encontrada</h1>
              <Link href="/admin">Voltar ao painel</Link>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
function Login({
  reset = false,
  onLogin,
  initialError = "",
}: {
  reset?: boolean;
  onLogin: (user: User | null) => void;
  initialError?: string;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [repeat, setRepeat] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(initialError),
    [success, setSuccess] = useState(""),
    [recovery, setRecovery] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      if (reset) {
        if (password !== repeat) throw new Error("As senhas não coincidem.");
        await updatePassword(password);
        await signOut();
        onLogin(null);
        setSuccess("Senha atualizada. Entre novamente com sua nova senha.");
      } else if (recovery) {
        await recover(email);
        setSuccess(
          "Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.",
        );
      } else {
        const user = await signIn(email, password);
        onLogin(user);
        navigate("/admin", true);
      }
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-root a-login">
      <aside className="a-login-intro" aria-label="Elite Parts administração">
        <BrandLogo />
        <div><p className="a-kicker">ELITE PARTS / WORKSPACE</p><h2>Precisão em<br/>cada detalhe.</h2><p>Seu catálogo e seus atendimentos.<br/>Tudo no mesmo lugar.</p></div>
        <span><Symbol name="shield" /> Área exclusiva da equipe</span>
      </aside>
      <div className="a-login-box">
        <BrandLogo />
        <p className="a-kicker">PAINEL ADMINISTRATIVO</p>
        <h1>
          {reset
            ? "Nova senha"
            : recovery
              ? "Recuperar acesso"
              : "Acesse sua conta"}
        </h1>
        <p>
          {reset
            ? "Defina uma nova senha para sua conta."
            : "Gerencie o catálogo da Elite Parts."}
        </p>
        <Notice error={error} success={success} />
        <form onSubmit={submit}>
          {!reset && (
            <Field label="E-mail">
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
          )}
          {(!recovery || reset) && (
            <Field label={reset ? "Nova senha" : "Senha"}>
              <input
                type="password"
                autoComplete={reset ? "new-password" : "current-password"}
                required
                minLength={reset ? 8 : 1}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
          )}
          {reset && (
            <Field label="Confirmar nova senha">
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
              />
            </Field>
          )}
          <button className="a-primary" disabled={busy || !supabase}>
            {busy
              ? "Aguarde…"
              : reset
                ? "Salvar nova senha"
                : recovery
                  ? "Enviar instruções"
                  : "Entrar"}
          </button>
        </form>
        {reset ? (
          <Link href="/admin/login">Voltar ao login</Link>
        ) : (
          <button
            className="a-text-button"
            onClick={() => {
              setRecovery(!recovery);
              setError("");
              setSuccess("");
            }}
          >
            {recovery ? "Voltar ao login" : "Esqueci minha senha"}
          </button>
        )}
        <Link className="a-back" href="/">
          ← Voltar ao site
        </Link>
      </div>
    </div>
  );
}
