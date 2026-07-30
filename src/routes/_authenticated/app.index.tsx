import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Fuel, Zap, TrendingUp, Loader2 } from "lucide-react";
import { getDriverData } from "@/lib/fidelidade.functions";
import { formatBRL } from "@/lib/tiers";

export const Route = createFileRoute("/_authenticated/app/")({
  component: HomeScreen,
});

function HomeScreen() {
  const navigate = useNavigate();
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

  const { profile, tiers, current, next, isMax, volumeMonth, savedMonth } = data;
  const litersToNext = Math.max(0, Number(next?.min_liters ?? 0) - volumeMonth);
  const span = Number(next?.min_liters ?? 1) - Number(current?.min_liters ?? 0) || 1;
  const progress = Math.min(
    100,
    Math.max(0, Math.round(((volumeMonth - Number(current?.min_liters ?? 0)) / span) * 100)),
  );
  const firstName = (profile.full_name || "Motorista").split(" ")[0];

  return (
    <div className="flex flex-col gap-5 px-5 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Fuel className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Olá,</p>
            <p className="truncate text-sm font-semibold">{firstName}</p>
          </div>
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground">
          <Bell className="h-5 w-5" />
        </button>
      </div>

      <div
        className="relative overflow-hidden rounded-3xl p-5 text-white shadow-float"
        style={{ background: "var(--gradient-tier-gold)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider opacity-90">Seu nível</p>
            <p className="mt-1 text-2xl font-bold">Nível {current?.name ?? "Bronze"}</p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 backdrop-blur" aria-hidden>
            <Zap className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-white/15 p-4 backdrop-blur">
          <p className="text-xs opacity-90">Seu desconto agora</p>
          <p className="mt-1 text-3xl font-black tracking-tight">
            {formatBRL(Number(current?.discount_per_liter ?? 0))}
            <span className="ml-1 text-base font-semibold opacity-90">/litro</span>
          </p>
        </div>

        {!isMax ? (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-medium">
              <span>
                Faltam <b>{litersToNext.toFixed(0)}L</b> para {next?.name}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-xs opacity-90">
              No próximo nível você ganha <b>{formatBRL(Number(next?.discount_per_liter ?? 0))}/L</b>
            </p>
          </div>
        ) : (
          <p className="mt-5 text-xs font-medium opacity-90">
            Você está no nível máximo. Continue abastecendo!
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Volume no mês" value={`${volumeMonth.toFixed(0)}L`} icon={<Fuel className="h-4 w-4" />} />
        <StatCard
          label="Economizado"
          value={formatBRL(savedMonth)}
          icon={<TrendingUp className="h-4 w-4" />}
          accent
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Próximos níveis</p>
        <ul className="mt-3 space-y-2">
          {tiers.map((t) => {
            const isCurrent = t.id === current?.id;
            return (
              <li
                key={t.id}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                  isCurrent ? "bg-accent" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `var(--${t.color})` }} />
                  <span className="font-medium">{t.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {Number(t.min_liters)}–{Number(t.max_liters) > 9999 ? "∞" : Number(t.max_liters)}L
                  </span>
                </div>
                <span className="font-semibold text-primary">
                  {formatBRL(Number(t.discount_per_liter))}/L
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="fixed inset-x-0 bottom-20 z-20 mx-auto max-w-md px-5">
        <button
          onClick={() => navigate({ to: "/app/token" })}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground shadow-float active:scale-[0.99]"
        >
          <Zap className="h-5 w-5" />
          Abastecer com desconto
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        accent ? "border-primary/20 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-lg font-bold tracking-tight">{value}</p>
    </div>
  );
}
