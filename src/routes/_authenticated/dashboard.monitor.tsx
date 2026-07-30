import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Fuel,
  Activity,
  Gauge,
  Timer,
  Search,
  CheckCircle2,
  Zap,
  Loader2,
  ShieldCheck,
  DollarSign,
  Droplet,
} from "lucide-react";
import { toast } from "sonner";
import { getManagerData, validateTokenCode, redeemTokenAndFuel } from "@/lib/fidelidade.functions";
import { formatBRL, maskCpf } from "@/lib/tiers";
import { LoadingState, RestrictedState } from "./dashboard.index";

export const Route = createFileRoute("/_authenticated/dashboard/monitor")({
  component: Monitor,
});

const PUMPS = [
  { id: 1, fuel: "Gasolina Aditivada", status: "abastecendo", liters: 28.4 },
  { id: 2, fuel: "Etanol", status: "livre", liters: 0 },
  { id: 3, fuel: "Diesel S10", status: "abastecendo", liters: 84.2 },
  { id: 4, fuel: "Gasolina Comum", status: "livre", liters: 0 },
  { id: 5, fuel: "Gasolina Aditivada", status: "abastecendo", liters: 12.1 },
  { id: 6, fuel: "Diesel S10", status: "manutenção", liters: 0 },
];

function Monitor() {
  const queryClient = useQueryClient();
  const fetchManager = useServerFn(getManagerData);
  const checkToken = useServerFn(validateTokenCode);
  const processFueling = useServerFn(redeemTokenAndFuel);

  const { data, isLoading, error } = useQuery({
    queryKey: ["manager-data"],
    queryFn: () => fetchManager(),
  });

  const [codeInput, setCodeInput] = useState("");
  const [tokenResult, setTokenResult] = useState<any | null>(null);

  // Form states for fueling
  const [fuelType, setFuelType] = useState("Gasolina Comum");
  const [unitPrice, setUnitPrice] = useState("5.89");
  const [liters, setLiters] = useState("30");

  const validateMutation = useMutation({
    mutationFn: (code: string) => checkToken({ data: { codeOrCpf: code } }),
    onSuccess: (res) => {
      setTokenResult(res);
      toast.success(`Token validado! Motorista: ${res.driverName} (${res.tierName})`);
    },
    onError: (err) => {
      setTokenResult(null);
      toast.error(err instanceof Error ? err.message : "Token inválido ou expirado.");
    },
  });

  const redeemMutation = useMutation({
    mutationFn: () =>
      processFueling({
        data: {
          code: tokenResult.code,
          liters: Number(liters),
          fuelType,
          unitPrice: Number(unitPrice),
        },
      }),
    onSuccess: (res) => {
      toast.success(
        `Abastecimento de ${formatBRL(res.finalTotal)} registrado! Desconto aplicado: ${formatBRL(res.discountTotal)}`,
      );
      setTokenResult(null);
      setCodeInput("");
      queryClient.invalidateQueries({ queryKey: ["manager-data"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Falha ao registrar abastecimento.");
    },
  });

  if (isLoading) return <LoadingState />;
  if (error || !data) return <RestrictedState />;

  const priceNum = Number(unitPrice) || 0;
  const litersNum = Number(liters) || 0;
  const discountPerL = tokenResult ? tokenResult.discountPerLiter : 0;
  const subtotal = priceNum * litersNum;
  const totalDiscount = litersNum * discountPerL;
  const finalPrice = Math.max(0, subtotal - totalDiscount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Terminal da Pista & Monitor POS</h1>
        <p className="text-sm text-muted-foreground">
          Valide o token do motorista, aplique o desconto automático e lance o abastecimento na bomba
        </p>
      </div>

      {/* TERMINAL DE VALIDAÇÃO E BAIXA DE TOKEN (POS) */}
      <div className="rounded-3xl border border-primary/20 bg-card p-6 shadow-card">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-float">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Validador de Desconto (Terminal Frentista)</h2>
              <p className="text-xs text-muted-foreground">
                Digite o token de 6 dígitos gerado no app ou o CPF do motorista
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" /> Sistema Antifraude Ativo
          </span>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* LADO ESQUERDO: BUSCA DO TOKEN */}
          <div className="lg:col-span-5 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Código de 6 dígitos ou CPF
              </span>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Ex: 849201 ou CPF"
                  maxLength={14}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 font-mono text-lg font-bold outline-none focus:border-primary"
                />
                <button
                  onClick={() => validateMutation.mutate(codeInput)}
                  disabled={validateMutation.isPending || !codeInput.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-50 shrink-0"
                >
                  {validateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Validar
                </button>
              </div>
            </label>

            {tokenResult && (
              <div className="rounded-2xl border border-success/30 bg-success/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-success">
                    <CheckCircle2 className="h-4 w-4" /> Token Ativo e Válido
                  </span>
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                    Nível {tokenResult.tierName}
                  </span>
                </div>
                <div className="text-sm font-semibold text-foreground pt-1">
                  {tokenResult.driverName}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>CPF: {maskCpf(tokenResult.driverCpf)}</span>
                  <span>Volume no mês: {tokenResult.volumeMonth} L</span>
                </div>
                <div className="pt-2 border-t border-success/20 flex items-center justify-between text-sm font-bold text-primary">
                  <span>Desconto garantido:</span>
                  <span className="text-base">{formatBRL(tokenResult.discountPerLiter)} / Litro</span>
                </div>
              </div>
            )}
          </div>

          {/* LADO DIREITO: FORMULÁRIO DE REGISTRO DO ABASTECIMENTO */}
          <div className="lg:col-span-7 rounded-2xl border border-border bg-muted/40 p-5 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Fuel className="h-4 w-4 text-primary" /> Registrar Abastecimento na Bomba
            </h3>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs text-muted-foreground">Combustível</span>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary"
                >
                  <option value="Gasolina Comum">Gasolina Comum</option>
                  <option value="Gasolina Aditivada">Gasolina Aditivada</option>
                  <option value="Etanol">Etanol</option>
                  <option value="Diesel S10">Diesel S10</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs text-muted-foreground">Preço Bomba (R$/L)</span>
                <input
                  type="number"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono font-bold outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="text-xs text-muted-foreground">Litros Abastecidos</span>
                <input
                  type="number"
                  step="0.1"
                  value={liters}
                  onChange={(e) => setLiters(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono font-bold outline-none focus:border-primary"
                />
              </label>
            </div>

            {/* RESUMO DE VALORES */}
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-card p-3.5 border border-border text-xs">
              <div>
                <span className="text-muted-foreground">Subtotal:</span>
                <p className="font-mono text-sm font-semibold">{formatBRL(subtotal)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Desconto Fidelidade:</span>
                <p className="font-mono text-sm font-bold text-primary">-{formatBRL(totalDiscount)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total Líquido:</span>
                <p className="font-mono text-base font-black text-foreground">{formatBRL(finalPrice)}</p>
              </div>
            </div>

            <button
              onClick={() => redeemMutation.mutate()}
              disabled={redeemMutation.isPending || !tokenResult || litersNum <= 0 || priceNum <= 0}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-float transition hover:opacity-90 disabled:opacity-40"
            >
              {redeemMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {tokenResult ? "Confirmar Abastecimento e Baixar Token" : "Valide um token para liberar o abastecimento"}
            </button>
          </div>
        </div>
      </div>

      {/* MONITOR DE STATUS DAS BOMBAS */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Bombas ativas" value="3 / 6" icon={<Gauge className="h-4 w-4" />} />
        <Stat label="Vazão média" value="42 L/min" icon={<Activity className="h-4 w-4" />} />
        <Stat label="Tempo médio" value="2m 18s" icon={<Timer className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PUMPS.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent">
                  <Fuel className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">Bomba {p.id}</p>
                  <p className="text-xs text-muted-foreground">{p.fuel}</p>
                </div>
              </div>
              <StatusPill status={p.status} />
            </div>
            <div className="mt-4 rounded-lg bg-muted/60 p-3">
              <p className="text-xs text-muted-foreground">Volume da sessão</p>
              <p className="text-xl font-bold tabular-nums">{p.liters.toFixed(1)} L</p>
            </div>
          </div>
        ))}
      </div>

      {/* TRANSAÇÕES REAIS RECENTES */}
      <div className="rounded-2xl border border-border bg-card shadow-card">
        <div className="border-b border-border px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Últimas Transações da Pista (Tempo Real)</p>
            <p className="text-xs text-muted-foreground">Abastecimentos baixados pelo terminal de pista</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Ao Vivo
          </span>
        </div>
        {data.transactions.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            Nenhuma transação registrada ainda neste posto. Use o terminal acima para realizar o primeiro teste.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {data.transactions.slice(0, 6).map((tx) => (
              <li key={tx.id} className="flex items-center justify-between px-5 py-3.5 text-sm hover:bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-success/10 text-success">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold">{tx.name} <span className="font-mono text-xs font-normal text-muted-foreground">({maskCpf(tx.cpf)})</span></p>
                    <p className="text-xs text-muted-foreground">{tx.fuel} · {new Date(tx.time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold tabular-nums">{tx.liters.toFixed(1)} L</p>
                  <p className="text-xs text-primary font-semibold tabular-nums">−{formatBRL(tx.discount)} ({formatBRL(tx.total)})</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent">{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold tabular-nums">{value}</p>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    abastecendo: "bg-success/10 text-success",
    livre: "bg-muted text-muted-foreground",
    "manutenção": "bg-warning/15 text-warning-foreground",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${map[status]}`}>
      {status}
    </span>
  );
}
