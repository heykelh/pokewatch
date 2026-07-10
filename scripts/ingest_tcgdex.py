# scripts/ingest_tcgdex.py
import os
import time
from datetime import date

import httpx
from supabase import create_client

from dotenv import load_dotenv
load_dotenv()

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

WATCHLIST = [
    "swsh3-136",          # Charizard Darkness Ablaze
    "swsh7-215",          # Umbreon VMAX alt art
]

TODAY = date.today().isoformat()

def ingest_card(client: httpx.Client, card_id: str) -> None:
    res = client.get(f"https://api.tcgdex.net/v2/en/cards/{card_id}")
    if res.status_code != 200:
        print(f"✗ {card_id}: HTTP {res.status_code}")
        return
    card = res.json()
    cm = (card.get("pricing") or {}).get("cardmarket")
    if not cm:
        print(f"○ {card_id}: pas de pricing Cardmarket")
        return

    supabase.table("cards").upsert({
        "id": card["id"],
        "name": card["name"],
        "set_id": (card.get("set") or {}).get("id", "unknown"),
        "set_name": (card.get("set") or {}).get("name"),
        "rarity": card.get("rarity"),
        "image_url": card.get("image"),
    }).execute()

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

def main() -> None:
    with httpx.Client(timeout=15) as client:
        for card_id in WATCHLIST:
            ingest_card(client, card_id)
            time.sleep(0.3)  # politesse rate-limit

if __name__ == "__main__":
    main()