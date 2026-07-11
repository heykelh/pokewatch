"use client";

import { VChart } from "@visactor/react-vchart";
import type { IPieChartSpec } from "@visactor/vchart";
import type { RuleDistribution } from "@/lib/pokewatch";

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

const generateSpec = (data: RuleDistribution[]): IPieChartSpec => ({
  type: "pie",
  data: [
    {
      id: "ruleData",
      values: data.map((d) => ({
        rule: RULE_LABELS[d.rule] ?? d.rule,
        count: d.count,
      })),
    },
  ],
  valueField: "count",
  categoryField: "rule",
  outerRadius: 0.9,
  innerRadius: 0.6,
  padding: [10, 0, 10, 0],
  color: {
    type: "ordinal",
    domain: RULE_DOMAIN,
    range: RULE_RANGE,
  },
  legends: {
    visible: true,
    orient: "bottom",
  },
  tooltip: {
    trigger: ["click", "hover"],
  },
});

export default function Chart({ data }: { data: RuleDistribution[] }) {
  const spec = generateSpec(data);
  return <VChart spec={spec} />;
}