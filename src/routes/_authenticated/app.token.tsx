import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, ShieldCheck, Copy, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getDriverData, issueFuelToken } from "@/lib/fidelidade.functions";
import { formatBRL, maskCpf } from "@/lib/tiers";

export const Route = createFileRoute("/_authenticated/app/token")({
  component: TokenScreen,
});

function TokenScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchDriver = useServerFn(getDriverData);
  const createToken = useServerFn(issueFuelToken);
  const [now, setNow] = useState(() => Date.now());

  const { data, isLoading } = useQuery({
    queryKey: ["driver-data"],
    queryFn: () => fetchDriver(),
  });

  const mutation = useMutation({
    mutationFn: () => createToken(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-data"] });
      toast.success("Novo código gerado com sucesso!");
    },
  });

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const token = mutation.data ?? data.lastToken;
  const expiresAt = token ? new Date(token.expires_at).getTime() : 0;
  const remaining = token ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : 0;
  const expired = !token || remaining <= 0;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const pct = Math.min(100, (remaining / 120) * 100);
  const display = token ? `${token.code.slice(0, 3)} ${token.code.slice(3)}` : "— — —";
  const hasCpf = Boolean(data.profile.cpf && data.profile.cpf.trim().length > 0);

  function copyCode() {
    if (!token) return;
    navigator.clipboard?.writeText(token.code);
    toast.success("Código copiado para a área de transferência!");
  }

  return (
    <div className="flex min-h-screen flex-col px-5 pt-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/app" })}
          className="grid h-10 w-10 place-items-center rounded-xl border border-border"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold">Token de Abastecimento</span>
        <div className="w-10" />
      </div>

      <div className="mt-8 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
          <ShieldCheck className="h-3.5 w-3.5" />
          Código seguro e único
        </div>

        <p className="mt-6 text-sm text-muted-foreground">Seu código dinâmico</p>
        <div
          className={`mt-3 select-all font-mono text-6xl font-black tracking-[0.1em] tabular-nums ${
            expired ? "text-muted-foreground line-through" : "text-foreground"
          }`}
        >
          {display}
        </div>

        {token && (
          <button
            onClick={copyCode}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition"
          >
            <Copy className="h-3.5 w-3.5" /> Copiar código
          </button>
        )}

        <div className="mt-8 flex w-full flex-col items-center gap-3">
          <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${expired ? "bg-destructive" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p
            className={`font-mono text-sm font-semibold tabular-nums ${
              expired ? "text-destructive" : "text-foreground"
            }`}
          >
            {expired ? "Nenhum código válido" : `Expira em ${mm}:${ss}`}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Instruções</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Informe ao frentista o seu <b className="text-foreground">CPF</b> e este{" "}
          <b className="text-foreground">código de 6 dígitos</b> antes de iniciar o abastecimento. O
          desconto será aplicado direto na bomba.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-muted/60 p-3">
          <div>
            <p className="text-xs text-muted-foreground">CPF</p>
            <p className="font-mono text-sm font-semibold flex items-center gap-1">
              {maskCpf(data.profile.cpf)}
              {!hasCpf && (
                <Link to="/app/perfil" className="text-xs text-primary underline ml-1">
                  (Cadastrar)
                </Link>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Desconto</p>
            <p className="text-sm font-semibold text-primary">
              {formatBRL(Number(data.current?.discount_per_liter ?? 0))}/L
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="mt-auto mb-28 flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-semibold disabled:opacity-60 hover:bg-accent transition"
      >
        {mutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {expired ? "Gerar novo código" : "Renovar código"}
      </button>
    </div>
  );
}
