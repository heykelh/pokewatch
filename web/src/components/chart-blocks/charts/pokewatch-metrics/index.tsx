import { Activity, AlertTriangle, CalendarDays, Eye } from "lucide-react";
import Container from "@/components/container";
import { fetchKpis, fetchMarketStatus } from "@/lib/pokewatch";

const numberFormat = new Intl.NumberFormat("fr-FR");

export default async function PokewatchMetrics() {
  const [kpis, market] = await Promise.all([fetchKpis(), fetchMarketStatus()]);

  const metrics = [
    {
      title: "Cartes scannées",
      value: numberFormat.format(market.cardsCovered),
      note: "Scan large du catalogue",
      icon: Eye,
    },
    {
      title: "Watchlist approfondie",
      value: numberFormat.format(kpis.watchlistCount),
      note: "Suivi détaillé quotidien",
      icon: Activity,
    },
    {
      title: "Anomalies aujourd'hui",
      value: numberFormat.format(kpis.anomaliesToday),
      note: "Toutes règles confondues",
      icon: AlertTriangle,
    },
    {
      title: "Jours d'historique",
      value: numberFormat.format(
        Math.max(kpis.historyDays, market.historyDays),
      ),
      note: "Collecte quotidienne",
      icon: CalendarDays,
    },
  ];

  return (
    <Container className="grid grid-cols-2 gap-y-6 border-b border-border py-6 laptop:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.title} className="flex flex-col gap-1 px-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <metric.icon size={16} />
            <span>{metric.title}</span>
          </div>
          <div className="text-2xl font-semibold">{metric.value}</div>
          <div className="text-xs text-muted-foreground">{metric.note}</div>
        </div>
      ))}
    </Container>
  );
}