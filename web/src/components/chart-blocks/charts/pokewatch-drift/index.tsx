import { fetchMarketPulseHistory } from "@/lib/pokewatch";
import DriftChart from "./drift-chart";

export default async function PokewatchDrift() {
  const history = await fetchMarketPulseHistory(30);

  return (
    <section className="flex h-full flex-col gap-3">
      <div>
        <h2 className="text-sm font-medium">Dérive du marché</h2>
        <p className="text-xs text-muted-foreground">
          Mouvement médian quotidien des cartes qui cotent. Structurellement
          négatif : l&apos;indicateur de référence s&apos;érode, alors que le
          prix des transactions monte.
        </p>
      </div>
      <div className="flex-grow">
        <DriftChart data={history} />
      </div>
    </section>
  );
}
