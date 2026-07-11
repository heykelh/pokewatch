"""Ingestion Price Guide Cardmarket — MODE DRY-RUN (aucune écriture en base).

Valide le pipeline à l'échelle : téléchargement/lecture, parsing, filtrage,
statistiques. L'écriture en base sera activée APRÈS calibration du moteur.

Usage :
  python scripts/ingest_priceguide.py --file "C:/chemin/priceguide.json"
  python scripts/ingest_priceguide.py --file "..." --catalogue "C:/chemin/catalogue.json"
"""
import argparse
import json
from datetime import date

MIN_TREND_EUR = 5.0
SINGLE_CATEGORY = 51


def load_json(path: str) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", required=True, help="Chemin du Price Guide JSON")
    parser.add_argument("--catalogue", help="Chemin du Catalogue JSON (optionnel, pour les noms)")
    args = parser.parse_args()

    pg = load_json(args.file)
    guides = pg["priceGuides"]
    print(f"Price Guide chargé : {len(guides)} produits · créé le {pg.get('createdAt')}")

    catalogue = {}
    if args.catalogue:
        cat = load_json(args.catalogue)
        catalogue = {p["idProduct"]: p for p in cat["products"]}
        print(f"Catalogue chargé : {len(catalogue)} produits")

    # Filtrage : singles avec trend exploitable au-dessus du seuil
    kept = []
    for g in guides:
        if g.get("idCategory") != SINGLE_CATEGORY:
            continue
        trend = g.get("trend") or 0
        if trend < MIN_TREND_EUR:
            continue
        kept.append(g)

    print(f"\nAprès filtrage (singles, trend >= {MIN_TREND_EUR}€) : {len(kept)} cartes")

    # Ce qui serait persisté : estimation de poids
    approx_bytes = len(kept) * 100
    print(f"Poids estimé du snapshot du jour : ~{approx_bytes / 1_000_000:.2f} Mo")
    print(f"Sur 90 jours de rétention : ~{approx_bytes * 90 / 1_000_000:.0f} Mo")

    # Complétude des champs critiques pour la détection
    with_avg30 = sum(1 for g in kept if g.get("avg30") is not None)
    with_low = sum(1 for g in kept if g.get("low") is not None)
    print(f"\nComplétude sur les {len(kept)} cartes retenues :")
    print(f"  avg30 présent : {with_avg30} ({100*with_avg30/max(len(kept),1):.0f}%)")
    print(f"  low présent   : {with_low} ({100*with_low/max(len(kept),1):.0f}%)")

    # Aperçu : top 15 par trend
    top = sorted(kept, key=lambda g: g.get("trend") or 0, reverse=True)[:15]
    print("\nTop 15 par trend (aperçu de ce que le scan large verrait) :")
    for g in top:
        pid = g["idProduct"]
        name = catalogue.get(pid, {}).get("name", "?")
        print(f"  {pid} · {name[:45]:45} · trend {g.get('trend')}€ · low {g.get('low')}")

    print(f"\n[DRY-RUN] {date.today().isoformat()} — aucune écriture en base. "
          f"{len(kept)} cartes seraient candidates au scan.")


if __name__ == "__main__":
    main()