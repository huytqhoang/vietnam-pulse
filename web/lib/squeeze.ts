import type { Indicator } from "./db";

export type SqueezeLevel = "low" | "moderate" | "high" | "critical";

export interface SqueezeResult {
  level: SqueezeLevel;
  score: number; // 0–100
  components: { label: string; score: number; weight: number }[];
}

function pct(val: number, min: number, max: number): number {
  return Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
}

export function computeSqueezeIndex(data: Record<string, Indicator[]>): SqueezeResult {
  const components: { label: string; score: number; weight: number }[] = [];

  // 1. VN-Index level (lower = more pressure)
  const vnRows = data["vn_index_close"] ?? [];
  if (vnRows.length > 0) {
    const latest = vnRows[0].value;
    // 1000 = critical, 1400 = moderate, 1800 = healthy, 2200+ = boom
    const s = 100 - pct(latest, 1000, 2200);
    components.push({ label: "VN-Index", score: s, weight: 25 });
  }

  // 2. USD/VND rate (higher = more pressure on imported costs)
  const usdRows = data["usd_vnd_sell"] ?? [];
  if (usdRows.length > 0) {
    const latest = usdRows[0].value;
    // 23000 = relaxed, 26000 = moderate, 28000+ = stressed
    const s = pct(latest, 23000, 29000);
    components.push({ label: "USD/VND", score: s, weight: 20 });
  }

  // 3. Gold price (higher = more stress/distrust)
  const goldRows = data["gold_sjc_sell_vnd"] ?? [];
  if (goldRows.length > 0) {
    const latest = goldRows[0].value;
    // 70M = low, 120M = moderate, 160M+ = very high anxiety
    const s = pct(latest, 70_000_000, 170_000_000);
    components.push({ label: "Gold SJC", score: s, weight: 20 });
  }

  // 4. CPI (higher = more price pressure)
  const cpiRows = data["wb_cpi_annual"] ?? [];
  if (cpiRows.length > 0) {
    const latest = cpiRows[0].value;
    // 0% = fine, 4% = moderate, 8%+ = high
    const s = pct(latest, 0, 9);
    components.push({ label: "Inflation", score: s, weight: 20 });
  }

  // 5. FDI (lower = less investor confidence = more pressure)
  const fdiRows = data["wb_fdi_pct_gdp"] ?? [];
  if (fdiRows.length > 0) {
    const latest = fdiRows[0].value;
    // 6%+ = healthy, 3% = moderate, <1% = crisis
    const s = 100 - pct(latest, 1, 7);
    components.push({ label: "FDI", score: s, weight: 15 });
  }

  if (components.length === 0) {
    return { level: "moderate", score: 50, components: [] };
  }

  const totalWeight = components.reduce((s, c) => s + c.weight, 0);
  const weightedScore = components.reduce(
    (s, c) => s + (c.score * c.weight) / totalWeight,
    0
  );

  const level: SqueezeLevel =
    weightedScore < 30 ? "low" :
    weightedScore < 55 ? "moderate" :
    weightedScore < 75 ? "high" : "critical";

  return { level, score: Math.round(weightedScore), components };
}
