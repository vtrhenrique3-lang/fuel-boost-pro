import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveTier, type TierRow } from "./tiers";

type Client = SupabaseClient<any, any, any>;

export function generateTokenCode() {
  return String(Math.floor(100_000 + Math.random() * 900_000));
}

export async function assertGestor(supabase: Client, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "gestor")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Acesso restrito a gestores.");
}

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

export async function buildDriverPayload(supabase: Client, userId: string) {
  const [profileRes, tiersRes, fuelingsRes, tokenRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, cpf, phone").eq("id", userId).maybeSingle(),
    supabase.from("tiers").select("*").order("sort_order"),
    supabase
      .from("fuelings")
      .select("id, liters, discount_total, total, fuel_type, created_at, station_id, stations(name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("fuel_tokens")
      .select("id, code, expires_at, used_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (tiersRes.error) throw tiersRes.error;
  if (fuelingsRes.error) throw fuelingsRes.error;

  const tiers = (tiersRes.data ?? []) as TierRow[];
  const fuelings = (fuelingsRes.data ?? []) as any[];
  const monthStart = startOfMonth();
  const monthFuelings = fuelings.filter((f) => f.created_at >= monthStart);
  const volumeMonth = monthFuelings.reduce((s, f) => s + Number(f.liters ?? 0), 0);
  const savedMonth = monthFuelings.reduce((s, f) => s + Number(f.discount_total ?? 0), 0);
  const savedTotal = fuelings.reduce((s, f) => s + Number(f.discount_total ?? 0), 0);

  return {
    profile: profileRes.data ?? { id: userId, full_name: "", cpf: null, phone: null },
    ...resolveTier(tiers, volumeMonth),
    volumeMonth,
    savedMonth,
    savedTotal,
    lastToken: tokenRes.data ?? null,
    history: fuelings.map((f) => ({
      id: f.id,
      liters: Number(f.liters ?? 0),
      saved: Number(f.discount_total ?? 0),
      total: Number(f.total ?? 0),
      fuel: f.fuel_type as string,
      date: f.created_at as string,
      station: f.stations?.name ?? "Posto",
    })),
  };
}

export async function buildManagerPayload(supabase: Client) {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const monthStart = startOfMonth();

  const [tiersRes, fuelingsRes, profilesRes] = await Promise.all([
    supabase.from("tiers").select("*").order("sort_order"),
    supabase
      .from("fuelings")
      .select(
        "id, user_id, liters, discount_total, total, fuel_type, status, created_at, stations(name), profiles:user_id(full_name, cpf)",
      )
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase.from("profiles").select("id, full_name, cpf, created_at"),
  ]);

  if (tiersRes.error) throw tiersRes.error;
  if (fuelingsRes.error) throw fuelingsRes.error;
  if (profilesRes.error) throw profilesRes.error;

  const tiers = (tiersRes.data ?? []) as TierRow[];
  const fuelings = (fuelingsRes.data ?? []) as any[];
  const profiles = (profilesRes.data ?? []) as any[];

  const monthFuelings = fuelings.filter((f) => f.created_at >= monthStart);
  const volumeMonth = monthFuelings.reduce((s, f) => s + Number(f.liters ?? 0), 0);
  const discountsGranted = monthFuelings.reduce((s, f) => s + Number(f.discount_total ?? 0), 0);
  const newCustomers = profiles.filter((p) => p.created_at >= monthStart).length;

  // Série diária dos últimos 30 dias
  const byDay = new Map<string, { liters: number; discount: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    byDay.set(d.toISOString().slice(0, 10), { liters: 0, discount: 0 });
  }
  for (const f of fuelings) {
    const key = String(f.created_at).slice(0, 10);
    const row = byDay.get(key);
    if (!row) continue;
    row.liters += Number(f.liters ?? 0);
    row.discount += Number(f.discount_total ?? 0);
  }
  const series = [...byDay.entries()].map(([key, v]) => ({
    day: `${key.slice(8, 10)}/${key.slice(5, 7)}`,
    liters: Math.round(v.liters),
    discount: Math.round(v.discount),
  }));

  // Clientes com volume no mês e risco de churn (sem abastecer há 30+ dias)
  const volumeByUser = new Map<string, number>();
  const lastVisit = new Map<string, string>();
  for (const f of fuelings) {
    if (f.created_at >= monthStart) {
      volumeByUser.set(f.user_id, (volumeByUser.get(f.user_id) ?? 0) + Number(f.liters ?? 0));
    }
    if (!lastVisit.has(f.user_id)) lastVisit.set(f.user_id, f.created_at);
  }

  const customers = profiles.map((p) => {
    const volume = volumeByUser.get(p.id) ?? 0;
    return {
      id: p.id,
      name: p.full_name || "Sem nome",
      cpf: p.cpf ?? null,
      volume,
      tier: resolveTier(tiers, volume).current?.name ?? "Bronze",
      lastVisit: lastVisit.get(p.id) ?? null,
    };
  });

  const churnCount = customers.filter((c) => !c.lastVisit).length;
  const churnRisk = customers.length ? Math.round((churnCount / customers.length) * 100) : 0;

  return {
    tiers,
    metrics: {
      volumeMonth,
      discountsGranted,
      newCustomers,
      churnRisk,
      totalCustomers: customers.length,
    },
    series,
    transactions: fuelings.slice(0, 12).map((f) => ({
      id: f.id,
      time: f.created_at as string,
      status: (f.status as string) ?? "ok",
      cpf: f.profiles?.cpf ?? null,
      name: f.profiles?.full_name ?? "Cliente",
      fuel: f.fuel_type as string,
      liters: Number(f.liters ?? 0),
      discount: Number(f.discount_total ?? 0),
      total: Number(f.total ?? 0),
      station: f.stations?.name ?? "Posto",
    })),
    customers: customers.sort((a, b) => b.volume - a.volume),
  };
}
