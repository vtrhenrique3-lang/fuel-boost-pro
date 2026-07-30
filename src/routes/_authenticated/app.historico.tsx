import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Fuel, MapPin, Loader2 } from "lucide-react";
import { getDriverData } from "@/lib/fidelidade.functions";
import { formatBRL } from "@/lib/tiers";

export const Route = createFileRoute("/_authenticated/app/historico")({
  component: History,
});

function History() {
  const fetchDriver = useServerFn(getDriverData);
  const { data, isLoading } = useQuery({
    queryKey: ["driver-data"],
    queryFn: () => fetchDriver(),
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const history = data.history;
  const totalSaved = history.reduce((s, h) => s + h.saved, 0);
  const totalLiters = history.reduce((s, h) => s + h.liters, 0);

  return (
    <div className="px-5 pt-6">
      <h1 className="text-2xl font-bold tracking-tight">Histórico</h1>
      <p className="mt-1 text-sm text-muted-foreground">Seus abastecimentos com desconto</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs text-muted-foreground">Total economizado</p>
          <p className="mt-1 text-xl font-bold text-primary">{formatBRL(totalSaved)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total abastecido</p>
          <p className="mt-1 text-xl font-bold">{totalLiters.toFixed(1)}L</p>
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {history.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum abastecimento registrado ainda. Gere seu token e abasteça com desconto.
          </li>
        )}
        {history.map((h) => (
          <li key={h.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent">
              <Fuel className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{h.liters.toFixed(1)}L · {h.fuel}</p>
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {h.station} · {new Date(h.date).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-primary">-{formatBRL(h.saved)}</p>
              <p className="text-xs text-muted-foreground">{formatBRL(h.total)}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="h-28" />
    </div>
  );
}
