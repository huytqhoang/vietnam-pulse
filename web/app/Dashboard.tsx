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
import PriceCategoryGrid from "@/components/PriceCategoryGrid";

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

  // Google Trends price search interest
  const trendFuel        = latest(data["trend_fuel_interest"]);
  const trendElec        = latest(data["trend_electricity_interest"]);
  const trendRice        = latest(data["trend_rice_interest"]);
  const trendPork        = latest(data["trend_pork_interest"]);
  const trendGoldSearch  = latest(data["trend_gold_interest"]);

  // Formal vs informal
  const selfEmployed = latest(data["wb_self_employed_pct"]);
  const wageWorkers  = latest(data["wb_wage_worker_pct"]);
  const vulnerable   = latest(data["wb_vulnerable_employ_pct"]);
  const familyWork   = latest(data["wb_family_worker_pct"]);

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

            <InsightCard
              tension="warns"
              headlineVi="53% người Việt tự làm chủ — phần lớn không có lưới bảo vệ"
              headlineEn="53% of Vietnamese are self-employed — most with no safety net"
              left={{
                label: lang === "vi" ? "Tự làm / Phi chính thức" : "Self-employed / Informal",
                value: selfEmployed ? `${selfEmployed.toFixed(0)}%` : "53%",
                sub: lang === "vi" ? "xe ôm, tiệm tạp hóa, nông dân..." : "drivers, shops, farmers..."
              }}
              right={{
                label: lang === "vi" ? "Việc làm dễ tổn thương" : "Vulnerable employment",
                value: vulnerable ? `${vulnerable.toFixed(0)}%` : "51%",
                sub: lang === "vi" ? "không hợp đồng, không BHXH" : "no contract, no social security"
              }}
              interpretationVi="Khi kinh tế khó khăn, nhóm này bị ảnh hưởng đầu tiên và nặng nhất — không có trợ cấp thất nghiệp, không có lương cơ bản. Grab driver, chủ xe ôm, bán hàng rong: đây là đa số người lao động Việt Nam."
              interpretationEn="When the economy slows, this group gets hit first and hardest — no unemployment benefits, no minimum wage protection. Grab drivers, xe ôm owners, street vendors: this is the majority of Vietnam's workforce."
              lang={lang}
            />
          </div>
        </section>

        {/* 4. Price Categories */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              {lang === "vi" ? "Giá Cả & Mức Độ Lo Lắng" : "Prices & Public Anxiety"}
            </h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              {lang === "vi"
                ? "Giá thực tế + mức độ tìm kiếm trên Google = người dân đang lo về gì"
                : "Real prices + Google search volume = what people are actually worried about"}
            </p>
          </div>

          {/* Electricity headline callout — the surprise finding */}
          {trendElec !== null && trendElec > 40 && (
            <div className="rounded-xl border border-yellow-800 bg-yellow-950/40 p-4 flex items-start gap-3">
              <span className="text-2xl shrink-0">⚡</span>
              <div>
                <p className="text-sm font-semibold text-yellow-200">
                  {lang === "vi"
                    ? `Giá điện: mức lo lắng ${trendElec.toFixed(0)}/100 — cao hơn cả giá xăng`
                    : `Electricity: anxiety score ${trendElec.toFixed(0)}/100 — higher than fuel prices`}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {lang === "vi"
                    ? "Người Việt tìm kiếm \"giá điện\" nhiều gần gấp 10 lần \"giá xăng\". Hóa đơn điện mùa hè đang là gánh nặng lớn hơn xăng với đa số hộ gia đình."
                    : "Vietnamese search \"electricity price\" ~10× more than \"fuel price\". Summer electricity bills are a bigger burden than fuel for most households."}
                </p>
              </div>
            </div>
          )}

          <PriceCategoryGrid
            lang={lang}
            categories={[
              {
                icon: "⚡",
                nameVi: "Giá Điện",
                nameEn: "Electricity",
                value: "~",
                unit: lang === "vi" ? "điều chỉnh định kỳ" : "periodically adjusted",
                concern: trendElec,
                trend: "up",
                noteVi: "EVN điều chỉnh hàng quý. Mùa hè: điều hoà tăng mạnh hoá đơn.",
                noteEn: "EVN adjusts quarterly. Summer AC usage spikes bills.",
                source: "Google Trends · EVN",
                sparkData: data["trend_electricity_interest"],
                isLive: false,
              },
              {
                icon: "⛽",
                nameVi: "Xăng A95",
                nameEn: "Petrol A95",
                value: "~20–21K",
                unit: "₫/lít",
                concern: trendFuel,
                trend: "stable",
                noteVi: "Điều chỉnh lần cuối: 09.07.2026. Điều chỉnh 10 ngày/lần theo giá dầu thế giới.",
                noteEn: "Last adjusted: 09 Jul 2026. Updated every 10 days tracking global oil.",
                source: "Petrolimex · Google Trends",
                sparkData: data["trend_fuel_interest"],
                isLive: false,
              },
              {
                icon: "🏅",
                nameVi: "Vàng SJC",
                nameEn: "SJC Gold",
                value: gold ? `${(gold / 1_000_000).toFixed(1)}M` : "148M",
                unit: "₫/lượng",
                concern: trendGoldSearch ?? (gold && gold > 140_000_000 ? 28 : 10),
                trend: goldChange !== null && goldChange > 0.5 ? "up" : "stable",
                noteVi: `${goldChange !== null ? `+${goldChange.toFixed(1)}% tuần này. ` : ""}Vàng tăng = người dân đang phòng thủ.`,
                noteEn: `${goldChange !== null ? `+${goldChange.toFixed(1)}% this week. ` : ""}Gold rising = people are hedging.`,
                source: "DOJI · live",
                sparkData: data["gold_sjc_sell_vnd"],
                isLive: true,
              },
              {
                icon: "💵",
                nameVi: "Tỷ Giá USD",
                nameEn: "USD Exchange",
                value: usdVnd ? `${fmt(usdVnd)}` : "26,460",
                unit: "₫",
                concern: usdChange !== null && usdChange > 1 ? Math.min(100, usdChange * 15) : 10,
                trend: usdChange !== null && usdChange > 0.5 ? "up" : "stable",
                noteVi: "Tác động trực tiếp: hàng nhập, điện thoại, đồ điện tử, nguyên liệu.",
                noteEn: "Direct impact: imports, phones, electronics, raw materials.",
                source: "Vietcombank · live",
                sparkData: data["usd_vnd_sell"],
                isLive: true,
              },
              {
                icon: "🌾",
                nameVi: "Gạo",
                nameEn: "Rice",
                value: "~",
                unit: lang === "vi" ? "ổn định" : "stable",
                concern: trendRice ?? 5,
                trend: "stable",
                noteVi: "Gạo Việt Nam xuất khẩu tốt. Giá nội địa ổn định — ít tác động từ thuế quan.",
                noteEn: "Vietnam rice exports strong. Domestic prices stable — less tariff exposure.",
                source: "Google Trends · GSO",
                isLive: false,
              },
              {
                icon: "🥩",
                nameVi: "Thịt Heo",
                nameEn: "Pork",
                value: "~",
                unit: lang === "vi" ? "theo mùa" : "seasonal",
                concern: trendPork ?? 5,
                trend: "stable",
                noteVi: "Giá thịt theo mùa và dịch bệnh gia súc. Chiếm ~10% rổ CPI thực phẩm.",
                noteEn: "Seasonal and disease-driven. ~10% of food CPI basket.",
                source: "Google Trends · GSO",
                isLive: false,
              },
            ]}
          />

          <p className="text-xs text-zinc-700 text-center">
            {lang === "vi"
              ? "Mức lo lắng = Google Trends tìm kiếm giá sản phẩm tại Việt Nam (0=ít, 100=rất nhiều) · Đo lường hàng tuần"
              : "Anxiety score = Google Trends search interest for price queries in Vietnam (0=low, 100=high) · Measured weekly"}
          </p>
        </section>

        {/* 5. Job Market by Sector */}
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

          {/* Formal vs Informal breakdown */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">
              {lang === "vi" ? "Cơ cấu việc làm — chính thức vs phi chính thức (2025)" : "Employment structure — formal vs informal (2025)"}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  pct: selfEmployed ?? 53.4,
                  label: lang === "vi" ? "Tự làm chủ" : "Self-employed",
                  sub: lang === "vi" ? "Grab, xe ôm, tạp hóa, nông dân" : "Grab, xe ôm, shops, farmers",
                  color: "bg-orange-500",
                  ring: "ring-orange-800",
                  icon: "🛵",
                },
                {
                  pct: wageWorkers ?? 46.7,
                  label: lang === "vi" ? "Làm công ăn lương" : "Wage workers",
                  sub: lang === "vi" ? "Nhà máy, văn phòng, dịch vụ" : "Factories, offices, services",
                  color: "bg-blue-500",
                  ring: "ring-blue-800",
                  icon: "🏢",
                },
                {
                  pct: vulnerable ?? 51.4,
                  label: lang === "vi" ? "Việc làm dễ tổn thương" : "Vulnerable employment",
                  sub: lang === "vi" ? "Không HĐ, không BHXH" : "No contract, no social security",
                  color: "bg-red-600",
                  ring: "ring-red-900",
                  icon: "⚠️",
                },
                {
                  pct: familyWork ?? 12.0,
                  label: lang === "vi" ? "Lao động gia đình" : "Family workers",
                  sub: lang === "vi" ? "Không lương, hỗ trợ người thân" : "Unpaid, helping relatives",
                  color: "bg-zinc-500",
                  ring: "ring-zinc-700",
                  icon: "👨‍👩‍👧",
                },
              ].map(({ pct, label, sub, color, ring, icon }) => (
                <div key={label} className={`rounded-lg border ${ring} bg-zinc-950/60 p-3`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base">{icon}</span>
                    <span className={`text-xl font-black text-white`}>{pct.toFixed(0)}%</span>
                  </div>
                  {/* mini bar */}
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-2">
                    <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs font-medium text-zinc-300">{label}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-zinc-600 border-t border-zinc-800 pt-3">
              {lang === "vi"
                ? "Nguồn: World Bank / ILO 2025 · Lưu ý: \"việc làm dễ tổn thương\" gồm tự làm chủ phi chính thức + lao động gia đình"
                : "Source: World Bank / ILO 2025 · Note: \"vulnerable employment\" includes informal self-employed + unpaid family workers"}
            </p>
          </div>

          {/* Platform / gig economy callout */}
          <div className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-4 flex gap-4 items-start">
            <span className="text-3xl shrink-0">🛵</span>
            <div>
              <p className="text-sm font-semibold text-white">
                {lang === "vi" ? "Grab / Be / xe ôm công nghệ: ~400.000–600.000 tài xế" : "Grab / Be / ride-hailing: ~400K–600K drivers"}
              </p>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                {lang === "vi"
                  ? "Grab báo cáo ~250.000 tài xế đang hoạt động (2023-2024). Be khoảng 200.000. Xe ôm truyền thống ước tính 1–2 triệu. Không có API công khai — số liệu từ thông cáo báo chí của công ty."
                  : "Grab reported ~250K active drivers (2023-24). Be ~200K. Traditional xe ôm estimated 1-2M. No public API — figures from company press releases."}
              </p>
            </div>
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
