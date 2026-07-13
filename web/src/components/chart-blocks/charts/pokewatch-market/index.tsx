import { ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import { fetchMarketPulse, fetchTopMovers } from "@/lib/pokewatch";

const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const pct = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

export default async function PokewatchMarket() {
  const [pulse, up, down] = await Promise.all([
    fetchMarketPulse(),
    fetchTopMovers(5, "up"),
    fetchTopMovers(3, "down"),
  ]);

  const marketReturn = pulse.medianReturn ?? 0;
  const marketLabel =
    Math.abs(marketReturn) < 0.002
      ? "stable"
      : marketReturn > 0
        ? "en hausse"
        : "en baisse";

  return (
    <section className="flex h-full flex-col gap-3">
      <div>
        <h2 className="text-sm font-medium">Scan large du marché</h2>
        <p className="text-xs text-muted-foreground">
          {pulse.cardsScanned.toLocaleString("fr-FR")} cartes scannées ·{" "}
          {pulse.historyDays} jour(s) d&apos;historique
        </p>
      </div>

      {/* Le pouls du marché : la référence contre laquelle tout se juge */}
      <div className="rounded-md border border-border p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">
            Mouvement médian du marché
          </span>
          <span
            className={`text-lg font-semibold tabular-nums ${
              marketReturn > 0.002
                ? "text-green-600 dark:text-green-400"
                : marketReturn < -0.002
                  ? "text-red-600 dark:text-red-400"
                  : ""
            }`}
          >
            {pct.format(marketReturn)}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Le marché est <strong>{marketLabel}</strong> aujourd&apos;hui. Une
          carte n&apos;est intéressante que si elle s&apos;écarte de ce
          mouvement d&apos;ensemble : monter quand tout monte n&apos;est pas un
          signal.
        </p>
        {pulse.pctReliable !== null && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck size={12} />
            {pulse.pctReliable}% des prix jugés fiables ·{" "}
            {(pulse.cardsScanned - pulse.cardsAnalysed).toLocaleString("fr-FR")}{" "}
            cartes écartées (prix incohérent avec leurs ventes)
          </p>
        )}
      </div>

      {/* Les cartes qui s'écartent réellement du marché */}
      <div className="flex flex-grow flex-col gap-2">
        <p className="text-xs font-medium">
          Écarts au marché les plus marqués
        </p>
        {up.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Historique insuffisant : au moins deux jours sont nécessaires.
          </p>
        ) : (
          <>
            {up.map((m) => (
              <Row key={m.id_product} m={m} up />
            ))}
            {down.length > 0 && (
              <p className="mt-2 text-xs font-medium">Plus fortes baisses</p>
            )}
            {down.map((m) => (
              <Row key={m.id_product} m={m} up={false} />
            ))}
          </>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        L&apos;écart au marché est la différence entre la variation d&apos;une
        carte et celle du marché. Il ne constitue pas une alerte : c&apos;est
        une piste, dont la persistance dans le temps déterminera
        l&apos;intérêt.
      </p>
    </section>
  );
}

function Row({
  m,
  up,
}: {
  m: {
    id_product: number;
    name: string | null;
    trend: number;
    prev_trend: number;
    daily_return: number;
    excess_return: number;
  };
  up: boolean;
}) {
  const color = up
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";
  const Icon = up ? TrendingUp : TrendingDown;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2 last:border-0">
      <span className="truncate text-xs" title={m.name ?? undefined}>
        {m.name ?? `Produit ${m.id_product}`}
      </span>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-xs text-muted-foreground tabular-nums">
          {eur.format(m.prev_trend)} → {eur.format(m.trend)}
        </span>
        <span
          className={`flex w-20 items-center justify-end gap-1 text-xs font-semibold tabular-nums ${color}`}
          title={`Variation brute : ${pct.format(m.daily_return)}`}
        >
          <Icon size={12} />
          {pct.format(m.excess_return)}
        </span>
      </div>
    </div>
  );
}