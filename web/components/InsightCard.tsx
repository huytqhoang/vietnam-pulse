"use client";

export type InsightTension = "contradicts" | "confirms" | "warns";

interface DataPoint {
  label: string;
  value: string;
  sub?: string;
}

interface Props {
  tension: InsightTension;
  headlineVi: string;
  headlineEn: string;
  left: DataPoint;
  right: DataPoint;
  interpretationVi: string;
  interpretationEn: string;
  lang: "vi" | "en";
}

const tensionConfig: Record<InsightTension, { icon: string; divider: string; ring: string; badge: string; badgeBg: string }> = {
  contradicts: {
    icon: "⚡",
    divider: "vs",
    ring: "border-orange-800",
    badge: "MÂU THUẪN",
    badgeBg: "bg-orange-900 text-orange-300",
  },
  warns: {
    icon: "⚠️",
    divider: "→",
    ring: "border-red-800",
    badge: "CẢNH BÁO",
    badgeBg: "bg-red-900 text-red-300",
  },
  confirms: {
    icon: "🔗",
    divider: "+",
    ring: "border-zinc-700",
    badge: "XÁC NHẬN",
    badgeBg: "bg-zinc-800 text-zinc-400",
  },
};

export default function InsightCard({
  tension, headlineVi, headlineEn,
  left, right, interpretationVi, interpretationEn, lang,
}: Props) {
  const c = tensionConfig[tension];
  const headline = lang === "vi" ? headlineVi : headlineEn;
  const interpretation = lang === "vi" ? interpretationVi : interpretationEn;

  return (
    <div className={`rounded-xl border ${c.ring} bg-zinc-950 p-5 space-y-4`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${c.badgeBg}`}>
            {c.icon} {lang === "vi" ? c.badge : c.badge.replace("MÂU THUẪN","CONTRADICTION").replace("CẢNH BÁO","WARNING").replace("XÁC NHẬN","SIGNAL")}
          </span>
          <p className="text-sm font-semibold text-white mt-2 leading-snug">{headline}</p>
        </div>
      </div>

      {/* Two data points */}
      <div className="flex items-center gap-3">
        <div className="flex-1 text-center">
          <div className="text-xl font-black text-white">{left.value}</div>
          <div className="text-xs text-zinc-500 mt-0.5">{left.label}</div>
          {left.sub && <div className="text-xs text-zinc-600">{left.sub}</div>}
        </div>

        <div className="text-zinc-600 font-bold text-lg shrink-0">{c.divider}</div>

        <div className="flex-1 text-center">
          <div className="text-xl font-black text-white">{right.value}</div>
          <div className="text-xs text-zinc-500 mt-0.5">{right.label}</div>
          {right.sub && <div className="text-xs text-zinc-600">{right.sub}</div>}
        </div>
      </div>

      {/* Interpretation */}
      <p className="text-xs text-zinc-500 leading-relaxed border-t border-zinc-800 pt-3">
        {interpretation}
      </p>
    </div>
  );
}
