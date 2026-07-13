import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { fetchPipelineHealth } from "@/lib/pokewatch";

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const shortDate = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
});

export default async function PokewatchPipeline() {
  const health = await fetchPipelineHealth();

  const FRESHNESS_LIMIT_MS = 2 * 86_400_000;
  const age = health.lastDay
    ? Date.now() - new Date(health.lastDay).getTime()
    : Number.POSITIVE_INFINITY;
  const isFresh = age < FRESHNESS_LIMIT_MS;
  const hasGaps = health.daysMissing > 0;

  return (
    <section className="flex h-full flex-col gap-3">
      <div>
        <h2 className="text-sm font-medium">État du pipeline</h2>
        <p className="text-xs text-muted-foreground">
          Le système surveille sa propre collecte
        </p>
      </div>

      <div className="flex items-center gap-3">
        {isFresh ? (
          <CheckCircle2 className="shrink-0 text-green-500" size={20} />
        ) : (
          <XCircle className="shrink-0 text-red-500" size={20} />
        )}
        <div>
          <div className="text-sm font-medium">
            {isFresh ? "Collecte à jour" : "Collecte en retard"}
          </div>
          <div className="text-xs text-muted-foreground">
            Dernier relevé :{" "}
            {health.lastDay
              ? dateFormat.format(new Date(health.lastDay))
              : "jamais"}
          </div>
        </div>
      </div>

      {hasGaps ? (
        <div className="flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
          <AlertCircle
            className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
            size={16}
          />
          <div className="text-xs">
            <div className="font-medium text-foreground">
              {health.daysMissing} jour(s) manquant(s) dans l&apos;historique
            </div>
            <div className="mt-1 text-muted-foreground">
              {health.missingDates
                .map((d) => shortDate.format(new Date(d)))
                .join(", ")}
            </div>
            <div className="mt-1 text-muted-foreground">
              Les données de marché ne sont disponibles que le jour même :
              un jour manqué est définitivement perdu.
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-md border border-green-500/30 bg-green-500/5 p-3">
          <CheckCircle2
            className="shrink-0 text-green-600 dark:text-green-400"
            size={16}
          />
          <div className="text-xs">
            <span className="font-medium text-foreground">
              Historique complet
            </span>
            <span className="text-muted-foreground">
              {" "}
              · aucun jour manquant depuis le début de la collecte
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-2xl font-semibold tabular-nums">
            {health.daysCollected}
          </div>
          <div className="text-xs text-muted-foreground">
            jours d&apos;historique
          </div>
        </div>
        <div>
          <div className="text-2xl font-semibold tabular-nums">
            {health.cardsLastDay.toLocaleString("fr-FR")}
          </div>
          <div className="text-xs text-muted-foreground">
            cartes au dernier relevé
          </div>
        </div>
      </div>
    </section>
  );
}