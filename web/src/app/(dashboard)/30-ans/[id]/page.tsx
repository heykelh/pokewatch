import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Container from "@/components/container";
import { fetch30thCardDetail } from "@/lib/pokewatch";
import CardHistoryChart from "./history-chart";

export const dynamic = "force-dynamic";

const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});
const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
});

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { card, history, stats } = await fetch30thCardDetail(Number(id));

  if (!card) {
    return (
      <Container className="py-8">
        <Link href="/30-ans" className="text-sm text-muted-foreground">
          ← Retour
        </Link>
        <p className="mt-4 text-sm">Carte introuvable.</p>
      </Container>
    );
  }

  const variation = card.variation_pct;
  const varColor =
    variation === null
      ? ""
      : variation > 0
        ? "text-green-600 dark:text-green-400"
        : "text-red-600 dark:text-red-400";

  return (
    <div>
      <Container className="border-b border-border py-4">
        <Link
          href="/30-ans"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} /> Retour au set 30 ans
        </Link>
      </Container>

      <Container className="border-b border-border py-6">
        <div className="flex flex-col gap-6 tablet:flex-row">
          {/* Visuel */}
          <div className="mx-auto w-48 shrink-0 tablet:mx-0">
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
              {card.image_url ? (
                <Image
                  src={card.image_url}
                  alt={card.nom}
                  fill
                  sizes="192px"
                  className="object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center border-2 border-dashed border-border text-center text-xs text-muted-foreground">
                  Image à venir
                </div>
              )}
            </div>
          </div>

          {/* Infos */}
          <div className="flex-grow">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-600 dark:text-purple-400">
                {card.categorie}
              </span>
              <span className="text-xs text-muted-foreground">
                N° {card.card_number}
              </span>
            </div>
            <h1 className="mb-4 text-2xl font-semibold">{card.nom}</h1>

            <div className="grid grid-cols-2 gap-4 laptop:grid-cols-4">
              <div>
                <div className="text-xs text-muted-foreground">
                  Prix de sortie
                </div>
                <div className="text-lg font-semibold tabular-nums">
                  {card.prix_debut !== null ? eur.format(card.prix_debut) : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Prix actuel
                </div>
                <div className="text-lg font-semibold tabular-nums">
                  {card.prix_actuel !== null
                    ? eur.format(card.prix_actuel)
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Variation</div>
                <div className={`text-lg font-semibold tabular-nums ${varColor}`}>
                  {variation !== null
                    ? `${variation > 0 ? "+" : ""}${variation}%`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Suivi</div>
                <div className="text-lg font-semibold tabular-nums">
                  {stats.jours} j
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-6 text-xs text-muted-foreground">
              <span>
                Plus haut :{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {stats.plusHaut !== null ? eur.format(stats.plusHaut) : "—"}
                </span>
              </span>
              <span>
                Plus bas :{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {stats.plusBas !== null ? eur.format(stats.plusBas) : "—"}
                </span>
              </span>
            </div>
          </div>
        </div>
      </Container>

      {/* Graphe de trajectoire */}
      <Container className="border-b border-border py-6">
        <h2 className="mb-3 text-base font-semibold">
          Trajectoire du prix depuis le suivi
        </h2>
        {history.length >= 2 ? (
          <CardHistoryChart data={history} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Historique insuffisant pour tracer une courbe.
          </p>
        )}
      </Container>

      {/* Tableau des prix quotidiens */}
      <Container className="py-6">
        <h2 className="mb-3 text-base font-semibold">Relevés quotidiens</h2>
        <div className="overflow-x-auto">
          <table className="w-full max-w-md text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-2 py-2 font-medium">Date</th>
                <th className="px-2 py-2 text-right font-medium">Tendance</th>
              </tr>
            </thead>
            <tbody>
              {[...history].reverse().map((h) => (
                <tr key={h.date} className="border-b border-border/50">
                  <td className="px-2 py-2 text-muted-foreground">
                    {dateFmt.format(new Date(h.date))}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {eur.format(h.trend)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </div>
  );
}
