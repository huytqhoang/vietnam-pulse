"use client";
import type { ReactNode } from "react";

interface Props {
  label: string;
  value: string;
  subtext: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  icon: ReactNode;
  highlight?: boolean;
}

const trendStyles = {
  up:      { color: "text-red-400",     arrow: "↑" },
  down:    { color: "text-emerald-400", arrow: "↓" },
  neutral: { color: "text-zinc-500",    arrow: "→" },
};

export default function MetricCard({
  label, value, subtext, trend = "neutral", trendLabel, icon, highlight
}: Props) {
  const ts = trendStyles[trend];
  return (
    <div className={`rounded-xl p-5 border ${highlight ? "border-orange-700 bg-orange-950/40" : "border-zinc-800 bg-zinc-900"}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-zinc-400 text-xl">{icon}</span>
        <span className="text-xs text-zinc-500 uppercase tracking-wide">{label}</span>
      </div>

      <div className="text-2xl sm:text-3xl font-bold text-white leading-tight">
        {value}
      </div>

      {trendLabel && (
        <div className={`text-sm mt-1 font-medium ${ts.color}`}>
          {ts.arrow} {trendLabel}
        </div>
      )}

      <p className="text-xs text-zinc-600 mt-2 leading-snug">{subtext}</p>
    </div>
  );
}
