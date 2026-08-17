"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { date: string; fortes: number };

const fmtDate = (d: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(
    new Date(d),
  );

export default function ActivityChart({ data }: { data: Point[] }) {
  const chartData = data.map((d) => ({ date: fmtDate(d.date), n: d.fortes }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 10, right: 8, bottom: 0, left: -20 }}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis tick={{ fontSize: 10 }} width={32} allowDecimals={false} />
        <Tooltip
          formatter={(v) => [v as number, "Anomalies fortes"]}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Bar dataKey="n" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
