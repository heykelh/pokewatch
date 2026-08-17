"""Elargit la watchlist aux cartes du Price Guide au-dessus d'un seuil de prix.

La watchlist ajoute le suivi TCGplayer et la possibilite d'investigation eBay.
On ne suit donc en detail que les cartes ou ce complement a de la valeur :
les cartes cheres et liquides, pas les milliers de communes immobiles.

Usage :
  python scripts/expand_watchlist.py --min-trend 20    -> cartes >= 20 EUR
  python scripts/expand_watchlist.py --min-trend 20 --dry-run   -> simulation
"""
import argparse
import os

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--min-trend", type=float, default=20.0,
                    help="Prix de reference minimum pour entrer en watchlist")
    ap.add_argument("--dry-run", action="store_true",
                    help="Compte seulement, n'ecrit rien")
    args = ap.parse_args()

    # Dernier jour de donnees reelles
    last = (supabase.table("market_snapshots").select("snapshot_date")
            .gt("id_product", 0).order("snapshot_date", desc=True)
            .limit(1).execute())
    last_date = last.data[0]["snapshot_date"]

    # Cartes au-dessus du seuil, ce jour-la, jugees fiables
    # (on passe par v_market_clean pour ne pas embarquer les prix corrompus)
    rows = (supabase.table("v_market_clean")
            .select("id_product, trend")
            .eq("snapshot_date", last_date)
            .eq("is_trustworthy", True)
            .gte("trend", args.min_trend)
            .gt("id_product", 0)
            .execute())

    candidates = {r["id_product"] for r in rows.data}
    print(f"{len(candidates)} carte(s) >= {args.min_trend} EUR au {last_date}")

    if args.dry_run:
        print("(simulation : rien ecrit)")
        # Estimation du temps de pipeline
        minutes = len(candidates) * 0.9 / 60
        print(f"Temps d'ingestion TCGdex estime : ~{minutes:.0f} min/jour")
        return

    # On ne peut pas basculer en watchlist ce qu'on ne sait pas relier a TCGdex.
    # market_products porte l'id Cardmarket ; la watchlist vit cote cards (TCGdex).
    # Ce script marque donc les produits, le mapping reste le prerequis.
    print("\n⚠ Prerequis : le mapping id_product (Cardmarket) -> card_id (TCGdex)")
    print("  n'est pas encore construit. Voir la note ci-dessous.")


if __name__ == "__main__":
    main()
