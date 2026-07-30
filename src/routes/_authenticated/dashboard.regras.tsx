import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { SlidersHorizontal, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getManagerData, updateTier } from "@/lib/fidelidade.functions";
import { formatBRL } from "@/lib/tiers";
import { LoadingState, RestrictedState } from "./dashboard.index";

export const Route = createFileRoute("/_authenticated/dashboard/regras")({
  component: Regras,
});

function Regras() {
  const fetchManager = useServerFn(getManagerData);
  const saveTier = useServerFn(updateTier);
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["manager-data"],
    queryFn: () => fetchManager(),
  });
  const [draft, setDraft] = useState<Record<string, { min: string; max: string; disc: string }>>({});

  const mutation = useMutation({
    mutationFn: (input: { id: string; min_liters: number; max_liters: number; discount_per_liter: number }) =>
      saveTier({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager-data"] });
      toast.success("Regra do nível atualizada com sucesso!");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar nível.");
    },
  });

  if (isLoading) return <LoadingState />;
  if (error || !data) return <RestrictedState />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tiers e Regras</h1>
        <p className="text-sm text-muted-foreground">
          Configure as faixas de volume e o desconto aplicado na bomba
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.tiers.map((t) => {
          const d = draft[t.id] ?? {
            min: String(Number(t.min_liters)),
            max: String(Number(t.max_liters)),
            disc: String(Number(t.discount_per_liter)),
          };
          const set = (patch: Partial<typeof d>) =>
            setDraft((prev) => ({ ...prev, [t.id]: { ...d, ...patch } }));

          return (
            <div key={t.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: `var(--${t.color})` }} />
                  <p className="font-semibold">{t.name}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  Desconto atual {formatBRL(Number(t.discount_per_liter))}/L
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <NumberField label="Mín. (L)" value={d.min} onChange={(v) => set({ min: v })} />
                <NumberField label="Máx. (L)" value={d.max} onChange={(v) => set({ max: v })} />
                <NumberField label="R$/L" step="0.01" value={d.disc} onChange={(v) => set({ disc: v })} />
              </div>

              <button
                onClick={() =>
                  mutation.mutate({
                    id: t.id,
                    min_liters: Number(d.min) || 0,
                    max_liters: Number(d.max) || 0,
                    discount_per_liter: Number(d.disc) || 0,
                  })
                }
                disabled={mutation.isPending}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar nível
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-card">
        <SlidersHorizontal className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        As alterações valem imediatamente para todos os motoristas e são aplicadas no cálculo do
        desconto na próxima transação.
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = "1",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type="number"
        step={step}
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:border-primary"
      />
    </label>
  );
}
