"use client";

import { VChart } from "@visactor/react-vchart";
import type { IBarChartSpec } from "@visactor/vchart";
import type { AnomalyTimelinePoint } from "@/lib/pokewatch";

const RULE_LABELS: Record<string, string> = {
  low_above_trend: "R1 · Plancher > Réf.",
  avg1_divergence: "R2 · Divergence",
  low_jump: "R3 · Saut du plancher",
  trend_zscore: "R4 · Statistique",
  set_wave: "R5 · Vague intra-set",
};

const RULE_DOMAIN = [
  "R1 · Plancher > Réf.",
  "R2 · Divergence",
  "R3 · Saut du plancher",
  "R4 · Statistique",
  "R5 · Vague intra-set",
];

const RULE_RANGE = ["#ef4444", "#f59e0b", "#f97316", "#a855f7", "#3b82f6"];

const generateSpec = (data: AnomalyTimelinePoint[]): IBarChartSpec => ({
  type: "bar",
  data: [
    {
      id: "anomalyData",
      values: data.map((d) => ({
        date: d.date.slice(5), // "2026-07-11" -> "07-11", plus lisible en axe
        rule: RULE_LABELS[d.rule] ?? d.rule,
        count: d.count,
      })),
    },
  ],
  xField: "date",
  yField: "count",
  seriesField: "rule",
  stack: true,
  padding: [10, 0, 10, 0],
  color: {
    type: "ordinal",
    domain: RULE_DOMAIN,
    range: RULE_RANGE,
  },
  legends: {
    visible: true,
    position: "start",
    orient: "top",
  },
  tooltip: {
    trigger: ["click", "hover"],
  },
  bar: {
    state: {
      hover: {
        outerBorder: {
          distance: 2,
          lineWidth: 2,
        },
      },
    },
    style: {
      cornerRadius: [4, 4, 4, 4],
    },
  },
});

export default function Chart({ data }: { data: AnomalyTimelinePoint[] }) {
  const spec = generateSpec(data);
  return <VChart spec={spec} />;
}