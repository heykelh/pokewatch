import { fetchAnomalyTimeline } from "@/lib/pokewatch";
import Chart from "./chart";

export default async function PokewatchAnomalies() {
  const data = await fetchAnomalyTimeline(30);

  return (
    <section className="flex h-full flex-col gap-2">
      <div>
        <h2 className="text-sm font-medium">Anomalies par jour</h2>
        <p className="text-xs text-muted-foreground">
          Volume quotidien d&apos;alertes, empilé par règle de détection — 30
          derniers jours
        </p>
      </div>
      <div className="relative min-h-64 flex-grow">
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Pas encore de données.
          </p>
        ) : (
          <Chart data={data} />
        )}
      </div>
    </section>
  );
}