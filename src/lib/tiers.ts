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
  const sorted = [...tiers].sort((a, b) => a.sort_order - b.sort_order);
  const idx = Math.max(
    0,
    sorted.findIndex((t) => volume >= t.min_liters && volume <= t.max_liters),
  );
  const current = sorted[idx] ?? sorted[0];
  const next = sorted[Math.min(sorted.length - 1, idx + 1)] ?? current;
  return {
    tiers: sorted,
    current,
    next,
    isMax: !!current && current.id === sorted[sorted.length - 1]?.id,
  };
}

export function formatBRL(n: number) {
  return (n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function maskCpf(cpf?: string | null) {
  if (!cpf) return "***.***.***-**";
  const digits = cpf.replace(/\D/g, "").padStart(11, "*");
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
}
