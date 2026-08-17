"""Construit la correspondance idProduct Cardmarket -> set + numero via TCGdex.

Run unique (a relancer seulement quand un nouveau set sort). Parcourt les sets
modernes, recupere le detail de chaque carte, et enrichit market_products par
jointure sur l'idProduct Cardmarket expose par TCGdex (cle exacte).

Couverture partielle assumee. Promos et trainer kits ignores.

Usage : python scripts/map_sets.py
"""
import os
import time

import httpx
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

BASE = "https://api.tcgdex.net/v2/en"

SKIP_PREFIXES = ("tk-", "mcdonald", "2011bw", "2012bw", "2014xy", "2015xy",
                 "2016xy", "2017sm", "2018sm", "2019sm", "2021swsh", "2022swsh",
                 "2023sv", "2024sv", "fut2020", "futsal")


def should_skip(set_id: str, name: str) -> bool:
    low = set_id.lower()
    if any(low.startswith(p) for p in SKIP_PREFIXES):
        return True
    if "mcdonald" in name.lower() or "trainer kit" in name.lower():
        return True
    return False


def flush(pending: dict) -> None:
    """Ecrit le lot en cours. pending est indexe par id_product : deja dedoublonne."""
    if not pending:
        return
    supabase.table("market_products").upsert(list(pending.values())).execute()


def main() -> None:
    existing = set()
    offset = 0
    while True:
        rows = (supabase.table("market_products").select("id_product")
                .gt("id_product", 0).range(offset, offset + 999).execute())
        if not rows.data:
            break
        existing.update(r["id_product"] for r in rows.data)
        if len(rows.data) < 1000:
            break
        offset += 1000
    print(f"{len(existing)} produits en base a couvrir.\n")

    with httpx.Client(timeout=60) as client:
        sets = client.get(f"{BASE}/sets").json()
        targets = [s for s in sets if not should_skip(s["id"], s["name"])]
        print(f"{len(targets)} sets a parcourir (sur {len(sets)}).\n")

        # Indexe par id_product : un meme produit ne peut apparaitre qu'une fois
        pending: dict[int, dict] = {}
        matched = 0

        for i, s in enumerate(targets, 1):
            set_id, set_name = s["id"], s["name"]
            try:
                detail = client.get(f"{BASE}/sets/{set_id}").json()
            except Exception as e:
                print(f"  ! {set_id} : {e}")
                continue

            cards = detail.get("cards", [])
            set_matched = 0

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
                    # Ecrase un eventuel doublon dans le meme lot : le dernier
                    # gagne, ce qui est sans consequence (meme set, meme numero).
                    pending[id_product] = {
                        "id_product": id_product,
                        "set_code": set_id,
                        "set_name": set_name,
                        "card_number": str(cd.get("localId") or ""),
                    }
                    matched += 1
                    set_matched += 1

                time.sleep(0.05)

            print(f"  [{i}/{len(targets)}] {set_id:12} {set_name:32} "
                  f"{set_matched}/{len(cards)} apparies")

            if len(pending) >= 500:
                flush(pending)
                print(f"      -> {len(pending)} ecrits (total apparie {matched})")
                pending = {}

        flush(pending)

    print(f"\n✓ {matched} appariements, table set/numero enrichie.")


if __name__ == "__main__":
    main()
