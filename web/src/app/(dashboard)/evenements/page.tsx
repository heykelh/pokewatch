import Container from "@/components/container";
import { fetchEvents, fetchEventTracking } from "@/lib/pokewatch";

const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});
const pct = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});
const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const EVENT_LABELS: Record<string, string> = {
  recommandation_publique: "Recommandation publique",
  tournoi: "Résultat de tournoi",
  annonce_officielle: "Annonce officielle",
  reprint: "Réimpression annoncée",
};

export const dynamic = "force-dynamic";

export default async function EvenementsPage() {
  const events = await fetchEvents();
  const tracked = await Promise.all(
    events.map(async (e) => ({
      event: e,
      cards: await fetchEventTracking(e.id, e.event_date),
    })),
  );

  return (
    <div>
      <Container className="border-b border-border py-4">
        <h1 className="text-lg font-semibold">Événements de marché</h1>
        <p className="text-sm text-muted-foreground">
          Certains événements publics et datés peuvent déplacer les prix : une
          vidéo qui recommande des cartes, un résultat de tournoi, une
          annonce de réimpression. Le système enregistre l&apos;événement, puis
          mesure son effet réel sur les cartes concernées.
        </p>
      </Container>

      <Container className="border-b border-border py-6">
        <div className="rounded-md border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
          <p className="mb-2">
            <strong className="text-foreground">
              Ce que le système mesure, et ce qu&apos;il ne prétend pas savoir.
            </strong>
          </p>
          <p className="mb-2">
            Qu&apos;un prix monte après une recommandation publique n&apos;a
            rien de suspect : c&apos;est l&apos;effet attendu de
            l&apos;influence. Ce qui distingue une manipulation, c&apos;est
            l&apos;<strong>accumulation antérieure</strong> (quelqu&apos;un
            s&apos;est-il positionné avant de recommander ?) et la{" "}
            <strong>rechute</strong> (le prix retombe-t-il une fois
            l&apos;attention passée ?).
          </p>
          <p>
            Nous documentons des <strong>mécanismes</strong> et leurs effets
            mesurés, jamais des personnes. Aucun auteur, aucune chaîne,
            aucun compte n&apos;est nommé.
          </p>
        </div>
      </Container>

      {tracked.length === 0 ? (
        <Container className="py-8">
          <p className="text-center text-sm text-muted-foreground">
            Aucun événement enregistré.
          </p>
        </Container>
      ) : (
        tracked.map(({ event, cards }) => (
          <Container key={event.id} className="border-b border-border py-6">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                {EVENT_LABELS[event.event_type] ?? event.event_type}
              </span>
              <span className="text-xs text-muted-foreground">
                {dateFormat.format(new Date(event.event_date))}
              </span>
            </div>
            <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
              {event.description}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Carte</th>
                    <th className="px-2 py-2 text-right font-medium">
                      Prix le jour J
                    </th>
                    <th className="px-2 py-2 text-right font-medium">
                      Prix actuel
                    </th>
                    <th className="px-2 py-2 text-right font-medium">
                      Évolution
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((c) => (
                    <tr key={c.card_id} className="border-b border-border/50">
                      <td className="px-2 py-2 font-medium">{c.name}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">
                        {c.baseline_trend !== null
                          ? eur.format(c.baseline_trend)
                          : "—"}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        {c.current_trend !== null
                          ? eur.format(c.current_trend)
                          : "—"}
                      </td>
                      <td
                        className={`px-2 py-2 text-right font-semibold tabular-nums ${
                          (c.change_pct ?? 0) > 0.02
                            ? "text-green-600 dark:text-green-400"
                            : (c.change_pct ?? 0) < -0.02
                              ? "text-red-600 dark:text-red-400"
                              : ""
                        }`}
                      >
                        {c.change_pct !== null ? pct.format(c.change_pct) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Suivi en cours. Les conclusions ne seront possibles
              qu&apos;après plusieurs semaines d&apos;observation : un
              mouvement de quelques jours ne distingue pas une hausse durable
              d&apos;un emballement passager.
            </p>
          </Container>
        ))
      )}
    </div>
  );
}