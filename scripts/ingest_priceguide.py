"""Ingestion du Price Guide Cardmarket dans market_snapshots.

Usage :
  python scripts/ingest_priceguide.py --file "C:/.../priceguide.json" --date 2026-07-11
  python scripts/ingest_priceguide.py --file "..." --catalogue "..." --date 2026-07-12

La date est celle du champ createdAt du fichier si non précisée.
"""
import argparse
import json
import os

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

MIN_TREND_EUR = 5.0
SINGLE_CATEGORY = 51
BATCH = 1000


def chunks(seq, n):
    for i in range(0, len(seq), n):
        yield seq[i : i + n]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", required=True)
    ap.add_argument("--catalogue")
    ap.add_argument("--date", help="YYYY-MM-DD (defaut : createdAt du fichier)")
    args = ap.parse_args()

    with open(args.file, encoding="utf-8") as f:
        pg = json.load(f)

    snapshot_date = args.date or pg["createdAt"][:10]
    print(f"Price Guide du {snapshot_date} · {len(pg['priceGuides'])} produits")

    if args.catalogue:
        with open(args.catalogue, encoding="utf-8") as f:
            cat = json.load(f)
        products = [
            {
                "id_product": p["idProduct"],
                "name": p.get("name"),
                "id_expansion": p.get("idExpansion"),
                "id_metacard": p.get("idMetacard"),
            }
            for p in cat["products"]
            if p.get("idCategory") == SINGLE_CATEGORY
        ]
        for batch in chunks(products, BATCH):
            supabase.table("market_products").upsert(batch).execute()
        print(f"Catalogue : {len(products)} produits synchronises")

    rows = [
        {
            "id_product": g["idProduct"],
            "snapshot_date": snapshot_date,
            "trend": g.get("trend"),
            "low": g.get("low"),
            "avg": g.get("avg"),
        }
        for g in pg["priceGuides"]
        if g.get("idCategory") == SINGLE_CATEGORY
        and (g.get("trend") or 0) >= MIN_TREND_EUR
    ]

    print(f"Filtrage (singles, trend >= {MIN_TREND_EUR}EUR) : {len(rows)} cartes")

    inserted = 0
    for batch in chunks(rows, BATCH):
        supabase.table("market_snapshots").upsert(batch).execute()
        inserted += len(batch)
        print(f"  {inserted}/{len(rows)}", end="\r")

    print(f"\n✓ {inserted} snapshots ecrits pour le {snapshot_date}")


if __name__ == "__main__":
    main()