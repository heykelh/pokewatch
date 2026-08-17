import Container from "@/components/container";
import { fetchAnomalies } from "@/lib/pokewatch";

export const dynamic = "force-dynamic";

const RULE_LABELS: Record<string, string> = {
  trend_ma_divergence: "R2b · Décrochage de moyenne",
  market_divergence: "R7 · Divergence au marché",
  trend_zscore: "R4 · Écart statistique",
  low_jump: "R3b · Saut du plancher",
  set_wave: "R5b · Vague intra-extension",
  pokemon_wave: "R6b · Vague intra-Pokémon",
};

const RULE_STYLES: Record<string, string> = {
  trend_ma_divergence: "bg-green-500/10 text-green-600 dark:text-green-400",
  market_divergence: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  trend_zscore: "bg-red-500/10 text-red-600 dark:text-red-400",
  low_jump: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  set_wave: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  pokemon_wave: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
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
          Mouvements de prix anormaux identifiés par le moteur de règles. Une
          anomalie est un candidat à investigation, pas un verdict de
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
                {anomalies.map((a) => {
                  const cardName =
                    a.market_products?.name?.split(" [")[0] ??
                    `Produit ${a.id_product}`;
                  return (
                    <tr
                      key={`${a.id_product}-${a.detected_date}-${a.rule}`}
                      className="border-b border-border/50 hover:bg-muted/50"
                    >
                      <td className="whitespace-nowrap px-2 py-3 text-muted-foreground">
                        {dateFormat.format(new Date(a.detected_date))}
                      </td>
                      <td className="px-2 py-3 font-medium">
                        {cardName}
                        {a.market_products?.card_number && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {a.market_products.card_number}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-muted-foreground">
                        {a.market_products?.set_name ?? "—"}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Container>
    </div>
  );
}
