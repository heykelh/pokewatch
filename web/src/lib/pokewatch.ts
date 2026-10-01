import { supabase } from "./supabase";

export type KpiData = {
  watchlistCount: number;
  anomaliesToday: number;
  maxSeverityToday: number | null;
  historyDays: number;
};

export async function fetchKpis(): Promise<KpiData> {
  // Dernier jour reellement analyse (pas "aujourd'hui" : le pipeline peut ne
  // pas avoir tourne, ou Cardmarket ne pas avoir publie).
  const lastDay = await supabase
    .from("market_anomalies")
    .select("detected_date")
    .gt("id_product", 0)
    .order("detected_date", { ascending: false })
    .limit(1);

  const day = lastDay.data?.[0]?.detected_date;

  const [anomalies, history] = await Promise.all([
    day
      ? supabase
          .from("market_anomalies")
          .select("severity")
          .eq("detected_date", day)
          .gt("id_product", 0)
          .order("severity", { ascending: false })
      : Promise.resolve({ data: [] as { severity: number }[] }),
    supabase
      .from("market_snapshots")
      .select("snapshot_date")
      .gt("id_product", 0)
      .order("snapshot_date", { ascending: true })
      .limit(1),
  ]);

  const firstDate = history.data?.[0]?.snapshot_date;
  const historyDays = firstDate
    ? Math.floor((Date.now() - new Date(firstDate).getTime()) / 86_400_000) + 1
    : 0;

  const rows = anomalies.data ?? [];

  return {
    watchlistCount: rows.length,
    anomaliesToday: rows.length,
    maxSeverityToday: rows[0]?.severity ?? null,
    historyDays,
  };
}

export type AnomalyRow = {
  id_product: number;
  detected_date: string;
  rule: string;
  severity: number;
  status: string;
  details: {
    reading?: string;
    [key: string]: unknown;
  };
  market_products: {
    name: string | null;
    set_name: string | null;
    card_number: string | null;
  } | null;
};

export async function fetchAnomalies(limit = 100): Promise<AnomalyRow[]> {
  const { data, error } = await supabase
    .from("market_anomalies")
    .select(
      "id_product, detected_date, rule, severity, status, details, market_products(name, set_name, card_number)",
    )
    .gt("id_product", 0)
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
    .from("market_anomalies")
    .select("detected_date, rule")
    .gte("detected_date", since)
    .gt("id_product", 0)
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
    .from("market_anomalies")
    .select("rule")
    .gte("detected_date", since)
    .gt("id_product", 0);

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
    .from("market_anomalies")
    .select("market_products(set_name)")
    .gte("detected_date", since)
    .gt("id_product", 0);

  if (error) {
    // eslint-disable-next-line no-console -- trace serveur volontaire
    console.error("fetchTopFlaggedSets:", error.message);
    return [];
  }

  const buckets = new Map<string, number>();
  for (const row of data ?? []) {
    const setName =
      (row.market_products as unknown as { set_name: string | null } | null)
        ?.set_name ?? "Inconnu";
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
    .from("market_snapshots")
    .select("snapshot_date")
    .gt("id_product", 0)
    .order("snapshot_date", { ascending: false })
    .limit(1);

  const lastDate = last.data?.[0]?.snapshot_date ?? null;

  const snapshots = lastDate
    ? await supabase
        .from("market_snapshots")
        .select("id_product", { count: "exact", head: true })
        .eq("snapshot_date", lastDate)
        .gt("id_product", 0)
    : { count: 0 };

  const snapCount = snapshots.count ?? 0;

  return {
    lastSnapshotDate: lastDate,
    snapshotsOnLastDate: snapCount,
    watchlistCount: snapCount,
    coveragePct: 100,
  };
}

export type MarketPulse = {
  date: string | null;
  cardsScanned: number;
  cardsAnalysed: number;
  pctReliable: number | null;
  medianReturn: number | null;
  historyDays: number;
};

export async function fetchMarketPulse(): Promise<MarketPulse> {
  const { data } = await supabase
    .from("v_market_pulse_public")
    .select("*")
    .order("snapshot_date", { ascending: false })
    .limit(1);

  const days = await supabase
    .from("market_snapshots")
    .select("snapshot_date")
    .gt("id_product", 0) // ignore les cartes de test
    .order("snapshot_date", { ascending: true })
    .limit(1);

  const first = days.data?.[0]?.snapshot_date;
  const row = data?.[0];

  const historyDays =
    first && row?.snapshot_date
      ? Math.round(
          (new Date(row.snapshot_date).getTime() - new Date(first).getTime()) /
            86_400_000,
        ) + 1
      : 0;

  return {
    date: row?.snapshot_date ?? null,
    cardsScanned: row?.cartes_scannees ?? 0,
    cardsAnalysed: row?.cards_analysees ?? 0,
    pctReliable: row?.pct_fiable ?? null,
    medianReturn: row?.median_return ?? null,
    historyDays,
  };
}

export type MarketMover = {
  id_product: number;
  name: string | null;
  set_name: string | null;
  card_number: string | null;
  trend: number;
  prev_trend: number;
  daily_return: number;
  excess_return: number;
};

export async function fetchTopMovers(
  limit = 6,
  direction: "up" | "down" = "up",
): Promise<MarketMover[]> {
  const last = await supabase
    .from("market_snapshots")
    .select("snapshot_date")
    .gt("id_product", 0) // ignore les cartes de test (id negatifs, dates 2027)
    .order("snapshot_date", { ascending: false })
    .limit(1);

  const lastDate = last.data?.[0]?.snapshot_date;
  if (!lastDate) return [];

  const { data, error } = await supabase
    .from("v_market_movers")
    .select(
      "id_product, name, set_name, card_number, trend, prev_trend, daily_return, excess_return",
    )
    .eq("snapshot_date", lastDate)
    .gt("id_product", 0) // ceinture et bretelles : jamais de test a l'affichage
    .order("excess_return", { ascending: direction === "down" })
    .limit(limit);

  if (error) {
    // eslint-disable-next-line no-console -- trace serveur volontaire
    console.error("fetchTopMovers:", error.message);
    return [];
  }
  return (data ?? []) as MarketMover[];
}

export type DailyReport = {
  report_date: string;
  headline: string;
  body: string;
  verdict: string;
};

export async function fetchLatestReport(): Promise<DailyReport | null> {
  const { data } = await supabase
    .from("daily_reports")
    .select("report_date, headline, body, verdict")
    .neq("verdict", "donnees_indisponibles")
    .order("report_date", { ascending: false })
    .limit(1);
  return (data?.[0] as DailyReport) ?? null;
}

export async function fetchReportArchive(limit = 30): Promise<DailyReport[]> {
  const { data } = await supabase
    .from("daily_reports")
    .select("report_date, headline, body, verdict")
    .order("report_date", { ascending: false })
    .limit(limit);
  return (data ?? []) as DailyReport[];
}

export type MarketEvent = {
  id: number;
  event_date: string;
  event_type: string;
  description: string;
};

export type EventCardTrack = {
  card_id: string;
  name: string;
  baseline_trend: number | null;
  current_trend: number | null;
  change_pct: number | null;
};

export async function fetchEvents(): Promise<MarketEvent[]> {
  const { data } = await supabase
    .from("market_events")
    .select("id, event_date, event_type, description")
    .order("event_date", { ascending: false });
  return (data ?? []) as MarketEvent[];
}

export async function fetchEventTracking(
  eventId: number,
  eventDate: string,
): Promise<EventCardTrack[]> {
  const { data: links } = await supabase
    .from("market_event_cards")
    .select("card_id, cards(name)")
    .eq("event_id", eventId);

  if (!links?.length) return [];

  const cardIds = links.map((l) => l.card_id);

  const { data: snaps } = await supabase
    .from("cm_price_snapshots")
    .select("card_id, snapshot_date, trend")
    .in("card_id", cardIds)
    .gte("snapshot_date", eventDate)
    .order("snapshot_date", { ascending: true });

  return links.map((link) => {
    const rows = (snaps ?? []).filter((s) => s.card_id === link.card_id);
    const baseline = rows[0]?.trend ?? null;
    const current = rows[rows.length - 1]?.trend ?? null;
    const change =
      baseline && current && baseline > 0
        ? (current - baseline) / baseline
        : null;
    return {
      card_id: link.card_id,
      name:
        (link.cards as unknown as { name: string } | null)?.name ??
        link.card_id,
      baseline_trend: baseline,
      current_trend: current,
      change_pct: change,
    };
  });
}

export type PipelineHealth = {
  firstDay: string | null;
  lastDay: string | null;
  daysCollected: number;
  daysMissing: number;
  cardsLastDay: number;
  missingDates: string[];
};

export async function fetchPipelineHealth(): Promise<PipelineHealth> {
  const [health, missing] = await Promise.all([
    supabase.from("v_pipeline_health").select("*").limit(1),
    supabase
      .from("v_missing_days")
      .select("jour_manquant")
      .order("jour_manquant", { ascending: false })
      .limit(10),
  ]);

  const h = health.data?.[0];

  return {
    firstDay: h?.premier_jour ?? null,
    lastDay: h?.dernier_jour ?? null,
    daysCollected: h?.jours_collectes ?? 0,
    daysMissing: h?.jours_manquants ?? 0,
    cardsLastDay: h?.cartes_dernier_jour ?? 0,
    missingDates: (missing.data ?? []).map((r) => r.jour_manquant),
  };
}

export type PulsePoint = {
  date: string;
  medianReturn: number;
  cardsAnalysed: number;
};

export async function fetchMarketPulseHistory(
  days = 30,
): Promise<PulsePoint[]> {
  const { data } = await supabase
    .from("v_market_pulse_public")
    .select("snapshot_date, median_return, cards_analysees")
    .order("snapshot_date", { ascending: false })
    .limit(days);

  return (data ?? [])
    .map((r) => ({
      date: r.snapshot_date as string,
      medianReturn: (r.median_return as number) ?? 0,
      cardsAnalysed: (r.cards_analysees as number) ?? 0,
    }))
    .reverse();
}

export type ActivityPoint = { date: string; fortes: number };

export async function fetchAnomalyActivity(
  days = 30,
): Promise<ActivityPoint[]> {
  const since = new Date(Date.now() - days * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const { data } = await supabase
    .from("market_anomalies")
    .select("detected_date, rule")
    .gte("detected_date", since)
    .gt("id_product", 0)
    .in("rule", ["trend_ma_divergence", "market_divergence", "trend_zscore"]);

  const buckets = new Map<string, number>();
  for (const r of data ?? []) {
    buckets.set(r.detected_date, (buckets.get(r.detected_date) ?? 0) + 1);
  }
  return Array.from(buckets.entries())
    .map(([date, fortes]) => ({ date, fortes }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type MarketVerdict = {
  date: string | null;
  medianReturn: number | null;
  driftBaseline: number; // la derive structurelle (-1.2%)
  cardsScanned: number;
  cardsAnalysed: number;
  strongAnomalies: number;
  medianHabitual: number | null;
  p90Habitual: number | null;
  verdict: string;
  reliability: number | null;
};

export async function fetchMarketVerdict(): Promise<MarketVerdict> {
  const pulseRes = await supabase
    .from("v_market_pulse_public")
    .select("snapshot_date, median_return, cards_analysees, cartes_scannees, pct_fiable")
    .order("snapshot_date", { ascending: false })
    .limit(1);
  const pulse = pulseRes.data?.[0];
  const day = pulse?.snapshot_date ?? null;

  // Le verdict et l'activite habituelle sont deja calcules par le dossier
  // (build_daily_dossier). On les LIT, on ne les recalcule pas : une seule
  // source de verite, sinon le bloc verdict et le bilan se contredisent.
  const report = await supabase
    .from("daily_reports")
    .select("verdict, dossier")
    .neq("verdict", "donnees_indisponibles")
    .order("report_date", { ascending: false })
    .limit(1);

  const r = report.data?.[0];
  const habituelle = (r?.dossier as { activite_habituelle?: {
    mediane_anomalies_fortes?: number;
    p90_anomalies_fortes?: number;
    anomalies_fortes_aujourdhui?: number;
  } } | undefined)?.activite_habituelle;

  return {
    date: day,
    medianReturn: pulse?.median_return ?? null,
    driftBaseline: -0.012,
    cardsScanned: pulse?.cartes_scannees ?? 0,
    cardsAnalysed: pulse?.cards_analysees ?? 0,
    strongAnomalies: habituelle?.anomalies_fortes_aujourdhui ?? 0,
    medianHabitual: habituelle?.mediane_anomalies_fortes ?? null,
    p90Habitual: habituelle?.p90_anomalies_fortes ?? null,
    verdict: r?.verdict ?? "activite_normale",
    reliability: pulse?.pct_fiable ?? null,
  };
}

export type Card30th = {
  id_product: number;
  nom: string;
  set_code: string;
  card_number: string | null;
  image_url: string | null;
  categorie: string;
  premier_jour: string;
  jours: number;
  prix_debut: number | null;
  prix_actuel: number | null;
  plus_haut: number | null;
  plus_bas: number | null;
  variation_pct: number | null;
  vol_totale: number | null;
  vol_7j: number | null;
  vol_3j: number | null;
};

export async function fetch30thCards(): Promise<Card30th[]> {
  const { data, error } = await supabase
    .from("v_30th_cards")
    .select("*")
    .order("prix_actuel", { ascending: false });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("fetch30thCards:", error.message);
    return [];
  }
  return (data ?? []) as Card30th[];
}

export type TimePoint30th = {
  id_product: number;
  nom: string;
  set_code: string;
  snapshot_date: string;
  trend: number;
};

export async function fetch30thTimeseries(): Promise<TimePoint30th[]> {
  const { data, error } = await supabase
    .from("v_30th_timeseries")
    .select("*");

  if (error) {
    // eslint-disable-next-line no-console
    console.error("fetch30thTimeseries:", error.message);
    return [];
  }
  return (data ?? []) as TimePoint30th[];
}

export type Summary30th = {
  totalCards: number;
  medianDrop: number;
  worstCard: { nom: string; variation: number } | null;
  cardsOver50Drop: number;
  avgDropEx: number;
  avgDropClassic: number;
};

export async function fetch30thSummary(): Promise<Summary30th> {
  const cards = await fetch30thCards();
  const withVar = cards.filter((c) => c.variation_pct !== null);

  const variations = withVar
    .map((c) => c.variation_pct as number)
    .sort((a, b) => a - b);
  const median =
    variations.length > 0
      ? variations[Math.floor(variations.length / 2)]
      : 0;

  const worst = withVar.reduce<Card30th | null>(
    (min, c) =>
      min === null || (c.variation_pct as number) < (min.variation_pct as number)
        ? c
        : min,
    null,
  );

  const over50 = withVar.filter((c) => (c.variation_pct as number) <= -50).length;

  const ex = withVar.filter((c) => c.categorie === "Set principal");
  const classic = withVar.filter((c) => c.categorie === "Classic Collection");
  const avg = (arr: Card30th[]) =>
    arr.length
      ? arr.reduce((s, c) => s + (c.variation_pct as number), 0) / arr.length
      : 0;

  return {
    totalCards: cards.length,
    medianDrop: Math.round(median * 10) / 10,
    worstCard: worst
      ? { nom: worst.nom, variation: worst.variation_pct as number }
      : null,
    cardsOver50Drop: over50,
    avgDropEx: Math.round(avg(ex) * 10) / 10,
    avgDropClassic: Math.round(avg(classic) * 10) / 10,
  };
}

export type Tranche30th = {
  tranche: string;
  cartes: number;
  chuteMoyenne: number;
  ordre: number;
};

export async function fetch30thTranches(): Promise<Tranche30th[]> {
  const cards = await fetch30thCards();
  const withData = cards.filter(
    (c) => c.variation_pct !== null && c.prix_debut !== null,
  );

  const buckets = [
    { tranche: "150 € et +", ordre: 4, min: 150, max: Infinity },
    { tranche: "50 – 150 €", ordre: 3, min: 50, max: 150 },
    { tranche: "20 – 50 €", ordre: 2, min: 20, max: 50 },
    { tranche: "moins de 20 €", ordre: 1, min: 0, max: 20 },
  ];

  return buckets
    .map((b) => {
      const inBucket = withData.filter(
        (c) => (c.prix_debut as number) >= b.min && (c.prix_debut as number) < b.max,
      );
      const chute =
        inBucket.length > 0
          ? inBucket.reduce((s, c) => s + (c.variation_pct as number), 0) /
            inBucket.length
          : 0;
      return {
        tranche: b.tranche,
        cartes: inBucket.length,
        chuteMoyenne: Math.round(chute * 10) / 10,
        ordre: b.ordre,
      };
    })
    .filter((t) => t.cartes > 0)
    .sort((a, b) => b.ordre - a.ordre);
}

export type CardDetail30th = {
  card: Card30th | null;
  history: { date: string; trend: number }[];
  stats: {
    plusHaut: number | null;
    plusBas: number | null;
    jours: number;
  };
};

export async function fetch30thCardDetail(
  idProduct: number,
): Promise<CardDetail30th> {
  const [cardRes, histRes] = await Promise.all([
    supabase.from("v_30th_cards").select("*").eq("id_product", idProduct).limit(1),
    supabase
      .from("market_snapshots")
      .select("snapshot_date, trend")
      .eq("id_product", idProduct)
      .order("snapshot_date", { ascending: true }),
  ]);

  const card = (cardRes.data?.[0] as Card30th) ?? null;
  const history = (histRes.data ?? []).map((r) => ({
    date: r.snapshot_date as string,
    trend: Number(r.trend),
  }));

  const trends = history.map((h) => h.trend).filter((t) => t > 0);

  return {
    card,
    history,
    stats: {
      plusHaut: trends.length ? Math.max(...trends) : null,
      plusBas: trends.length ? Math.min(...trends) : null,
      jours: history.length,
    },
  };
}
