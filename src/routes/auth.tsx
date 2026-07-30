import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Fuel, Loader2, Mail, Lock, User } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Entrar · FuelRewards" },
      {
        name: "description",
        content: "Acesse sua conta FuelRewards para usar o desconto na bomba ou o painel do gestor.",
      },
      { property: "og:title", content: "Entrar · FuelRewards" },
      { property: "og:description", content: "Acesse sua conta FuelRewards com e-mail ou Google." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(8, "Mínimo de 8 caracteres").max(72),
  fullName: z.string().trim().max(80).optional(),
});

function safePath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const destination = safePath(search.redirect) ?? "/app";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: destination, replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        navigate({ to: destination, replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [destination, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const parsed = credentials.safeParse({ email, password, fullName });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: parsed.data.fullName ?? "" },
          },
        });
        if (signUpError) throw signUpError;
        setNotice("Conta criada! Verifique seu e-mail para confirmar o acesso.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível continuar.");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setError(null);
    try {
      const redirectUrl = `${window.location.origin}/auth`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        // Fallback: tenta sem a subrota no redirectTo caso apenas a raiz esteja permitida no Supabase
        const { error: err2 } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (err2) throw err2;
      }
    } catch (err: any) {
      console.error("[Google Auth Error]", err);
      const msg = err?.message || String(err);
      if (msg.includes("redirect") || msg.includes("not allowed") || err?.status === 400) {
        setError(
          `Adicione a URL ${window.location.origin} no Supabase (Authentication -> URL Configuration -> Redirect URLs).`
        );
      } else if (msg.includes("provider")) {
        setError("Ative o provedor Google no Supabase (Authentication -> Providers -> Google).");
      } else {
        setError("Não foi possível entrar com o Google. Use o login com e-mail acima.");
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-5 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-card">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Fuel className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">FuelRewards</p>
            <p className="text-xs text-muted-foreground">
              {mode === "login" ? "Entre para continuar" : "Crie sua conta grátis"}
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-7 space-y-3">
          {mode === "signup" && (
            <Field
              icon={<User className="h-4 w-4" />}
              placeholder="Nome completo"
              value={fullName}
              onChange={setFullName}
              autoComplete="name"
              maxLength={80}
            />
          )}
          <Field
            icon={<Mail className="h-4 w-4" />}
            placeholder="seu@email.com"
            value={email}
            onChange={setEmail}
            type="email"
            autoComplete="email"
            maxLength={255}
          />
          <Field
            icon={<Lock className="h-4 w-4" />}
            placeholder="Senha (mín. 8 caracteres)"
            value={password}
            onChange={setPassword}
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            maxLength={72}
          />

          {error && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
          {notice && (
            <p className="rounded-xl bg-success/10 px-3 py-2 text-sm text-success">{notice}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
        </div>

        <button
          onClick={onGoogle}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background px-5 py-3.5 text-sm font-semibold transition hover:bg-accent"
        >
          <GoogleMark />
          Continuar com Google
        </button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? "Ainda não tem conta?" : "Já tem uma conta?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
              setNotice(null);
            }}
            className="font-semibold text-primary"
          >
            {mode === "login" ? "Cadastre-se" : "Entrar"}
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({
  icon,
  value,
  onChange,
  ...rest
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3">
      <span className="text-muted-foreground">{icon}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.3 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.5 7l7.1 5.5c4.2-3.9 6.6-9.6 6.6-17z" />
      <path fill="#FBBC05" d="M10.4 28.7a14.5 14.5 0 0 1 0-9.4l-7.8-6.1a24 24 0 0 0 0 21.6l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.1-5.5c-2 1.4-4.6 2.2-8.2 2.2-6.3 0-11.7-3.8-13.6-9.3l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}
