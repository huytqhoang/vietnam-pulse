"use client";
import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from "recharts";

interface Props {
  data: { recorded_at: string; value: number }[];
  color?: string;
  label?: string;
}

export default function SparklineChart({ data, color = "#f97316", label }: Props) {
  const sorted = [...data].sort((a, b) =>
    a.recorded_at.localeCompare(b.recorded_at)
  );

  if (sorted.length < 2) {
    return (
      <div className="h-16 flex items-center justify-center text-zinc-700 text-xs">
        not enough history
      </div>
    );
  }

  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sorted}>
          <YAxis domain={["auto", "auto"]} hide />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                return (
                  <div className="bg-zinc-800 text-white text-xs px-2 py-1 rounded shadow">
                    <div>{d.recorded_at}</div>
                    <div className="font-bold">
                      {label}: {Number(d.value).toLocaleString("vi-VN")}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
