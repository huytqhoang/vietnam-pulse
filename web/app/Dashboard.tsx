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
import SectorBar from "@/components/SectorBar";
import InsightCard from "@/components/InsightCard";

interface Props {
  data: Record<string, Indicator[]>;
  squeeze: SqueezeResult;
}

function fmt(n: number, decimals = 0) {
  return n.toLocaleString("vi-VN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
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

  // Daily metrics
  const usdVnd = latest(data["usd_vnd_sell"]);
  const gold   = latest(data["gold_sjc_sell_vnd"]);
  const vnIdx  = latest(data["vn_index_close"]);

  // Annual macro
  const cpi    = latest(data["wb_cpi_annual"]);
  const gdp    = latest(data["wb_gdp_growth"]);
  const fdi    = latest(data["wb_fdi_pct_gdp"]);

  // Sector employment
  const industryPct  = latest(data["wb_employ_industry_pct"]);
  const servicesPct  = latest(data["wb_employ_services_pct"]);
  const agriPct      = latest(data["wb_employ_agri_pct"]);
  const mfgPctGdp    = latest(data["wb_manufacturing_pct_gdp"]);
  const youthUnemp   = latest(data["wb_youth_unemployment"]);
  const itJobs       = latest(data["itviec_total_it_jobs"]);

  // Trend deltas
  const vnIdxChange = weekChange(data["vn_index_close"]);
  const usdChange   = weekChange(data["usd_vnd_sell"]);
  const goldChange  = weekChange(data["gold_sjc_sell_vnd"]);

  const updatedAt = data["usd_vnd_sell"]?.[0]?.recorded_at ?? "—";

  // Build sector data for chart
  const sectors = [
    {
      label: "Công nghiệp",
      labelEn: "Industry",
      pct: industryPct ?? 34.8,
      color: "bg-orange-500",
      trend: "up" as const,
      trendNote: "Chịu thuế quan 46% từ Mỹ",
      trendNoteEn: "Hit by 46% US tariffs",
    },
    {
      label: "Dịch vụ",
      labelEn: "Services",
      pct: servicesPct ?? 40.1,
      color: "bg-blue-500",
      trend: "stable" as const,
      trendNote: "Hồi phục không đều",
      trendNoteEn: "Uneven recovery",
    },
    {
      label: "Nông nghiệp",
      labelEn: "Agriculture",
      pct: agriPct ?? 25.0,
      color: "bg-emerald-600",
      trend: "down" as const,
      trendNote: "Dịch chuyển ra thành thị",
      trendNoteEn: "Shifting to urban",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-4 py-4 sticky top-0 bg-zinc-950/95 backdrop-blur z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              {tr("title", lang)}
            </h1>
            <p className="text-xs text-zinc-500">{tr("subtitle", lang)}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-600 hidden sm:block">
              {tr("lastUpdated", lang)}: {updatedAt}
            </span>
            <button
              onClick={() => setLang((l) => (l === "vi" ? "en" : "vi"))}
              className="text-xs px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
            >
              {lang === "vi" ? "EN" : "VI"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-12">

        {/* 1. Squeeze Gauge */}
        <SqueezeGauge level={squeeze.level} score={squeeze.score} lang={lang} />

        {/* 2. Your Wallet */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">{tr("walletTitle", lang)}</h2>
            <p className="text-sm text-zinc-500 mt-0.5">{tr("walletDesc", lang)}</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: "💵",
                label: tr("usdVnd", lang),
                value: usdVnd ? `${fmt(usdVnd)} ₫` : tr("noData", lang),
                subtext: tr("usdVndDesc", lang),
                change: usdChange,
                highlight: usdChange !== null && usdChange > 1,
                metric: "usd_vnd_sell",
                chartColor: "#f97316",
              },
              {
                icon: "🏅",
                label: tr("goldPrice", lang),
                value: gold ? `${(gold / 1_000_000).toFixed(1)}M${tr("perLuong", lang)}` : tr("noData", lang),
                subtext: tr("goldDesc", lang),
                change: goldChange,
                highlight: gold !== null && gold > 150_000_000,
                metric: "gold_sjc_sell_vnd",
                chartColor: "#eab308",
              },
              {
                icon: "📈",
                label: tr("vnIndex", lang),
                value: vnIdx ? `${fmt(vnIdx)} ${tr("pts", lang)}` : tr("noData", lang),
                subtext: tr("vnIndexDesc", lang),
                // Inverted: VN-Index down = pressure up
                change: vnIdxChange !== null ? -vnIdxChange : null,
                highlight: vnIdx !== null && vnIdx < 1600,
                metric: "vn_index_close",
                chartColor: "#22d3ee",
              },
            ].map(({ icon, label, value, subtext, change, highlight, metric, chartColor }) => (
              <div key={metric} className="space-y-2">
                <MetricCard
                  icon={icon}
                  label={label}
                  value={value}
                  subtext={subtext}
                  trend={trendDir(change)}
                  trendLabel={
                    change !== null
                      ? `${change > 0 ? "+" : ""}${change.toFixed(1)}% ${tr("changeVsLastWeek", lang)}`
                      : undefined
                  }
                  highlight={highlight}
                />
                {data[metric] && (
                  <SparklineChart data={data[metric]} color={chartColor} label={label} />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 3. Polarizing Insights */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              {lang === "vi" ? "Mâu Thuẫn Dữ Liệu" : "The Data Contradictions"}
            </h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              {lang === "vi"
                ? "Khi các con số kể những câu chuyện khác nhau"
                : "When the numbers tell different stories"}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <InsightCard
              tension="contradicts"
              headlineVi="GDP tăng 8% — thị trường chứng khoán không tin"
              headlineEn="GDP up 8% — the stock market disagrees"
              left={{ label: "GDP 2025", value: gdp ? `+${gdp.toFixed(1)}%` : "+8%", sub: lang === "vi" ? "tăng trưởng chính thức" : "official growth" }}
              right={{ label: "VN-Index", value: vnIdx ? `${fmt(vnIdx)}` : "1,811", sub: lang === "vi" ? "tuần này −3.1%" : "this week −3.1%" }}
              interpretationVi="GDP đo lường đầu ra kinh tế. VN-Index đo lường kỳ vọng tương lai. Khi hai số đi ngược nhau, nhà đầu tư biết điều gì đó mà báo cáo chưa nói."
              interpretationEn="GDP measures economic output. VN-Index measures future expectations. When they diverge, investors know something the reports haven't said yet."
              lang={lang}
            />

            <InsightCard
              tension="contradicts"
              headlineVi="Thất nghiệp 1.5% nhưng vàng lên giá mỗi ngày"
              headlineEn="1.5% unemployment but gold climbs every day"
              left={{ label: lang === "vi" ? "Thất nghiệp chính thức" : "Official unemployment", value: "1.5%", sub: lang === "vi" ? "mức thấp lịch sử" : "historic low" }}
              right={{ label: lang === "vi" ? "Giá vàng SJC" : "SJC Gold", value: gold ? `${(gold / 1_000_000).toFixed(0)}M` : "148M", sub: lang === "vi" ? "+2.4% tuần này" : "+2.4% this week" }}
              interpretationVi="1.5% thất nghiệp nghe tốt. Nhưng người Việt đang đổ tiền vào vàng — thứ họ mua khi không tin vào hệ thống. Số liệu thất nghiệp không tính người làm không đủ sống."
              interpretationEn="1.5% unemployment sounds great. But Vietnamese are piling into gold — what they buy when they don't trust the system. The unemployment figure doesn't count underemployed workers."
              lang={lang}
            />

            <InsightCard
              tension="warns"
              headlineVi="IT tuyển dụng mạnh — nhà máy đang lo thuế quan"
              headlineEn="Tech is hiring — factories are scared of tariffs"
              left={{ label: lang === "vi" ? "Việc làm IT hôm nay" : "IT jobs today", value: itJobs ? `${fmt(itJobs)}` : "881", sub: lang === "vi" ? "trên itviec.com" : "on itviec.com" }}
              right={{ label: lang === "vi" ? "Công nhân ngành sản xuất" : "Manufacturing workers", value: mfgPctGdp ? `${mfgPctGdp.toFixed(0)}% GDP` : "24% GDP", sub: lang === "vi" ? "chịu thuế 46% Mỹ" : "facing 46% US tariffs" }}
              interpretationVi="Việt Nam đang tách làm đôi: một nền kinh tế IT và dịch vụ đang tăng trưởng, và một nền kinh tế sản xuất xuất khẩu đang chịu áp lực thuế quan. Bạn đang ở phía nào?"
              interpretationEn="Vietnam is splitting in two: a growing IT and services economy, and an export-manufacturing economy under tariff pressure. Which side are you on?"
              lang={lang}
            />

            <InsightCard
              tension="contradicts"
              headlineVi="Nước ngoài đầu tư mạnh — dân trong nước mua vàng"
              headlineEn="Foreigners invest — locals buy gold"
              left={{ label: "FDI", value: fdi ? `${fdi.toFixed(1)}% GDP` : "4.2% GDP", sub: lang === "vi" ? "vốn nước ngoài vào VN" : "foreign capital inflow" }}
              right={{ label: lang === "vi" ? "Vàng SJC" : "SJC Gold", value: goldChange ? `+${goldChange.toFixed(1)}%` : "+2.4%", sub: lang === "vi" ? "tuần này — dân đang phòng thủ" : "this week — locals hedging" }}
              interpretationVi="Samsung, Intel, LG vẫn đang xây nhà máy ở Việt Nam. Nhưng người dân địa phương đang chuyển tiết kiệm sang vàng. Ai đúng về tương lai Việt Nam — nhà đầu tư nước ngoài hay người dân trong nước?"
              interpretationEn="Samsung, Intel, LG are still building factories in Vietnam. But local people are shifting savings to gold. Who's right about Vietnam's future — foreign investors or local residents?"
              lang={lang}
            />
          </div>
        </section>

        {/* 4. Job Market by Sector */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              {lang === "vi" ? "Thị Trường Lao Động" : "Job Market"}
            </h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              {lang === "vi"
                ? "Ai đang thuê người — ai đang lo lắng"
                : "Who's hiring — who's worried"}
            </p>
          </div>

          {/* Sector employment breakdown */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">
              {lang === "vi" ? "Cơ cấu lao động Việt Nam (2025)" : "Vietnam Labor Structure (2025)"}
            </p>
            <SectorBar sectors={sectors} lang={lang} />
          </div>

          {/* Sector job cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-orange-900 bg-orange-950/30 p-4">
              <div className="text-2xl mb-2">🏭</div>
              <div className="text-xs text-orange-400 font-semibold uppercase tracking-wide mb-1">
                {lang === "vi" ? "Sản xuất / Công nghiệp" : "Manufacturing / Industry"}
              </div>
              <div className="text-2xl font-black text-white">
                {industryPct ? `${industryPct.toFixed(1)}%` : "34.8%"}
                <span className="text-sm font-normal text-zinc-500 ml-1">
                  {lang === "vi" ? "lao động" : "of workforce"}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                {lang === "vi"
                  ? "Ngành lớn nhất — và đang chịu áp lực nhất. Mỹ áp thuế 46% năm 2025. Đơn hàng xuất khẩu dệt may, điện tử đang chậm lại."
                  : "Biggest sector — and most pressured. US imposed 46% tariffs in 2025. Textile and electronics export orders slowing."}
              </p>
              <div className="mt-3 flex items-center gap-1 text-red-400 text-xs font-medium">
                ↑ {lang === "vi" ? "Áp lực cao" : "High pressure"}
              </div>
            </div>

            <div className="rounded-xl border border-blue-900 bg-blue-950/30 p-4">
              <div className="text-2xl mb-2">💻</div>
              <div className="text-xs text-blue-400 font-semibold uppercase tracking-wide mb-1">
                {lang === "vi" ? "IT & Công nghệ" : "Tech & IT"}
              </div>
              <div className="text-2xl font-black text-white">
                {itJobs ? fmt(itJobs) : "881"}
                <span className="text-sm font-normal text-zinc-500 ml-1">
                  {lang === "vi" ? "việc làm hôm nay" : "jobs today"}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                {lang === "vi"
                  ? "Dữ liệu trực tiếp từ itviec.com. IT là ngành ít bị ảnh hưởng bởi thuế quan nhất — lương cao hơn, ổn định hơn."
                  : "Live from itviec.com. IT is least exposed to tariffs — higher wages, more stable."}
              </p>
              <div className="mt-3 flex items-center gap-1 text-emerald-400 text-xs font-medium">
                ↓ {lang === "vi" ? "Áp lực thấp" : "Low pressure"}
              </div>
            </div>

            <div className="rounded-xl border border-amber-900 bg-amber-950/30 p-4">
              <div className="text-2xl mb-2">🎓</div>
              <div className="text-xs text-amber-400 font-semibold uppercase tracking-wide mb-1">
                {lang === "vi" ? "Thất nghiệp thanh niên" : "Youth Unemployment"}
              </div>
              <div className="text-2xl font-black text-white">
                {youthUnemp ? `${youthUnemp.toFixed(1)}%` : "6.2%"}
                <span className="text-sm font-normal text-zinc-500 ml-1">
                  {lang === "vi" ? "15–24 tuổi" : "ages 15–24"}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                {lang === "vi"
                  ? "Gấp 4 lần thất nghiệp tổng thể (1.5%). Thế hệ trẻ khó tìm việc phù hợp — gap giữa kỹ năng học và việc làm thực tế."
                  : "4× the overall rate (1.5%). Young people struggle to find matching work — skill-job mismatch is real."}
              </p>
              <div className="mt-3 flex items-center gap-1 text-yellow-400 text-xs font-medium">
                → {lang === "vi" ? "Đáng theo dõi" : "Worth watching"}
              </div>
            </div>
          </div>
        </section>

        {/* 5. Big Picture */}
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

        {/* 6. Story */}
        <StorySection lang={lang} />

        {/* Footer */}
        <footer className="border-t border-zinc-800 pt-6 text-center">
          <p className="text-xs text-zinc-600">{tr("footerNote", lang)}</p>
          <p className="text-xs text-zinc-600 mt-0.5">
            {lang === "vi"
              ? "Dữ liệu việc làm IT: itviec.com · Lao động theo ngành: World Bank"
              : "IT jobs data: itviec.com · Sector employment: World Bank"}
          </p>
          <p className="text-xs text-zinc-700 mt-2">
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
