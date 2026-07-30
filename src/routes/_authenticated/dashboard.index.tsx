import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Fuel,
  Percent,
  UserPlus,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { getManagerData } from "@/lib/fidelidade.functions";
import { formatBRL, maskCpf } from "@/lib/tiers";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: Overview,
});

function Overview() {
  const fetchManager = useServerFn(getManagerData);
  const { data, isLoading, error } = useQuery({
    queryKey: ["manager-data"],
    queryFn: () => fetchManager(),
  });

  if (isLoading) return <LoadingState />;
  if (error || !data) return <RestrictedState />;

  const { metrics, series, transactions, tiers } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inteligência de Vendas</h1>
          <p className="text-sm text-muted-foreground">
            Performance do programa de fidelidade · dados reais da operação
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium shadow-card">
          <Calendar className="h-4 w-4" />
          Últimos 30 dias
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Volume Abastecido (Galonagem)"
          value={`${metrics.volumeMonth.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} L`}
          icon={<Fuel className="h-4 w-4" />}
          hint="no mês corrente"
        />
        <Kpi
          label="Descontos Concedidos"
          value={formatBRL(metrics.discountsGranted)}
          icon={<Percent className="h-4 w-4" />}
          hint="aplicados na bomba"
        />
        <Kpi
          label="Novos Clientes no App"
          value={metrics.newCustomers.toLocaleString("pt-BR")}
          icon={<UserPlus className="h-4 w-4" />}
          hint={`${metrics.totalCustomers} cadastrados no total`}
        />
        <Kpi
          label="Risco de Churn"
          value={`${metrics.churnRisk}%`}
          icon={<AlertTriangle className="h-4 w-4" />}
          hint="sem abastecer há 30+ dias"
          danger
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Galonagem Diária vs. Descontos Aplicados</p>
            <p className="text-xs text-muted-foreground">
              Litros abastecidos e desconto pago (R$) por dia
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Legenda color="var(--primary)" label="Volume (L)" />
            <Legenda color="oklch(0.55 0.18 250)" label="Descontos (R$)" />
          </div>
        </div>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) =>
                  name === "Descontos (R$)"
                    ? [formatBRL(value), name]
                    : [`${value.toLocaleString("pt-BR")} L`, name]
                }
              />
              <Legend wrapperStyle={{ display: "none" }} />
              <Bar yAxisId="left" dataKey="liters" name="Volume (L)" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={18} />
              <Line yAxisId="right" type="monotone" dataKey="discount" name="Descontos (R$)" stroke="oklch(0.55 0.18 250)" strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Motor de Gamificação · Tiers Ativos</p>
            <p className="text-xs text-muted-foreground">Regra vigente aplicada na bomba</p>
          </div>
          <Link
            to="/dashboard/regras"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:opacity-90"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Ajustar Regras
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((t, i) => (
            <div
              key={t.id}
              className="rounded-xl border border-border p-4"
              style={{ background: `color-mix(in oklab, var(--${t.color}) 8%, var(--card))` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nível {i + 1}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                  style={{ background: `var(--${t.color})` }}
                >
                  {t.name}
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Faixa de volume</p>
              <p className="text-sm font-semibold">
                {Number(t.min_liters)}L – {Number(t.max_liters) > 9999 ? "∞" : `${Number(t.max_liters)}L`}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Desconto na bomba</p>
              <p className="text-2xl font-bold tabular-nums">
                {formatBRL(Number(t.discount_per_liter))}
                <span className="text-xs font-medium text-muted-foreground">/L</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-sm font-semibold">Transações Recentes</p>
            <p className="text-xs text-muted-foreground">Abastecimentos registrados na rede</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Live
          </span>
        </div>
        {transactions.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            Nenhum abastecimento registrado ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-left font-semibold">Data/Hora</th>
                  <th className="px-5 py-3 text-left font-semibold">Cliente</th>
                  <th className="px-5 py-3 text-left font-semibold">Combustível</th>
                  <th className="px-5 py-3 text-right font-semibold">Volume</th>
                  <th className="px-5 py-3 text-right font-semibold">Desconto</th>
                  <th className="px-5 py-3 text-right font-semibold">Valor Final</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3">
                      {tx.status === "ok" ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-muted-foreground">
                      {new Date(tx.time).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-5 py-3 font-medium tabular-nums">{maskCpf(tx.cpf)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{tx.fuel}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{tx.liters.toFixed(1)} L</td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-primary">
                      {formatBRL(tx.discount)}
                    </td>
                    <td className="px-5 py-3 text-right font-bold tabular-nums">{formatBRL(tx.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex h-72 items-center justify-center text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}

export function RestrictedState() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-card">
      <ShieldAlert className="mx-auto h-8 w-8 text-destructive" />
      <h2 className="mt-3 text-lg font-semibold">Acesso restrito</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Esta área é exclusiva para gestores do posto. Peça a um administrador para liberar seu acesso.
      </p>
      <Link
        to="/app"
        className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Ir para o app do motorista
      </Link>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  hint,
  danger,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  hint: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">{label}</span>
        <span className={danger ? "text-destructive" : "text-primary"}>{icon}</span>
      </div>
      <p className={`mt-3 text-2xl font-bold tabular-nums ${danger ? "text-destructive" : ""}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Legenda({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}
