import { Activity, AlertTriangle, CalendarDays, Eye } from "lucide-react";
import Link from "next/link";
import Container from "@/components/container";
import { fetchKpis, fetchMarketPulse } from "@/lib/pokewatch";

const numberFormat = new Intl.NumberFormat("fr-FR");

export default async function PokewatchMetrics() {
  const [kpis, pulse] = await Promise.all([fetchKpis(), fetchMarketPulse()]);

  const metrics = [
    {
      title: "Cartes scannées",
      value: numberFormat.format(pulse.cardsScanned),
      note: "Scan large du catalogue",
      icon: Eye,
      href: null,
    },
    {
      title: "Cartes analysées",
      value: numberFormat.format(pulse.cardsAnalysed),
      note: "Cartes ayant coté ce jour",
      icon: Activity,
      href: null,
    },
    {
      title: "Anomalies du jour",
      value: numberFormat.format(kpis.anomaliesToday),
      note: "Voir le détail →",
      icon: AlertTriangle,
      href: "/anomalies",
    },
    {
      title: "Jours d'historique",
      value: numberFormat.format(Math.max(kpis.historyDays, pulse.historyDays)),
      note: "Collecte quotidienne",
      icon: CalendarDays,
      href: null,
    },
  ];

  return (
    <Container className="grid grid-cols-2 gap-y-6 border-b border-border py-6 laptop:grid-cols-4">
      {metrics.map((metric) => {
        const content = (
          <div className="flex flex-col gap-1 px-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <metric.icon size={16} />
              <span>{metric.title}</span>
            </div>
            <div className="text-2xl font-semibold">{metric.value}</div>
            <div className="text-xs text-muted-foreground">{metric.note}</div>
          </div>
        );
        return metric.href ? (
          <Link
            key={metric.title}
            href={metric.href}
            className="transition-colors hover:bg-muted/50 rounded-md"
          >
            {content}
          </Link>
        ) : (
          <div key={metric.title}>{content}</div>
        );
      })}
    </Container>
  );
}
