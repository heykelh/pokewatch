def get_watchlist() -> list[str]:
    res = supabase.table("cards").select("id").eq("watchlist", True).execute()
    return [row["id"] for row in res.data]

def main() -> None:
    watchlist = get_watchlist()
    print(f"{len(watchlist)} cartes en watchlist")
    ok = 0
    with httpx.Client(timeout=15) as client:
        for card_id in watchlist:
            ingest_card(client, card_id)
            time.sleep(0.3)
    print("Ingestion terminée.")