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