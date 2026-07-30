import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LayoutDashboard, SlidersHorizontal, Brain, Fuel, Radio, LogOut, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyRole } from "@/lib/fidelidade.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardShell,
});

function DashboardShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchRole = useServerFn(getMyRole);
  const { data: role } = useQuery({ queryKey: ["my-role"], queryFn: () => fetchRole() });

  const items = [
    { to: "/dashboard", label: "Visão Geral", icon: LayoutDashboard },
    { to: "/dashboard/monitor", label: "Monitor de Pista", icon: Radio },
    { to: "/dashboard/regras", label: "Tiers e Regras", icon: SlidersHorizontal },
    { to: "/dashboard/clientes", label: "Inteligência de Clientes", icon: Brain },
  ] as const;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Fuel className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none">FuelRewards</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider opacity-60">Painel do Gestor</p>
          </div>
        </div>

        <nav className="mt-2 px-3">
          <ul className="space-y-1">
            {items.map((it) => {
              const active = pathname === it.to;
              const Icon = it.icon;
              return (
                <li key={it.to}>
                  <Link
                    to={it.to}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto space-y-1 px-3 pb-5">
          <Link
            to="/app"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent"
          >
            <Smartphone className="h-4 w-4" />
            App do Motorista
          </Link>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
          <p className="px-3 pt-2 text-xs opacity-60">
            {role?.isGestor ? "Perfil: Gestor" : "Perfil: Motorista"}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-6 backdrop-blur">
          <div className="flex items-center gap-2 md:hidden">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <Fuel className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold">FuelRewards</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-accent md:hidden"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-accent text-sm font-semibold">
              {role?.isGestor ? "GE" : "MO"}
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
