"""Construit la watchlist pilote : recherche par nom, validation API, filtre par trend minimum."""
import os
import time

import httpx
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

API = "https://api.tcgdex.net/v2/en"
MIN_TREND_EUR = 20.0   # en dessous, pas de cible de buyout rentable
MAX_CARDS = 150

# Profils à fort enjeu de manipulation : cartes chases, alt arts, vintage populaire.
# Ces requêtes par nom ramèneront toutes les versions ; le filtre trend fera le tri.
SEARCH_NAMES = [
    # Eeveelutions (Moonbreon et cie — les cibles de buyout classiques)
    "umbreon", "espeon", "sylveon", "leafeon", "glaceon", "vaporeon", "jolteon", "flareon",
    # Chases éternels
    "charizard", "pikachu", "mewtwo", "mew", "rayquaza", "lugia", "gengar",
    # Chases modernes
    "giratina", "aerodactyl", "machamp", "gardevoir", "miraidon", "koraidon",
    "iono", "lillie", "marnie", "cynthia",  # trainers populaires
    "dragonite", "gyarados", "blastoise", "venusaur", "snorlax", "greninja",
]

def candidates_for(client: httpx.Client, name: str) -> list[str]:
    res = client.get(f"{API}/cards", params={"name": name})
    if res.status_code != 200:
        print(f"✗ recherche '{name}': HTTP {res.status_code}")
        return []
    return [c["id"] for c in res.json()]

def validate(client: httpx.Client, card_id: str) -> dict | None:
    res = client.get(f"{API}/cards/{card_id}")
    if res.status_code != 200:
        return None
    card = res.json()
    cm = (card.get("pricing") or {}).get("cardmarket")
    if not cm:
        return None
    trend = max(cm.get("trend") or 0, cm.get("trend-holo") or 0)
    if trend < MIN_TREND_EUR:
        return None
    return {
        "id": card["id"],
        "name": card["name"],
        "set_id": (card.get("set") or {}).get("id", "unknown"),
        "set_name": (card.get("set") or {}).get("name"),
        "rarity": card.get("rarity"),
        "image_url": card.get("image"),
        "watchlist": True,
        "_trend": trend,  # pour le tri, retiré avant insertion
    }

def main() -> None:
    validated: dict[str, dict] = {}
    with httpx.Client(timeout=15) as client:
        for name in SEARCH_NAMES:
            ids = candidates_for(client, name)
            print(f"— '{name}': {len(ids)} candidates")
            for card_id in ids:
                if card_id in validated:
                    continue
                card = validate(client, card_id)
                if card:
                    validated[card_id] = card
                    print(f"  ✓ {card_id} · {card['name']} · trend {card['_trend']}€")
                time.sleep(0.25)

    # Tri par trend décroissant, cap à MAX_CARDS
    final = sorted(validated.values(), key=lambda c: c["_trend"], reverse=True)[:MAX_CARDS]
    for card in final:
        card.pop("_trend")

    supabase.table("cards").upsert(final).execute()
    print(f"\n{len(final)} cartes validées et insérées en watchlist.")

if __name__ == "__main__":
    main()