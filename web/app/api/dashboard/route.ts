import { NextResponse } from "next/server";
import { getMultipleLatest } from "@/lib/db";
import { computeSqueezeIndex } from "@/lib/squeeze";

const METRICS = [
  "usd_vnd_sell",
  "usd_vnd_buy",
  "gold_sjc_sell_vnd",
  "gold_sjc_buy_vnd",
  "vn_index_close",
  "wb_cpi_annual",
  "wb_gdp_growth",
  "wb_fdi_pct_gdp",
  "wb_unemployment",
  // Sector employment
  "wb_employ_industry_pct",
  "wb_employ_services_pct",
  "wb_employ_agri_pct",
  "wb_manufacturing_pct_gdp",
  "wb_youth_unemployment",
  // Employment status (formal vs informal)
  "wb_self_employed_pct",
  "wb_wage_worker_pct",
  "wb_vulnerable_employ_pct",
  "wb_family_worker_pct",
  // Jobs
  "itviec_total_it_jobs",
  // Price trend / Google Trends search interest
  "trend_fuel_interest",
  "trend_electricity_interest",
  "trend_rice_interest",
  "trend_pork_interest",
  "trend_gold_interest",
  // Fuel adjustment signal
  "fuel_last_adjustment_flag",
];

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = getMultipleLatest(METRICS, 60);
    const squeeze = computeSqueezeIndex(data);
    return NextResponse.json({ data, squeeze });
  } catch (err) {
    console.error("[dashboard API]", err);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
