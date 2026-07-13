"use client";
import { useState } from "react";
import type { Indicator } from "@/lib/db";
import type { SqueezeResult } from "@/lib/squeeze";
import type { Lang } from "@/lib/i18n";
import { tr } from "@/lib/i18n";
import SqueezeGauge from "@/components/SqueezeGauge";
import MetricCard from "@/components/MetricCard";
import SparklineChart from "@/components/SparklineChart";
import StorySection from "@/components/StorySection";

interface Props {
  data: Record<string, Indicator[]>;
  squeeze: SqueezeResult;
}

function fmt(n: number, decimals = 0) {
  return n.toLocaleString("vi-VN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function latest(rows: Indicator[] | undefined): number | null {
  return rows && rows.length > 0 ? rows[0].value : null;
}

function weekChange(rows: Indicator[] | undefined): number | null {
  if (!rows || rows.length < 2) return null;
  const newest = rows[0].value;
  const oldest = rows[rows.length - 1].value;
  return ((newest - oldest) / oldest) * 100;
}

function trendDir(change: number | null): "up" | "down" | "neutral" {
  if (change === null) return "neutral";
  if (change > 0.3) return "up";
  if (change < -0.3) return "down";
  return "neutral";
}

export default function Dashboard({ data, squeeze }: Props) {
  const [lang, setLang] = useState<Lang>("vi");

  const usdVnd = latest(data["usd_vnd_sell"]);
  const gold   = latest(data["gold_sjc_sell_vnd"]);
  const vnIdx  = latest(data["vn_index_close"]);
  const cpi    = latest(data["wb_cpi_annual"]);
  const gdp    = latest(data["wb_gdp_growth"]);
  const fdi    = latest(data["wb_fdi_pct_gdp"]);

  const vnIdxChange  = weekChange(data["vn_index_close"]);
  const usdChange    = weekChange(data["usd_vnd_sell"]);
  const goldChange   = weekChange(data["gold_sjc_sell_vnd"]);

  const updatedAt = data["usd_vnd_sell"]?.[0]?.recorded_at ?? "—";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              {tr("title", lang)}
            </h1>
            <p className="text-xs text-zinc-500">{tr("subtitle", lang)}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-600">
              {tr("lastUpdated", lang)}: {updatedAt}
            </span>
            <button
              onClick={() => setLang(l => l === "vi" ? "en" : "vi")}
              className="text-xs px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
            >
              {lang === "vi" ? "EN" : "VI"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-10">

        {/* 1. Squeeze Gauge */}
        <SqueezeGauge level={squeeze.level} score={squeeze.score} lang={lang} />

        {/* 2. Wallet metrics */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">{tr("walletTitle", lang)}</h2>
            <p className="text-sm text-zinc-500 mt-0.5">{tr("walletDesc", lang)}</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <MetricCard
                icon="💵"
                label={tr("usdVnd", lang)}
                value={usdVnd ? `${fmt(usdVnd)} ₫` : tr("noData", lang)}
                subtext={tr("usdVndDesc", lang)}
                trend={trendDir(usdChange)}
                trendLabel={usdChange !== null ? `${usdChange > 0 ? "+" : ""}${usdChange.toFixed(1)}% ${tr("changeVsLastWeek", lang)}` : undefined}
                highlight={usdChange !== null && usdChange > 1}
              />
              {data["usd_vnd_sell"] && (
                <SparklineChart
                  data={data["usd_vnd_sell"]}
                  color="#f97316"
                  label="USD/VND"
                />
              )}
            </div>

            <div className="space-y-2">
              <MetricCard
                icon="🏅"
                label={tr("goldPrice", lang)}
                value={gold ? `${(gold / 1_000_000).toFixed(1)}M${tr("perLuong", lang)}` : tr("noData", lang)}
                subtext={tr("goldDesc", lang)}
                trend={trendDir(goldChange)}
                trendLabel={goldChange !== null ? `${goldChange > 0 ? "+" : ""}${goldChange.toFixed(1)}% ${tr("changeVsLastWeek", lang)}` : undefined}
                highlight={gold !== null && gold > 150_000_000}
              />
              {data["gold_sjc_sell_vnd"] && (
                <SparklineChart
                  data={data["gold_sjc_sell_vnd"]}
                  color="#eab308"
                  label="Gold"
                />
              )}
            </div>

            <div className="space-y-2">
              <MetricCard
                icon="📈"
                label={tr("vnIndex", lang)}
                value={vnIdx ? `${fmt(vnIdx, 0)} ${tr("pts", lang)}` : tr("noData", lang)}
                subtext={tr("vnIndexDesc", lang)}
                trend={vnIdxChange !== null ? (vnIdxChange < 0 ? "up" : "down") : "neutral"}
                trendLabel={vnIdxChange !== null ? `${vnIdxChange > 0 ? "+" : ""}${vnIdxChange.toFixed(1)}% ${tr("changeVsLastWeek", lang)}` : undefined}
                highlight={vnIdx !== null && vnIdx < 1500}
              />
              {data["vn_index_close"] && (
                <SparklineChart
                  data={data["vn_index_close"]}
                  color="#22d3ee"
                  label="VN-Index"
                />
              )}
            </div>
          </div>
        </section>

        {/* 3. Big picture — macro */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">{tr("bigTitle", lang)}</h2>
            <p className="text-sm text-zinc-500 mt-0.5">{tr("bigDesc", lang)}</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <MetricCard
              icon="🧾"
              label={tr("cpiLabel", lang)}
              value={cpi ? `${cpi.toFixed(2)}%` : tr("noData", lang)}
              subtext={tr("cpiDesc", lang)}
              trend={cpi !== null && cpi > 5 ? "up" : "neutral"}
              trendLabel={tr("annual", lang)}
            />
            <MetricCard
              icon="📊"
              label={tr("gdpLabel", lang)}
              value={gdp ? `${gdp.toFixed(2)}%` : tr("noData", lang)}
              subtext={tr("gdpDesc", lang)}
              trend="neutral"
              trendLabel={tr("annual", lang)}
            />
            <MetricCard
              icon="🏭"
              label={tr("fdiLabel", lang)}
              value={fdi ? `${fdi.toFixed(2)}${tr("ofGdp", lang)}` : tr("noData", lang)}
              subtext={tr("fdiDesc", lang)}
              trend={fdi !== null && fdi < 3 ? "up" : "neutral"}
              trendLabel={tr("annual", lang)}
            />
          </div>
        </section>

        {/* 4. Story */}
        <StorySection lang={lang} />

        {/* Footer */}
        <footer className="border-t border-zinc-800 pt-6 text-center">
          <p className="text-xs text-zinc-600">{tr("footerNote", lang)}</p>
          <p className="text-xs text-zinc-700 mt-1">
            <a
              href="https://github.com/huytqhoang/vietnam-pulse"
              className="hover:text-zinc-500 underline underline-offset-2 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/huytqhoang/vietnam-pulse
            </a>
          </p>
        </footer>

      </main>
    </div>
  );
}
