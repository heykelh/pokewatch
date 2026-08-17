"""Ingestion du catalogue produits Cardmarket : idProduct -> nom + extension.

Ce catalogue (URL publique, ~72 000 produits) donne le nom propre de chaque
carte. Il change rarement (a chaque nouvelle extension), on ne le rejoue donc
pas quotidiennement. Le nom d'extension est ajoute dans un second temps via
la table d'expansions.

Usage : python scripts/ingest_catalog.py
"""
import json
import os
import sys
from pathlib import Path

import httpx
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

URL = "https://downloads.s3.cardmarket.com/productCatalog/productList/products_singles_6.json"


def main() -> None:
    print("Telechargement du catalogue produits...")
    with httpx.Client(timeout=180) as client:
        res = client.get(URL)
        res.raise_for_status()
        data = res.json()

    products = data.get("products", [])
    print(f"{len(products)} produits dans le catalogue.")

    # On ne met a jour que les produits deja presents dans market_products
    # (ceux qui apparaissent dans le Price Guide). Inutile de charger 72 000
    # lignes dont on n'a pas besoin.
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
    print(f"{len(existing)} produits connus en base.")

    updates = [
        {"id_product": p["idProduct"],
         "cardmarket_name": p["name"],
         "id_expansion": p["idExpansion"]}
        for p in products
        if p["idProduct"] in existing
    ]
    print(f"{len(updates)} produits a enrichir.")

    for i in range(0, len(updates), 500):
        batch = updates[i:i + 500]
        supabase.table("market_products").upsert(batch).execute()
        print(f"  {min(i + 500, len(updates))}/{len(updates)}")

    print("✓ Noms de cartes enrichis.")


if __name__ == "__main__":
    main()
