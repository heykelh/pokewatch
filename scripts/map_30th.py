"""Mapping cible du set 30th Celebration (30th + 30th-c) via TCGdex.

Enrichit market_products avec set_code / set_name / card_number pour les cartes
du set qui sont dans market_snapshots (donc >= 2 EUR, captees par le scan large).

Usage : python scripts/map_30th.py
"""
import os
import time

import httpx
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

BASE = "https://api.tcgdex.net/v2/en"
SETS = ["30th", "30th-c"]


def snapshot_ids() -> set[int]:
    """Les idProduct reellement presents dans market_snapshots (>= 2 EUR)."""
    ids = set()
    offset = 0
    while True:
        rows = (supabase.table("market_snapshots").select("id_product")
                .gt("id_product", 900000)   # les cartes du set ont des ids eleves
                .range(offset, offset + 999).execute())
        if not rows.data:
            break
        ids.update(r["id_product"] for r in rows.data)
        if len(rows.data) < 1000:
            break
        offset += 1000
    return ids


def main() -> None:
    existing = snapshot_ids()
    print(f"{len(existing)} produits recents (>900000) dans market_snapshots.\n")

    pending: dict[int, dict] = {}

    with httpx.Client(timeout=60) as client:
        for set_id in SETS:
            detail = client.get(f"{BASE}/sets/{set_id}").json()
            set_name = detail.get("name", set_id)
            cards = detail.get("cards", [])
            print(f"{set_id} · {set_name} : {len(cards)} cartes")

            matched = 0
            for c in cards:
                card_id = c.get("id")
                if not card_id:
                    continue
                try:
                    cd = client.get(f"{BASE}/cards/{card_id}").json()
                except Exception:
                    continue

                cm = (cd.get("pricing") or {}).get("cardmarket") or {}
                id_product = cm.get("idProduct")
                if id_product and id_product in existing:
                    pending[id_product] = {
                        "id_product": id_product,
                        "cardmarket_name": cd.get("name"),
                        "set_code": set_id,
                        "set_name": set_name,
                        "card_number": str(cd.get("localId") or ""),
                    }
                    matched += 1
                time.sleep(0.05)

            print(f"  -> {matched} apparient en base\n")

    if pending:
        # upsert : cree la ligne si absente de market_products, sinon enrichit
        supabase.table("market_products").upsert(list(pending.values())).execute()
    print(f"✓ {len(pending)} cartes du set 30 ans enrichies.")


if __name__ == "__main__":
    main()
