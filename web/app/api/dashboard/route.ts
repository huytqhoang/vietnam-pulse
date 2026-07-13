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
