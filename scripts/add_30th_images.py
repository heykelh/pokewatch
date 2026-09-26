"""Recupere les URL d'images TCGdex pour les cartes du set 30 ans et les
stocke dans market_products.image_url.

TCGdex donne une URL de base par carte ; l'image affichable s'obtient en
ajoutant /high.webp (qualite haute) ou /low.webp.

Usage : python scripts/add_30th_images.py
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


def main() -> None:
    # Les id_product du set deja en base (mappes)
    rows = (supabase.table("market_products").select("id_product")
            .in_("set_code", SETS).execute())
    known = {r["id_product"] for r in rows.data}
    print(f"{len(known)} cartes du set en base.\n")

    updates = []
    with httpx.Client(timeout=60) as client:
        for set_id in SETS:
            cards = client.get(f"{BASE}/sets/{set_id}").json()["cards"]
            for c in cards:
                card_id = c.get("id")
                if not card_id:
                    continue
                try:
                    cd = client.get(f"{BASE}/cards/{card_id}").json()
                except Exception:
                    continue

                cm = (cd.get("pricing") or {}).get("cardmarket") or {}
                idp = cm.get("idProduct")
                img = cd.get("image")
                if idp and idp in known and img:
                    updates.append({
                        "id_product": idp,
                        "image_url": f"{img}/high.webp",
                    })
                time.sleep(0.05)

    if updates:
        supabase.table("market_products").upsert(updates).execute()
    print(f"✓ {len(updates)} images ajoutees.")


if __name__ == "__main__":
    main()
