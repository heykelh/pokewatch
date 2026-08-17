"use client";

import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { date: string; medianReturn: number };

const fmtDate = (d: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(
    new Date(d),
  );

export default function DriftChart({ data }: { data: Point[] }) {
  const chartData = data.map((d) => ({
    date: fmtDate(d.date),
    pct: +(d.medianReturn * 100).toFixed(2),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 10, right: 8, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="drift" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => `${v}%`}
          width={44}
        />
        <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.2} />
        <Tooltip
          formatter={(v) => [`${v as number}%`, "Médian"]}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Area
          type="monotone"
          dataKey="pct"
          stroke="#ef4444"
          strokeWidth={2}
          fill="url(#drift)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
