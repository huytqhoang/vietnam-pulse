"use client";
import type { SqueezeLevel } from "@/lib/squeeze";
import type { Lang } from "@/lib/i18n";
import { tr } from "@/lib/i18n";

interface Props {
  level: SqueezeLevel;
  score: number;
  lang: Lang;
}

const config: Record<SqueezeLevel, { color: string; bg: string; ring: string; emoji: string; bar: string }> = {
  low:      { color: "text-emerald-400", bg: "bg-emerald-950", ring: "ring-emerald-500", emoji: "🟢", bar: "bg-emerald-500" },
  moderate: { color: "text-yellow-400",  bg: "bg-yellow-950",  ring: "ring-yellow-500",  emoji: "🟡", bar: "bg-yellow-500"  },
  high:     { color: "text-orange-400",  bg: "bg-orange-950",  ring: "ring-orange-500",  emoji: "🔴", bar: "bg-orange-500"  },
  critical: { color: "text-red-400",     bg: "bg-red-950",     ring: "ring-red-500",     emoji: "🚨", bar: "bg-red-500"     },
};

const labelKey: Record<SqueezeLevel, keyof typeof import("@/lib/i18n").t> = {
  low:      "squeezeLow",
  moderate: "squeezeMedium",
  high:     "squeezeHigh",
  critical: "squeezeCritical",
};

export default function SqueezeGauge({ level, score, lang }: Props) {
  const c = config[level];
  const label = tr(labelKey[level], lang);

  return (
    <div className={`rounded-2xl ${c.bg} ring-2 ${c.ring} p-6 sm:p-8 text-center`}>
      <p className="text-sm text-zinc-400 uppercase tracking-widest mb-2">
        {tr("squeezeTitle", lang)}
      </p>

      <div className={`text-6xl sm:text-8xl font-black ${c.color} leading-none mb-1`}>
        {c.emoji} {label.toUpperCase()}
      </div>

      <p className="text-zinc-500 text-sm mt-3 mb-4">
        Score: {score}/100
      </p>

      {/* Progress bar */}
      <div className="w-full bg-zinc-800 rounded-full h-3 max-w-sm mx-auto">
        <div
          className={`${c.bar} h-3 rounded-full transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Scale labels */}
      <div className="flex justify-between max-w-sm mx-auto mt-1 text-xs text-zinc-600">
        <span>Thấp / Low</span>
        <span>Vừa / Mid</span>
        <span>Cao / High</span>
      </div>
    </div>
  );
}
