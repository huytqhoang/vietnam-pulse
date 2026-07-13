import { getMultipleLatest } from "@/lib/db";
import { computeSqueezeIndex } from "@/lib/squeeze";
import Dashboard from "./Dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const METRICS = [
  "usd_vnd_sell",
  "gold_sjc_sell_vnd",
  "vn_index_close",
  "wb_cpi_annual",
  "wb_gdp_growth",
  "wb_fdi_pct_gdp",
  "wb_employ_industry_pct",
  "wb_employ_services_pct",
  "wb_employ_agri_pct",
  "wb_manufacturing_pct_gdp",
  "wb_youth_unemployment",
  "wb_self_employed_pct",
  "wb_wage_worker_pct",
  "wb_vulnerable_employ_pct",
  "wb_family_worker_pct",
  "itviec_total_it_jobs",
  "trend_fuel_interest",
  "trend_electricity_interest",
  "trend_rice_interest",
  "trend_pork_interest",
  "trend_gold_interest",
];

export default function Page() {
  const data = getMultipleLatest(METRICS, 60);
  const squeeze = computeSqueezeIndex(data);

  return <Dashboard data={data} squeeze={squeeze} />;
}
