import { CheckCircle2, XCircle } from "lucide-react";
import { fetchPipelineStatus } from "@/lib/pokewatch";

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default async function PokewatchPipeline() {
  const status = await fetchPipelineStatus();
  const isFresh =
    status.lastSnapshotDate !== null &&
    Date.now() - new Date(status.lastSnapshotDate).getTime() 
      2 * 86_400_000;

  return (
    <section className="flex h-full flex-col gap-2">
      <div>
        <h2 className="text-sm font-medium">État du pipeline</h2>
        <p className="text-xs text-muted-foreground">
          Santé de la collecte quotidienne
        </p>
      </div>
      <div className="flex flex-grow flex-col justify-center gap-4">
        <div className="flex items-center gap-3">
          {isFresh ? (
            <CheckCircle2 className="text-green-500" size={20} />
          ) : (
            <XCircle className="text-red-500" size={20} />
          )}
          <div>
            <div className="text-sm font-medium">
              {isFresh ? "Collecte opérationnelle" : "Collecte en retard"}
            </div>
            <div className="text-xs text-muted-foreground">
              Dernier snapshot :{" "}
              {status.lastSnapshotDate
                ? dateFormat.format(new Date(status.lastSnapshotDate))
                : "jamais"}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-semibold tabular-nums">
              {status.snapshotsOnLastDate}
            </div>
            <div className="text-xs text-muted-foreground">
              cartes snapshotées
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums">
              {status.coveragePct}%
            </div>
            <div className="text-xs text-muted-foreground">
              couverture watchlist
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Ingestion automatique chaque matin à 06h30 UTC via GitHub Actions.
        </p>
      </div>
    </section>
  );
}