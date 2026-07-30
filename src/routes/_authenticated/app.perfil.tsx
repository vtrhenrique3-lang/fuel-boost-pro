import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { User, CreditCard, Phone, Save, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { getDriverData, updateDriverProfile } from "@/lib/fidelidade.functions";
import { maskCpf } from "@/lib/tiers";

export const Route = createFileRoute("/_authenticated/app/perfil")({
  component: ProfileScreen,
});

function ProfileScreen() {
  const queryClient = useQueryClient();
  const fetchDriver = useServerFn(getDriverData);
  const saveProfile = useServerFn(updateDriverProfile);

  const { data, isLoading } = useQuery({
    queryKey: ["driver-data"],
    queryFn: () => fetchDriver(),
  });

  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (data?.profile) {
      setFullName(data.profile.full_name || "");
      setCpf(data.profile.cpf || "");
      setPhone(data.profile.phone || "");
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => saveProfile({ data: { fullName, cpf, phone } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-data"] });
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar perfil");
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  function handleCpfChange(val: string) {
    const raw = val.replace(/\D/g, "").slice(0, 11);
    setCpf(raw);
  }

  function formatCpfDisplay(raw: string) {
    if (!raw) return "";
    return raw
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  return (
    <div className="px-5 pt-6">
      <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
      <p className="text-sm text-muted-foreground">
        Mantenha seus dados atualizados para a validação na bomba
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
        <label className="block">
          <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <User className="h-3.5 w-3.5" /> Nome completo
          </span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Seu nome completo"
            className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          />
        </label>

        <label className="block">
          <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <CreditCard className="h-3.5 w-3.5" /> CPF (obrigatório para desconto na bomba)
          </span>
          <input
            type="text"
            value={formatCpfDisplay(cpf)}
            onChange={(e) => handleCpfChange(e.target.value)}
            placeholder="000.000.000-00"
            maxLength={14}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 font-mono text-sm outline-none focus:border-primary"
          />
        </label>

        <label className="block">
          <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Phone className="h-3.5 w-3.5" /> Telefone / WhatsApp
          </span>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(00) 90000-0000"
            className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          />
        </label>

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-card disabled:opacity-60"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Perfil
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <b className="text-foreground">Segurança e Privacidade:</b> Seu CPF é utilizado exclusivamente para identificação segura do seu nível de desconto junto ao frentista do posto.
        </div>
      </div>
    </div>
  );
}
