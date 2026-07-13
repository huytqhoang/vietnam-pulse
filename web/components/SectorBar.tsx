"use client";

interface Sector {
  label: string;
  labelEn: string;
  pct: number;
  color: string;
  trend: "up" | "down" | "stable";
  trendNote: string;
  trendNoteEn: string;
}

interface Props {
  sectors: Sector[];
  lang: "vi" | "en";
}

const trendIcon = { up: "↑", down: "↓", stable: "→" };
const trendColor = { up: "text-red-400", down: "text-emerald-400", stable: "text-zinc-500" };

export default function SectorBar({ sectors, lang }: Props) {
  const total = sectors.reduce((s, x) => s + x.pct, 0);

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="flex w-full h-5 rounded-full overflow-hidden gap-0.5">
        {sectors.map((s) => (
          <div
            key={s.label}
            className={`${s.color} transition-all duration-700`}
            style={{ width: `${(s.pct / total) * 100}%` }}
            title={`${lang === "vi" ? s.label : s.labelEn}: ${s.pct.toFixed(1)}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {sectors.map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm ${s.color} shrink-0`} />
              <span className="text-xs text-zinc-400 truncate">
                {lang === "vi" ? s.label : s.labelEn}
              </span>
            </div>
            <div className="pl-4">
              <span className="text-sm font-bold text-white">{s.pct.toFixed(1)}%</span>
              <span className={`text-xs ml-1 ${trendColor[s.trend]}`}>
                {trendIcon[s.trend]}
              </span>
            </div>
            <p className="pl-4 text-xs text-zinc-600 leading-snug">
              {lang === "vi" ? s.trendNote : s.trendNoteEn}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
