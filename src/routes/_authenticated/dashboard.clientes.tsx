import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search, Brain } from "lucide-react";
import { getManagerData } from "@/lib/fidelidade.functions";
import { maskCpf } from "@/lib/tiers";
import { LoadingState, RestrictedState } from "./dashboard.index";

export const Route = createFileRoute("/_authenticated/dashboard/clientes")({
  component: Clientes,
});

function Clientes() {
  const fetchManager = useServerFn(getManagerData);
  const { data, isLoading, error } = useQuery({
    queryKey: ["manager-data"],
    queryFn: () => fetchManager(),
  });
  const [term, setTerm] = useState("");

  if (isLoading) return <LoadingState />;
  if (error || !data) return <RestrictedState />;

  const q = term.trim().toLowerCase().slice(0, 60);
  const rows = data.customers.filter(
    (c) => !q || c.name.toLowerCase().includes(q) || (c.cpf ?? "").includes(q),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inteligência de Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Base de motoristas cadastrados, volume no mês e nível de fidelidade
          </p>
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-card">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={term}
            maxLength={60}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar cliente ou CPF"
            className="w-56 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </label>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card">
        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            Nenhum cliente encontrado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left font-semibold">Cliente</th>
                  <th className="px-5 py-3 text-left font-semibold">CPF</th>
                  <th className="px-5 py-3 text-right font-semibold">Volume no mês</th>
                  <th className="px-5 py-3 text-left font-semibold">Nível</th>
                  <th className="px-5 py-3 text-left font-semibold">Última visita</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3 font-medium">{c.name}</td>
                    <td className="px-5 py-3 tabular-nums text-muted-foreground">{maskCpf(c.cpf)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{c.volume.toFixed(0)} L</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                        {c.tier}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString("pt-BR") : "Nunca abasteceu"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-card">
        <Brain className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        Clientes sem abastecimento nos últimos 30 dias entram no indicador de risco de churn da
        visão geral.
      </div>
    </div>
  );
}
