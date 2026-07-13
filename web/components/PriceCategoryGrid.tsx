"use client";
import SparklineChart from "./SparklineChart";

interface PriceCategory {
  icon: string;
  nameVi: string;
  nameEn: string;
  value: string;
  unit: string;
  concern: number | null;   // Google Trends 0–100, null if not available
  trend: "up" | "down" | "stable" | "unknown";
  noteVi: string;
  noteEn: string;
  source: string;
  sparkData?: { recorded_at: string; value: number }[];
  isLive?: boolean;
}

interface Props {
  categories: PriceCategory[];
  lang: "vi" | "en";
}

function ConcernBar({ score, lang }: { score: number; lang: "vi" | "en" }) {
  const level =
    score >= 60 ? { label: lang === "vi" ? "Rất lo" : "Very worried", color: "bg-red-500" } :
    score >= 35 ? { label: lang === "vi" ? "Lo" : "Worried", color: "bg-orange-500" } :
    score >= 15 ? { label: lang === "vi" ? "Chú ý" : "Watching", color: "bg-yellow-500" } :
                  { label: lang === "vi" ? "Bình thường" : "Normal", color: "bg-emerald-500" };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500">{lang === "vi" ? "Mức quan tâm" : "Search interest"}</span>
        <span className="text-zinc-400 font-medium">{level.label}</span>
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-1.5">
        <div className={`${level.color} h-1.5 rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

const trendArrow = { up: "↑", down: "↓", stable: "→", unknown: "?" };
const trendColor = {
  up:      "text-red-400",
  down:    "text-emerald-400",
  stable:  "text-zinc-500",
  unknown: "text-zinc-600",
};

export default function PriceCategoryGrid({ categories, lang }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {categories.map((cat) => (
        <div
          key={cat.nameEn}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex flex-col gap-3"
        >
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="text-xl">{cat.icon}</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-300 leading-tight truncate">
                {lang === "vi" ? cat.nameVi : cat.nameEn}
              </p>
              {cat.isLive && (
                <span className="text-xs text-emerald-600">● live</span>
              )}
            </div>
          </div>

          {/* Value */}
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-white leading-none">{cat.value}</span>
              <span className="text-xs text-zinc-600">{cat.unit}</span>
              <span className={`text-sm font-bold ml-auto ${trendColor[cat.trend]}`}>
                {trendArrow[cat.trend]}
              </span>
            </div>
          </div>

          {/* Sparkline if available */}
          {cat.sparkData && cat.sparkData.length > 2 && (
            <SparklineChart
              data={cat.sparkData}
              color={cat.trend === "up" ? "#f97316" : cat.trend === "down" ? "#22c55e" : "#71717a"}
              label={lang === "vi" ? cat.nameVi : cat.nameEn}
            />
          )}

          {/* Concern bar from Google Trends */}
          {cat.concern !== null && (
            <ConcernBar score={cat.concern} lang={lang} />
          )}

          {/* Note */}
          <p className="text-xs text-zinc-600 leading-snug">
            {lang === "vi" ? cat.noteVi : cat.noteEn}
          </p>
          <p className="text-xs text-zinc-700">{cat.source}</p>
        </div>
      ))}
    </div>
  );
}
