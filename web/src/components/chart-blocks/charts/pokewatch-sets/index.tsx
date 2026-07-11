import { fetchTopFlaggedSets } from "@/lib/pokewatch";

export default async function PokewatchSets() {
  const sets = await fetchTopFlaggedSets(30);
  const max = sets[0]?.count ?? 1;

  return (
    <section className="flex h-full flex-col gap-2">
      <div>
        <h2 className="text-sm font-medium">Sets les plus flaggés</h2>
        <p className="text-xs text-muted-foreground">
          Concentration des alertes par set — 30 derniers jours
        </p>
      </div>
      <div className="flex flex-grow flex-col justify-center gap-3 py-2">
        {sets.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Pas encore de données.
          </p>
        ) : (
          sets.map((s) => (
            <div key={s.setName} className="flex items-center gap-3">
              <span className="w-40 truncate text-xs" title={s.setName}>
                {s.setName}
              </span>
              <div className="h-2 flex-grow overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${(s.count / max) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs font-semibold tabular-nums">
                {s.count}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}