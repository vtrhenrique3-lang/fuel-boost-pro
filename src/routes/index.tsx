import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Smartphone, Monitor, Fuel, ShieldCheck, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FuelRewards — Fidelidade White-Label para Postos" },
      {
        name: "description",
        content: "Desconto imediato na bomba com gamificação por volume abastecido.",
      },
      { property: "og:title", content: "FuelRewards — Fidelidade White-Label para Postos" },
      {
        property: "og:description",
        content: "Desconto imediato na bomba com gamificação por volume abastecido.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Fuel className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">FuelRewards</span>
        </div>
        {signedIn ? (
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Abrir minha conta
          </Link>
        ) : (
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
          >
            <LogIn className="h-4 w-4" />
            Entrar
          </Link>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            Desconto direto na bomba · Sem cashback
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            Fidelidade que o motorista <span className="text-primary">sente no preço</span>.
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Plataforma white-label para postos de combustíveis. Gamificação por volume abastecido,
            desconto aplicado imediatamente e um token de segurança que evita fraudes na pista.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-success" />
            Contas protegidas com login por e-mail ou Google e dados isolados por usuário.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          <Link
            to={signedIn ? "/app" : "/auth"}
            search={signedIn ? undefined : { redirect: "/app" }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-float"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Smartphone className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-semibold">App do Motorista</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nível de fidelidade, desconto atual, token de pagamento e histórico.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-primary">
              {signedIn ? "Abrir app →" : "Entrar e abrir →"}
            </span>
          </Link>

          <Link
            to={signedIn ? "/dashboard" : "/auth"}
            search={signedIn ? undefined : { redirect: "/dashboard" }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-float"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-foreground text-background">
              <Monitor className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-semibold">Painel do Gestor</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Volume, descontos, risco de churn, regras de gamificação e base de clientes.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-primary">
              {signedIn ? "Abrir painel →" : "Entrar e abrir →"}
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
