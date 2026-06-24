// Mock data shared by app + dashboard

export type Tier = {
  name: string;
  min: number;
  max: number;
  discount: number; // R$ per liter
  color: string;
};

export const TIERS: Tier[] = [
  { name: "Bronze", min: 0, max: 50, discount: 0.05, color: "tier-bronze" },
  { name: "Prata", min: 51, max: 150, discount: 0.08, color: "tier-silver" },
  { name: "Ouro", min: 151, max: 300, discount: 0.10, color: "tier-gold" },
  { name: "Diamante", min: 301, max: 9999, discount: 0.15, color: "tier-diamond" },
];

export const CURRENT_USER = {
  name: "Lucas",
  cpf: "***.456.789-**",
  volumeMonth: 165, // liters
};

export function tierFor(volume: number) {
  const idx = TIERS.findIndex((t) => volume >= t.min && volume <= t.max);
  const current = TIERS[Math.max(0, idx)];
  const next = TIERS[Math.min(TIERS.length - 1, idx + 1)] ?? current;
  return { current, next, isMax: current.name === TIERS[TIERS.length - 1].name };
}

export const HISTORY = [
  { id: "1", date: "12 Nov 2024", liters: 38.2, saved: 3.06, station: "Posto Centro" },
  { id: "2", date: "04 Nov 2024", liters: 42.5, saved: 3.40, station: "Posto Centro" },
  { id: "3", date: "27 Out 2024", liters: 35.0, saved: 2.80, station: "Posto Av. Brasil" },
  { id: "4", date: "18 Out 2024", liters: 49.3, saved: 3.94, station: "Posto Centro" },
  { id: "5", date: "09 Out 2024", liters: 28.1, saved: 1.40, station: "Posto Centro" },
];

// Dashboard mock
export const DASHBOARD_METRICS = {
  volumeMonth: 84_320, // liters
  discountsGranted: 7_896.40,
  newCustomers: 312,
  activeCustomers: 1_847,
};

export const VOLUME_BY_DAY = [
  2100, 2400, 1980, 2650, 3100, 3400, 2900,
  2750, 3050, 3300, 3650, 3200, 2800, 3100,
];

export const CUSTOMERS = [
  { id: "u1", name: "Lucas Almeida", cpf: "123.456.789-00", volume: 165, tier: "Ouro", lastVisit: "Hoje" },
  { id: "u2", name: "Mariana Costa", cpf: "987.654.321-00", volume: 312, tier: "Diamante", lastVisit: "Ontem" },
  { id: "u3", name: "Rafael Souza", cpf: "456.789.123-00", volume: 78, tier: "Prata", lastVisit: "3 dias" },
  { id: "u4", name: "Juliana Pereira", cpf: "321.654.987-00", volume: 42, tier: "Bronze", lastVisit: "5 dias" },
  { id: "u5", name: "Bruno Lima", cpf: "654.321.987-00", volume: 198, tier: "Ouro", lastVisit: "1 semana" },
  { id: "u6", name: "Camila Rocha", cpf: "789.123.456-00", volume: 256, tier: "Ouro", lastVisit: "2 dias" },
];

export function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
