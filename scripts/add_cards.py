"""Ajoute des cartes à la watchlist avec validation API + dédupe par idProduct.

Usage :
  python scripts/add_cards.py mep-001 mep-002        # par IDs explicites
  python scripts/add_cards.py --set mep               # tout un set (filtré par trend)
"""
import os
import sys
import time

import httpx
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

API = "https://api.tcgdex.net/v2/en"
MIN_TREND_EUR = 5.0   # seuil plus bas que la watchlist de base : les cartes
                      # récentes démarrent parfois sous 20€ avant de s'envoler


def existing_products() -> set[str]:
    res = supabase.table("cards").select("cm_id_product").eq("watchlist", True).execute()
    return {r["cm_id_product"] for r in res.data if r["cm_id_product"]}


def add_card(client: httpx.Client, card_id: str, known_products: set[str]) -> bool:
    res = client.get(f"{API}/cards/{card_id}")
    if res.status_code != 200:
        print(f"✗ {card_id}: HTTP {res.status_code}")
        return False
    card = res.json()
    cm = (card.get("pricing") or {}).get("cardmarket")
    if not cm:
        print(f"○ {card_id}: pas de pricing Cardmarket")
        return False

    id_product = str(cm.get("idProduct", ""))
    if id_product and id_product in known_products:
        print(f"○ {card_id} ({card['name']}): produit CM {id_product} déjà en watchlist, ignoré")
        return False

    trend = max(cm.get("trend") or 0, cm.get("trend-holo") or 0)
    if trend < MIN_TREND_EUR:
        print(f"○ {card_id} ({card['name']}): trend {trend}€ sous le seuil, ignoré")
        return False

    supabase.table("cards").upsert({
        "id": card["id"],
        "name": card["name"],
        "set_id": (card.get("set") or {}).get("id", "unknown"),
        "set_name": (card.get("set") or {}).get("name"),
        "rarity": card.get("rarity"),
        "image_url": card.get("image"),
        "watchlist": True,
        "cm_id_product": id_product or None,
    }).execute()
    supabase.table("watchlist_log").insert({"card_id": card["id"], "reason": "ajout manuel"}).execute()
    known_products.add(id_product)
    print(f"✓ {card_id} · {card['name']} · trend {trend}€ · produit CM {id_product}")
    return True


def main() -> None:
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        return

    with httpx.Client(timeout=15) as client:
        if args[0] == "--set":
            set_id = args[1]
            res = client.get(f"{API}/sets/{set_id}")
            if res.status_code != 200:
                print(f"✗ set {set_id}: HTTP {res.status_code}")
                return
            card_ids = [c["id"] for c in res.json().get("cards", [])]
            print(f"Set {set_id}: {len(card_ids)} cartes à évaluer")
        else:
            card_ids = args

        known = existing_products()
        added = 0
        for card_id in card_ids:
            if add_card(client, card_id, known):
                added += 1
            time.sleep(0.3)
        print(f"\n{added} carte(s) ajoutée(s) à la watchlist.")


if __name__ == "__main__":
    main()