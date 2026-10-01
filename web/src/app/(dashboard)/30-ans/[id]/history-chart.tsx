"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { date: string; trend: number };

const fmt = (d: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(
    new Date(d),
  );

export default function CardHistoryChart({ data }: { data: Point[] }) {
  const chart = data.map((d) => ({ date: fmt(d.date), prix: d.trend }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chart} margin={{ top: 10, right: 8, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id="prix30" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={20} />
        <YAxis
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => `${v}€`}
          width={48}
        />
        <Tooltip
          formatter={(v) => [`${v as number}€`, "Tendance"]}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Area
          type="monotone"
          dataKey="prix"
          stroke="#a855f7"
          strokeWidth={2}
          fill="url(#prix30)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
