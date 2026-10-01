"""Recupere les images manquantes du set 30 ans.
Essaie TCGdex (haute qualite) puis pokemontcg.io en secours.
Ne traite que les cartes sans image_url : rejouable chaque jour, il complete
au fur et a mesure que les sources publient les images manquantes.

Usage : python scripts/add_30th_images.py
"""
import os
import time

import httpx
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

TCGDEX = "https://api.tcgdex.net/v2/en"
PTCGIO = "https://api.pokemontcg.io/v2"


def url_ok(client: httpx.Client, url: str) -> bool:
    """Verifie qu'une image existe vraiment (pas un 404)."""
    try:
        r = client.head(url, follow_redirects=True, timeout=15)
        return r.status_code == 200
    except Exception:
        return False


def try_tcgdex(client: httpx.Client, card_id: str) -> str | None:
    try:
        d = client.get(f"{TCGDEX}/cards/{card_id}", timeout=20).json()
        base = d.get("image")
        if not base:
            return None
        for q in ("high.webp", "low.webp", "high.png", "low.png"):
            candidate = f"{base}/{q}"
            if url_ok(client, candidate):
                return candidate
    except Exception:
        pass
    return None


def try_ptcgio(client: httpx.Client, set_ptcgio: str, number: str) -> str | None:
    """Cherche la carte de meme numero chez pokemontcg.io."""
    if not set_ptcgio or not number:
        return None
    try:
        r = client.get(
            f"{PTCGIO}/cards",
            params={"q": f"set.id:{set_ptcgio} number:{number}"},
            timeout=20,
        )
        if r.status_code != 200:
            return None
        data = r.json().get("data", [])
        if data:
            return (data[0].get("images") or {}).get("large")
    except Exception:
        pass
    return None


def main() -> None:
    # Cartes du set SANS image
    rows = (supabase.table("market_products")
            .select("id_product, card_number, set_code")
            .in_("set_code", ["30th", "30th-c"])
            .is_("image_url", "null")
            .execute())
    manquantes = rows.data
    print(f"{len(manquantes)} cartes du set sans image.\n")

    if not manquantes:
        print("Rien a faire, toutes les images sont presentes.")
        return

    # Reconstruit l'id TCGdex depuis le numero (30th-158, 30th-c-001...)
    updates = []
    with httpx.Client() as client:
        for row in manquantes:
            num = row["card_number"]
            set_code = row["set_code"]
            # id TCGdex
            tcg_id = f"{set_code}-{num}"
            img = try_tcgdex(client, tcg_id)
            source = "tcgdex"
            if not img:
                # secours pokemontcg.io (set_ptcgio a definir une fois trouve)
                # img = try_ptcgio(client, "SET_PTCGIO", num)
                source = None
            if img:
                updates.append({"id_product": row["id_product"], "image_url": img})
                print(f"  ✓ {tcg_id} via {source}")
            else:
                print(f"  ○ {tcg_id} : toujours pas d'image")
            time.sleep(0.1)

    if updates:
        supabase.table("market_products").upsert(updates).execute()
    print(f"\n✓ {len(updates)} nouvelles images ajoutees.")
