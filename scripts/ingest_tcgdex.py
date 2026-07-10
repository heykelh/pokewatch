"""Ingestion quotidienne des prix Cardmarket (via TCGdex) vers Supabase.

Lit la watchlist depuis la table `cards`, snapshot quotidien dans `cm_price_snapshots`.
Idempotent : rejouable sans doublons (contrainte unique card_id/snapshot_date/source).
"""
import os
import time
from datetime import date

import httpx
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

API = "https://api.tcgdex.net/v2/en"
TODAY = date.today().isoformat()


def get_watchlist() -> list[str]:
    res = supabase.table("cards").select("id").eq("watchlist", True).execute()
    return [row["id"] for row in res.data]


def ingest_card(client: httpx.Client, card_id: str) -> bool:
    res = client.get(f"{API}/cards/{card_id}")
    if res.status_code != 200:
        print(f"✗ {card_id}: HTTP {res.status_code}")
        return False
    card = res.json()
    cm = (card.get("pricing") or {}).get("cardmarket")
    if not cm:
        print(f"○ {card_id}: pas de pricing Cardmarket")
        return False

    supabase.table("cm_price_snapshots").upsert({
        "card_id": card["id"],
        "snapshot_date": TODAY,
        "source": "tcgdex",
        "avg": cm.get("avg"), "low": cm.get("low"), "trend": cm.get("trend"),
        "avg1": cm.get("avg1"), "avg7": cm.get("avg7"), "avg30": cm.get("avg30"),
        "avg_holo": cm.get("avg-holo"), "low_holo": cm.get("low-holo"),
        "trend_holo": cm.get("trend-holo"), "avg1_holo": cm.get("avg1-holo"),
        "avg7_holo": cm.get("avg7-holo"), "avg30_holo": cm.get("avg30-holo"),
        "raw": cm,
    }, on_conflict="card_id,snapshot_date,source").execute()

    print(f"✓ {card_id} (trend: {cm.get('trend')}€)")
    return True


def main() -> None:
    watchlist = get_watchlist()
    print(f"{len(watchlist)} cartes en watchlist")
    ok = 0
    with httpx.Client(timeout=15) as client:
        for card_id in watchlist:
            if ingest_card(client, card_id):
                ok += 1
            time.sleep(0.3)
    print(f"Ingestion terminée : {ok}/{len(watchlist)} cartes snapshotées.")


if __name__ == "__main__":
    main()