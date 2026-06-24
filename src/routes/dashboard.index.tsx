import { createFileRoute } from "@tanstack/react-router";
import { Fuel, Percent, UserPlus, Users, ArrowUpRight } from "lucide-react";
import { DASHBOARD_METRICS, VOLUME_BY_DAY, CUSTOMERS, formatBRL } from "@/lib/mock";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

function Overview() {
  const max = Math.max(...VOLUME_BY_DAY);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Visão geral</h1>
        <p className="text-sm text-muted-foreground">
          Performance do programa de fidelidade nos últimos 30 dias.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Volume abastecido (mês)"
          value={`${DASHBOARD_METRICS.volumeMonth.toLocaleString("pt-BR")} L`}
          delta="+12,4%"
          icon={<Fuel className="h-4 w-4" />}
        />
        <Metric
          label="Descontos concedidos"
          value={formatBRL(DASHBOARD_METRICS.discountsGranted)}
          delta="+8,1%"
          icon={<Percent className="h-4 w-4" />}
        />
        <Metric
          label="Novos clientes"
          value={DASHBOARD_METRICS.newCustomers.toLocaleString("pt-BR")}
          delta="+22%"
          icon={<UserPlus className="h-4 w-4" />}
        />
        <Metric
          label="Clientes ativos"
          value={DASHBOARD_METRICS.activeCustomers.toLocaleString("pt-BR")}
          delta="+4,3%"
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Volume diário (litros)</p>
              <p className="text-xs text-muted-foreground">Últimos 14 dias</p>
            </div>
            <span className="rounded-full bg-success/10 px-2 py-1 text-xs font-semibold text-success">
              +12,4%
            </span>
          </div>
          <div className="mt-6 flex h-48 items-end gap-2">
            {VOLUME_BY_DAY.map((v, i) => (
              <div key={i} className="group flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-primary/80 transition group-hover:bg-primary"
                  style={{ height: `${(v / max) * 100}%` }}
                  title={`${v}L`}
                />
                <span className="text-[10px] text-muted-foreground">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm font-semibold">Top clientes do mês</p>
          <ul className="mt-4 space-y-3">
            {CUSTOMERS.slice(0, 5)
              .sort((a, b) => b.volume - a.volume)
              .map((c) => (
                <li key={c.id} className="flex items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold">
                    {c.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.tier}</p>
                  </div>
                  <p className="text-sm font-bold tabular-nums">{c.volume}L</p>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: string;
  delta: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-foreground">
          {icon}
        </div>
        <span className="inline-flex items-center gap-0.5 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
          <ArrowUpRight className="h-3 w-3" />
          {delta}
        </span>
      </div>
      <p className="mt-4 text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
