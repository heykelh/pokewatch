import { TrendingUp } from "lucide-react";
import { fetchMarketStatus, fetchTopMovers } from "@/lib/pokewatch";

const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const pct = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 1,
});

export default async function PokewatchMarket() {
  const [status, movers] = await Promise.all([
    fetchMarketStatus(),
    fetchTopMovers(8),
  ]);

  return (
    <section className="flex h-full flex-col gap-2">
      <div>
        <h2 className="text-sm font-medium">Scan large du marché</h2>
        <p className="text-xs text-muted-foreground">
          {status.cardsCovered.toLocaleString("fr-FR")} cartes scannées ·{" "}
          {status.historyDays} jour(s) d&apos;historique · plus fortes hausses
          du jour
        </p>
      </div>
      <div className="flex flex-grow flex-col gap-2 py-2">
        {movers.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Historique insuffisant : au moins deux jours sont nécessaires pour
            mesurer une variation.
          </p>
        ) : (
          movers.map((m) => (
            <div
              key={m.id_product}
              className="flex items-center justify-between gap-3 border-b border-border/50 pb-2 last:border-0"
            >
              <span className="truncate text-xs" title={m.name ?? undefined}>
                {m.name ?? `Produit ${m.id_product}`}
              </span>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {eur.format(m.prev_trend)} → {eur.format(m.trend)}
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold tabular-nums text-green-600 dark:text-green-400">
                  <TrendingUp size={12} />
                  {pct.format(m.daily_return)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}