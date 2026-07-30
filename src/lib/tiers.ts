export type TierRow = {
  id: string;
  name: string;
  min_liters: number;
  max_liters: number;
  discount_per_liter: number;
  color: string;
  sort_order: number;
};

export function resolveTier(tiers: TierRow[], volume: number) {
  if (!tiers || tiers.length === 0) {
    return { tiers: [], current: null, next: null, isMax: true };
  }

  const sorted = [...tiers].sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
  const safeVolume = Math.max(0, Number(volume) || 0);

  let current = sorted[0];
  for (const t of sorted) {
    if (safeVolume >= Number(t.min_liters)) {
      current = t;
    }
  }

  const currentIdx = sorted.findIndex((t) => t.id === current.id);
  const next = sorted[Math.min(sorted.length - 1, currentIdx + 1)] ?? current;
  const isMax = currentIdx === sorted.length - 1;

  return {
    tiers: sorted,
    current,
    next,
    isMax,
  };
}

export function formatBRL(n: number | null | undefined) {
  const val = Number(n ?? 0);
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function maskCpf(cpf?: string | null) {
  if (!cpf || cpf.trim().length === 0) return "Não cadastrado";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length < 11) return cpf;
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
}

