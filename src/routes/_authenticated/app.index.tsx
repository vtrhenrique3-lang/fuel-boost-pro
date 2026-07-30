import { useState, useEffect, useRef } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bell,
  Fuel,
  Zap,
  TrendingUp,
  Loader2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Gift,
  Percent,
  Tag,
} from "lucide-react";
import { getDriverData } from "@/lib/fidelidade.functions";
import { formatBRL } from "@/lib/tiers";

export const Route = createFileRoute("/_authenticated/app/")({
  component: HomeScreen,
});

interface BannerItem {
  id: string;
  tag: string;
  title: string;
  description: string;
  badge: string;
  gradient: string;
  icon: React.ReactNode;
  actionText: string;
}

const BANNERS: BannerItem[] = [
  {
    id: "quinta-tanque",
    tag: "PROMOÇÃO DA SEMANA",
    title: "Quinta do Tanque Cheio",
    description: "Ganhe +R$ 0,10/L de bônus automático em abastecimentos acima de 40L nesta quinta!",
    badge: "+R$ 0,10/L",
    gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #2563eb 100%)",
    icon: <Sparkles className="h-4 w-4 text-amber-400" />,
    actionText: "Usar Desconto",
  },
  {
    id: "indique-ganhe",
    tag: "BÔNUS DE INDICAÇÃO",
    title: "Indique e Ganhe 50L",
    description: "Cada amigo indicado que fizer o 1º abastecimento gera 50 Litros bônus para o seu nível do mês.",
    badge: "+50 Litros",
    gradient: "linear-gradient(135deg, #312e81 0%, #4c1d95 50%, #831843 100%)",
    icon: <Gift className="h-4 w-4 text-pink-400" />,
    actionText: "Indicar Amigo",
  },
  {
    id: "conveniencia",
    tag: "PARCEIRO CONVENIÊNCIA",
    title: "Café & Lanche Grátis",
    description: "Níveis Ouro e Diamante ganham 1 café duplo e pão de queijo nas paradas credenciadas.",
    badge: "GRÁTIS",
    gradient: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #0d9488 100%)",
    icon: <Percent className="h-4 w-4 text-emerald-300" />,
    actionText: "Ver Conveniências",
  },
  {
    id: "manutencao",
    tag: "REDE CREDENCIADA",
    title: "Troca de Óleo & Pneus",
    description: "Até 15% OFF + parcelamento em 6x na rede parceira de manutenção automotiva.",
    badge: "15% OFF",
    gradient: "linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)",
    icon: <Tag className="h-4 w-4 text-amber-300" />,
    actionText: "Ver Parceiros",
  },
];

function PromoBanners({ onAction }: { onAction: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const card = container.children[currentIndex] as HTMLElement;
      if (card) {
        container.scrollTo({
          left: card.offsetLeft - container.offsetLeft,
          behavior: "smooth",
        });
      }
    }
  }, [currentIndex]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollPosition = container.scrollLeft;
    const width = container.clientWidth;
    if (width > 0) {
      const newIndex = Math.round(scrollPosition / width);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < BANNERS.length) {
        setCurrentIndex(newIndex);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Destaques e Vantagens
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + BANNERS.length) % BANNERS.length)}
            className="grid h-6 w-6 place-items-center rounded-full border border-border text-muted-foreground hover:bg-accent active:scale-95"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % BANNERS.length)}
            className="grid h-6 w-6 place-items-center rounded-full border border-border text-muted-foreground hover:bg-accent active:scale-95"
            aria-label="Próximo"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="flex snap-x snap-mandatory overflow-x-auto scrollbar-none rounded-2xl gap-3"
        style={{ scrollbarWidth: "none" }}
      >
        {BANNERS.map((banner) => (
          <div
            key={banner.id}
            className="relative min-w-full snap-center overflow-hidden rounded-2xl p-4 text-white shadow-md flex flex-col justify-between min-h-[145px]"
            style={{ background: banner.gradient }}
          >
            {/* Ambient blur accents */}
            <div className="absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="absolute right-2 top-2 h-16 w-16 rounded-full bg-white/5 pointer-events-none" />

            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide backdrop-blur border border-white/20">
                {banner.icon}
                <span>{banner.tag}</span>
              </div>
              <span className="rounded-xl bg-white/25 px-2.5 py-1 text-xs font-extrabold tracking-tight text-white backdrop-blur shadow-sm">
                {banner.badge}
              </span>
            </div>

            <div className="mt-2">
              <h4 className="text-base font-bold tracking-tight text-white">{banner.title}</h4>
              <p className="mt-0.5 text-xs text-white/85 leading-relaxed">
                {banner.description}
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/15">
              <span className="text-[11px] font-medium text-white/75">Válido no Fuel Boost Pro</span>
              <button
                onClick={onAction}
                className="flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow transition hover:bg-white/90 active:scale-95"
              >
                <span>{banner.actionText}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Dots */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {BANNERS.map((banner, idx) => (
          <button
            key={banner.id}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
            aria-label={`Ir para banner ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

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
  const hasCpf = Boolean(profile.cpf && profile.cpf.trim().length > 0);

  return (
    <div className="flex flex-col gap-5 px-5 pt-6 pb-28">
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
        <Link
          to="/app/perfil"
          className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-accent"
        >
          <Bell className="h-5 w-5" />
        </Link>
      </div>

      {!hasCpf && (
        <Link
          to="/app/perfil"
          className="flex items-center justify-between gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-xs text-warning-foreground transition hover:bg-warning/15"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-warning" />
            <span>Cadastre seu <b>CPF</b> para liberar desconto na bomba</span>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0" />
        </Link>
      )}

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

      <PromoBanners onAction={() => navigate({ to: "/app/token" })} />

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

