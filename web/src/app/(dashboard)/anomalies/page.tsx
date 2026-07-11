import Container from "@/components/container";
import { fetchAnomalies } from "@/lib/pokewatch";

export const dynamic = "force-dynamic";

const RULE_LABELS: Record<string, string> = {
  low_above_trend: "R1 · Plancher > Trend",
  avg1_divergence: "R2 · Divergence avg1/avg30",
  low_jump: "R3 · Saut du plancher",
  trend_zscore: "R4 · Z-score",
  set_wave: "R5 · Vague intra-set",
};

const RULE_STYLES: Record<string, string> = {
  low_above_trend: "bg-red-500/10 text-red-600 dark:text-red-400",
  avg1_divergence: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  low_jump: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  trend_zscore: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  set_wave: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
});

export default async function AnomaliesPage() {
  const anomalies = await fetchAnomalies();

  return (
    <div>
      <Container className="border-b border-border py-4">
        <h1 className="text-lg font-semibold">Anomalies détectées</h1>
        <p className="text-sm text-muted-foreground">
          Mouvements de prix anormaux identifiés par le moteur de règles.
          Une anomalie est un candidat à investigation, pas un verdict de
          manipulation.
        </p>
      </Container>
      <Container className="py-4">
        {anomalies.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucune anomalie enregistrée pour le moment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="px-2 py-3 font-medium">Date</th>
                  <th className="px-2 py-3 font-medium">Carte</th>
                  <th className="px-2 py-3 font-medium">Set</th>
                  <th className="px-2 py-3 font-medium">Règle</th>
                  <th className="px-2 py-3 text-right font-medium">Sévérité</th>
                  <th className="hidden px-2 py-3 font-medium laptop:table-cell">
                    Lecture
                  </th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((a) => (
                  <tr
                    key={`${a.card_id}-${a.detected_date}-${a.rule}`}
                    className="border-b border-border/50 hover:bg-muted/50"
                  >
                    <td className="whitespace-nowrap px-2 py-3 text-muted-foreground">
                      {dateFormat.format(new Date(a.detected_date))}
                    </td>
                    <td className="px-2 py-3 font-medium">
                      {a.cards?.name ?? a.card_id}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {a.card_id}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {a.cards?.set_name ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3">
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-medium ${RULE_STYLES[a.rule] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {RULE_LABELS[a.rule] ?? a.rule}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right font-semibold tabular-nums">
                      {a.severity}
                    </td>
                    <td className="hidden max-w-md px-2 py-3 text-xs text-muted-foreground laptop:table-cell">
                      {a.details?.reading ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Container>
    </div>
  );
}