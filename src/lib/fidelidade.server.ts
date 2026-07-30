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

export async function updateProfileData(
  supabase: Client,
  userId: string,
  data: { fullName?: string; cpf?: string; phone?: string },
) {
  const updatePayload: Record<string, any> = {};
  if (data.fullName !== undefined) updatePayload.full_name = data.fullName.trim();
  if (data.cpf !== undefined) updatePayload.cpf = data.cpf.replace(/\D/g, "");
  if (data.phone !== undefined) updatePayload.phone = data.phone.trim();

  const { error } = await supabase.from("profiles").update(updatePayload).eq("id", userId);
  if (error) throw error;
  return { ok: true };
}

export async function validateTokenForPump(supabase: Client, codeOrCpf: string) {
  const cleanInput = codeOrCpf.trim();
  const digitsOnly = cleanInput.replace(/\D/g, "");

  const now = new Date().toISOString();

  let tokenQuery = supabase
    .from("fuel_tokens")
    .select("id, code, user_id, expires_at, used_at")
    .gt("expires_at", now)
    .is("used_at", null)
    .order("created_at", { ascending: false });

  if (digitsOnly.length === 6) {
    tokenQuery = tokenQuery.eq("code", digitsOnly);
  } else {
    // Buscar usuário por CPF primeiro
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("cpf", digitsOnly)
      .maybeSingle();

    if (!profile) throw new Error("Motorista não encontrado com este CPF.");
    tokenQuery = tokenQuery.eq("user_id", profile.id);
  }

  const { data: tokens, error } = await tokenQuery.limit(1);
  if (error) throw error;
  const token = tokens?.[0];
  if (!token) throw new Error("Nenhum token ativo ou válido encontrado para esta consulta.");

  // Buscar dados do motorista para calcular o nível e desconto
  const driverData = await buildDriverPayload(supabase, token.user_id);
  return {
    tokenId: token.id,
    code: token.code,
    userId: token.user_id,
    expiresAt: token.expires_at,
    driverName: driverData.profile.full_name || "Motorista",
    driverCpf: driverData.profile.cpf,
    tierName: driverData.current?.name ?? "Bronze",
    discountPerLiter: Number(driverData.current?.discount_per_liter ?? 0.05),
    volumeMonth: driverData.volumeMonth,
  };
}

export async function redeemTokenAndRecordFueling(
  supabase: Client,
  gestorUserId: string,
  params: {
    code: string;
    liters: number;
    fuelType: string;
    unitPrice: number;
    stationId?: string;
  },
) {
  await assertGestor(supabase, gestorUserId);

  const validated = await validateTokenForPump(supabase, params.code);
  const discountPerLiter = validated.discountPerLiter;
  const discountTotal = params.liters * discountPerLiter;
  const rawTotal = params.liters * params.unitPrice;
  const finalTotal = Math.max(0, rawTotal - discountTotal);

  // 1. Inserir abastecimento
  const { data: fueling, error: fuelingError } = await supabase
    .from("fuelings")
    .insert({
      user_id: validated.userId,
      station_id: params.stationId ?? null,
      fuel_type: params.fuelType,
      liters: params.liters,
      unit_price: params.unitPrice,
      discount_per_liter: discountPerLiter,
      discount_total: discountTotal,
      total: finalTotal,
      status: "ok",
    })
    .select()
    .single();

  if (fuelingError) throw fuelingError;

  // 2. Marcar token como utilizado
  await supabase
    .from("fuel_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", validated.tokenId);

  return {
    success: true,
    fuelingId: fueling.id,
    driverName: validated.driverName,
    tierName: validated.tierName,
    discountPerLiter,
    discountTotal,
    finalTotal,
  };
}

export async function toggleGestorRole(supabase: Client, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "gestor")
    .maybeSingle();

  if (data) {
    // Já é gestor, não fazemos nada (mantém permissão de demonstração)
    return { isGestor: true, action: "maintained" };
  } else {
    // Adicionar papel de gestor para facilitar testes/demonstração
    const { error } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: "gestor",
    });
    if (error) throw error;
    return { isGestor: true, action: "granted" };
  }
}

