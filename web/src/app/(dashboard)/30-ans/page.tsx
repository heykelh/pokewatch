import Image from "next/image";
import Container from "@/components/container";
import {
  fetch30thCards,
  fetch30thSummary,
  fetch30thTranches,
  type Card30th,
} from "@/lib/pokewatch";
import Link from "next/link";

export const dynamic = "force-dynamic";

const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function variationColor(v: number | null): string {
  if (v === null) return "text-muted-foreground";
  if (v > 0) return "text-green-600 dark:text-green-400";
  if (v <= -60) return "text-red-700 dark:text-red-500";
  if (v <= -40) return "text-red-600 dark:text-red-400";
  if (v <= -20) return "text-orange-600 dark:text-orange-400";
  return "text-amber-600 dark:text-amber-400";
}

function CardTile({ c }: { c: Card30th }) {
  const seStabilise =
    c.vol_3j !== null &&
    c.vol_totale !== null &&
    c.vol_totale > 0 &&
    c.vol_3j < c.vol_totale * 0.4;

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="relative aspect-[3/4] bg-muted">
        {c.image_url ? (
          <Image
            src={c.image_url}
            alt={c.nom}
            fill
            sizes="(max-width: 768px) 40vw, 180px"
            className="object-contain"
          />
        ) : (
          <div className="flex h-full items-center justify-center border-2 border-dashed border-border p-2 text-center text-xs text-muted-foreground">
            Image à venir
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-2">
        <div className="truncate text-xs font-medium" title={c.nom}>
          {c.nom}
        </div>
        <div className="text-[10px] text-muted-foreground">
          {c.set_code === "30th-c" ? "Classic" : "Set"} · {c.card_number}
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs tabular-nums">
            {c.prix_actuel !== null ? eur.format(c.prix_actuel) : "—"}
          </span>
          <span
            className={`text-xs font-semibold tabular-nums ${variationColor(c.variation_pct)}`}
          >
            {c.variation_pct !== null
              ? `${c.variation_pct > 0 ? "+" : ""}${c.variation_pct}%`
              : "—"}
          </span>
        </div>
        {c.prix_debut !== null && c.prix_actuel !== null && (
          <div className="text-[10px] text-muted-foreground tabular-nums">
            {eur.format(c.prix_debut)} → {eur.format(c.prix_actuel)}
          </div>
        )}
        {c.vol_3j !== null && (
          <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
            <span title="Volatilité depuis la sortie">
              tot {c.vol_totale}%
            </span>
            <span title="Volatilité sur 7 jours">7j {c.vol_7j}%</span>
            <span
              title="Volatilité sur 3 jours"
              className={
                seStabilise
                  ? "font-semibold text-green-600 dark:text-green-400"
                  : ""
              }
            >
              3j {c.vol_3j}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function TrenteAnsPage() {
  const [cards, summary, tranches] = await Promise.all([
    fetch30thCards(),
    fetch30thSummary(),
    fetch30thTranches(),
  ]);

  // Tri par ordre du set : set principal (1→158) d'abord, puis Classic
  // Collection (1→30). Les numeros non-chiffres (Mew RGB : R, G) vont en fin.
  const numero = (c: Card30th): number => {
    const n = parseInt(c.card_number ?? "", 10);
    return Number.isNaN(n) ? 9999 : n;
  };
  const parSet = [...cards].sort((a, b) => {
    if (a.set_code !== b.set_code) {
      return a.set_code === "30th" ? -1 : 1;
    }
    return numero(a) - numero(b);
  });

  const maxTrancheChute = Math.max(
    ...tranches.map((t) => Math.abs(t.chuteMoyenne)),
    1,
  );

  return (
    <div>
      <Container className="border-b border-border py-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-600 dark:text-purple-400">
            Cas d&apos;étude
          </span>
          <span className="text-xs text-muted-foreground">
            Set sorti le 16 septembre 2026 · suivi depuis la sortie
          </span>
        </div>
        <h1 className="mb-3 text-2xl font-semibold">
          30th Celebration : anatomie d&apos;une correction post-hype
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Le set anniversaire des 30 ans du Pokémon TCG est sorti mondialement
          le 16 septembre, porté par une demande maximale. Deux semaines plus
          tard, ses prix se corrigent violemment. Ce n&apos;est pas une
          anomalie : c&apos;est le fonctionnement normal d&apos;un marché neuf
          où le prix de sortie, largement spéculatif, retombe à mesure que
          l&apos;offre se matérialise. Voici cette correction, mesurée sur nos
          données.
        </p>
      </Container>

      {/* Bandeau de métriques */}
      <Container className="border-b border-border py-6">
        <div className="grid grid-cols-2 gap-4 laptop:grid-cols-4">
          <div className="rounded-lg border border-border p-4">
            <div className="text-2xl font-bold tabular-nums">
              {summary.totalCards}
            </div>
            <div className="text-xs text-muted-foreground">
              cartes suivies (≥ 2 €)
            </div>
          </div>
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
            <div className="text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">
              {summary.medianDrop}%
            </div>
            <div className="text-xs text-muted-foreground">
              chute médiane depuis la sortie
            </div>
          </div>
          <div className="rounded-lg border border-border p-4">
            <div className="text-2xl font-bold tabular-nums">
              {summary.cardsOver50Drop}
            </div>
            <div className="text-xs text-muted-foreground">
              cartes ayant perdu plus de 50 %
            </div>
          </div>
          <div className="rounded-lg border border-border p-4">
            <div
              className="truncate text-lg font-bold"
              title={summary.worstCard?.nom}
            >
              {summary.worstCard?.nom ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              la plus corrigée ·{" "}
              <span className="font-semibold text-red-600 dark:text-red-400">
                {summary.worstCard?.variation}%
              </span>
            </div>
          </div>
        </div>
      </Container>

      {/* Lecture par tranche de prix */}
      <Container className="border-b border-border py-6">
        <h2 className="mb-1 text-base font-semibold">
          C&apos;est le milieu de gamme qui souffre le plus
        </h2>
        <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
          La correction ne frappe pas uniformément. Les cartes à quelques euros
          bougent peu, et les chase cards les plus rares gardent une demande de
          collectionneurs. Ce sont les cartes intermédiaires — achetées pour
          être revendues — qui s&apos;effondrent le plus, car leur prix
          reposait surtout sur la spéculation.
        </p>
        <div className="max-w-2xl space-y-2">
          {tranches.map((t) => (
            <div key={t.tranche} className="flex items-center gap-3">
              <div className="w-28 shrink-0 text-xs text-muted-foreground">
                {t.tranche}
              </div>
              <div className="flex-grow">
                <div className="h-6 overflow-hidden rounded bg-muted">
                  <div
                    className="flex h-full items-center justify-end bg-red-500/70 pr-2 text-[10px] font-semibold text-white"
                    style={{
                      width: `${(Math.abs(t.chuteMoyenne) / maxTrancheChute) * 100}%`,
                    }}
                  >
                    {t.chuteMoyenne}%
                  </div>
                </div>
              </div>
              <div className="w-16 shrink-0 text-right text-[10px] text-muted-foreground">
                {t.cartes} cartes
              </div>
            </div>
          ))}
        </div>
      </Container>

      {/* Galerie des cartes dans l'ordre du set */}
      <Container className="border-b border-border py-6">
        <h2 className="mb-1 text-base font-semibold">
          Toutes les cartes du set, dans l&apos;ordre
        </h2>
        <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
          Set principal puis Classic Collection. Chaque prix est celui de la
          tendance Cardmarket (édition internationale), relevé quotidiennement.
          La <strong>volatilité</strong> mesure combien le prix bouge sur une
          période : plus elle est élevée, plus le marché de la carte est agité.
          Elle est affichée sur trois fenêtres — depuis la sortie (tot), 7 jours
          (7j) et 3 jours (3j). Quand la volatilité récente (3j) tombe bien en
          dessous de la volatilité totale, la carte se stabilise : sa correction
          touche à sa fin. Un{" "}
          <span className="font-semibold text-green-600 dark:text-green-400">
            3j en vert
          </span>{" "}
          signale une carte qui se pose.
        </p>
        <div className="grid grid-cols-2 gap-3 tablet:grid-cols-4 laptop:grid-cols-6">
          {parSet.map((c) => (
            <Link key={c.id_product} href={`/30-ans/${c.id_product}`}>
              <CardTile c={c} />
            </Link>
          ))}
        </div>
      </Container>

      {/* Grille de lecture */}
      <Container className="py-6">
        <h2 className="mb-3 text-base font-semibold">Comment lire ce cas</h2>
        <div className="grid max-w-4xl gap-3 laptop:grid-cols-3">
          <div className="rounded-lg border border-border p-4">
            <h3 className="mb-1 text-sm font-semibold">
              Le prix de sortie était une conjecture
            </h3>
            <p className="text-xs text-muted-foreground">
              Plusieurs cartes démarrent à des prix ronds — 199 €, 35 € — signe
              de mises en vente arbitraires avant que le marché ne tranche. Ces
              niveaux ne reflétaient aucune transaction réelle, seulement le
              pari des premiers vendeurs.
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <h3 className="mb-1 text-sm font-semibold">
              L&apos;offre rattrape la demande
            </h3>
            <p className="text-xs text-muted-foreground">
              À la sortie, l&apos;offre est rare et la demande maximale. Chaque
              jour, des milliers de boosters sont ouverts : l&apos;offre gonfle,
              et le prix retombe vers un équilibre. La correction observée est
              la signature de ce rééquilibrage.
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <h3 className="mb-1 text-sm font-semibold">
              La pression va se prolonger
            </h3>
            <p className="text-xs text-muted-foreground">
              De nombreux produits scellés 30 ans sortent de façon échelonnée
              d&apos;ici la fin d&apos;année. Chaque vague augmentera encore
              l&apos;offre de cartes en circulation, ce qui suggère une
              poursuite de la pression baissière — à confirmer sur les
              prochaines semaines.
            </p>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-xs text-muted-foreground">
          Ce cas illustre une dynamique de marché, il ne constitue pas un
          conseil d&apos;achat ou de vente. Les moyennes par tranche portent
          sur de petits effectifs et valent pour ce set ; elles demanderaient
          à être confirmées sur d&apos;autres sorties avant toute
          généralisation.
        </p>
      </Container>
    </div>
  );
}
