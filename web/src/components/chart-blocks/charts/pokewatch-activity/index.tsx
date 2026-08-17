import { fetchAnomalyActivity } from "@/lib/pokewatch";
import ActivityChart from "./activity-chart";

export default async function PokewatchActivity() {
  const activity = await fetchAnomalyActivity(30);

  return (
    <section className="flex h-full flex-col gap-3">
      <div>
        <h2 className="text-sm font-medium">Activité de détection</h2>
        <p className="text-xs text-muted-foreground">
          Anomalies fortes par jour (décrochage, divergence, écart
          statistique). Les signaux faibles ne sont pas comptés.
        </p>
      </div>
      <div className="flex-grow">
        <ActivityChart data={activity} />
      </div>
    </section>
  );
}
