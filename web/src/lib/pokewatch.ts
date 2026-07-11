import { supabase } from "./supabase";

export type KpiData = {
  watchlistCount: number;
  anomaliesToday: number;
  maxSeverityToday: number | null;
  historyDays: number;
};

export async function fetchKpis(): Promise<KpiData> {
  const today = new Date().toISOString().slice(0, 10);

  const [cards, anomalies, history] = await Promise.all([
    supabase
      .from("cards")
      .select("id", { count: "exact", head: true })
      .eq("watchlist", true),
    supabase
      .from("anomalies")
      .select("severity")
      .eq("detected_date", today)
      .order("severity", { ascending: false }),
    supabase
      .from("cm_price_snapshots")
      .select("snapshot_date")
      .order("snapshot_date", { ascending: true })
      .limit(1),
  ]);

  const firstDate = history.data?.[0]?.snapshot_date;
  const historyDays = firstDate
    ? Math.floor((Date.now() - new Date(firstDate).getTime()) / 86_400_000) + 1
    : 0;

  return {
    watchlistCount: cards.count ?? 0,
    anomaliesToday: anomalies.data?.length ?? 0,
    maxSeverityToday: anomalies.data?.[0]?.severity ?? null,
    historyDays,
  };
}

export type AnomalyRow = {
  card_id: string;
  detected_date: string;
  rule: string;
  severity: number;
  status: string;
  details: {
    reading?: string;
    [key: string]: unknown;
  };
  cards: {
    name: string;
    set_name: string | null;
    image_url: string | null;
  } | null;
};

export async function fetchAnomalies(limit = 100): Promise<AnomalyRow[]> {
  const { data, error } = await supabase
    .from("anomalies")
    .select(
      "card_id, detected_date, rule, severity, status, details, cards(name, set_name, image_url)",
    )
    .order("detected_date", { ascending: false })
    .order("severity", { ascending: false })
    .limit(limit);

  if (error) {
    // eslint-disable-next-line no-console -- trace serveur volontaire : seul indice en cas d'échec de requête en prod
    console.error("fetchAnomalies:", error.message);
    return [];
  }
  return (data ?? []) as unknown as AnomalyRow[];
}

export type AnomalyTimelinePoint = {
  date: string;
  rule: string;
  count: number;
};

export async function fetchAnomalyTimeline(
  days = 30,
): Promise<AnomalyTimelinePoint[]> {
  const since = new Date(Date.now() - days * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const { data, error } = await supabase
    .from("anomalies")
    .select("detected_date, rule")
    .gte("detected_date", since)
    .order("detected_date", { ascending: true });

  if (error) {
    // eslint-disable-next-line no-console -- trace serveur volontaire
    console.error("fetchAnomalyTimeline:", error.message);
    return [];
  }

  // Agrégation date × règle (les volumes actuels rendent le group-by côté JS trivial ;
  // on passera par une vue SQL si l'historique devient massif)
  const buckets = new Map<string, number>();
  for (const row of data ?? []) {
    const key = `${row.detected_date}|${row.rule}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.entries()).map(([key, count]) => {
    const [date, rule] = key.split("|");
    return { date, rule, count };
  });
}

export type RuleDistribution = {
  rule: string;
  count: number;
};

export async function fetchRuleDistribution(
  days = 30,
): Promise<RuleDistribution[]> {
  const since = new Date(Date.now() - days * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const { data, error } = await supabase
    .from("anomalies")
    .select("rule")
    .gte("detected_date", since);

  if (error) {
    // eslint-disable-next-line no-console -- trace serveur volontaire
    console.error("fetchRuleDistribution:", error.message);
    return [];
  }

  const buckets = new Map<string, number>();
  for (const row of data ?? []) {
    buckets.set(row.rule, (buckets.get(row.rule) ?? 0) + 1);
  }
  return Array.from(buckets.entries())
    .map(([rule, count]) => ({ rule, count }))
    .sort((a, b) => b.count - a.count);
}

export type SetDistribution = {
  setName: string;
  count: number;
};

export async function fetchTopFlaggedSets(
  days = 30,
  limit = 6,
): Promise<SetDistribution[]> {
  const since = new Date(Date.now() - days * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const { data, error } = await supabase
    .from("anomalies")
    .select("cards(set_name)")
    .gte("detected_date", since);

  if (error) {
    // eslint-disable-next-line no-console -- trace serveur volontaire
    console.error("fetchTopFlaggedSets:", error.message);
    return [];
  }

  const buckets = new Map<string, number>();
  for (const row of data ?? []) {
    const setName =
      (row.cards as unknown as { set_name: string | null } | null)?.set_name ??
      "Inconnu";
    buckets.set(setName, (buckets.get(setName) ?? 0) + 1);
  }
  return Array.from(buckets.entries())
    .map(([setName, count]) => ({ setName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export type PipelineStatus = {
  lastSnapshotDate: string | null;
  snapshotsOnLastDate: number;
  watchlistCount: number;
  coveragePct: number;
};

export async function fetchPipelineStatus(): Promise<PipelineStatus> {
  const last = await supabase
    .from("cm_price_snapshots")
    .select("snapshot_date")
    .order("snapshot_date", { ascending: false })
    .limit(1);

  const lastDate = last.data?.[0]?.snapshot_date ?? null;

  const [snapshots, cards] = await Promise.all([
    lastDate
      ? supabase
          .from("cm_price_snapshots")
          .select("id", { count: "exact", head: true })
          .eq("snapshot_date", lastDate)
      : Promise.resolve({ count: 0 }),
    supabase
      .from("cards")
      .select("id", { count: "exact", head: true })
      .eq("watchlist", true),
  ]);

  const snapCount = snapshots.count ?? 0;
  const cardCount = cards.count ?? 0;

  return {
    lastSnapshotDate: lastDate,
    snapshotsOnLastDate: snapCount,
    watchlistCount: cardCount,
    coveragePct: cardCount > 0 ? Math.round((snapCount / cardCount) * 100) : 0,
  };
}