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
];

export default function Page() {
  const data = getMultipleLatest(METRICS, 60);
  const squeeze = computeSqueezeIndex(data);

  return <Dashboard data={data} squeeze={squeeze} />;
}
