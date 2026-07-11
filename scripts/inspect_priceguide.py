"""Inspection du Price Guide et du Catalogue Cardmarket téléchargés manuellement.

Usage : python scripts/inspect_priceguide.py chemin/vers/priceguide.json chemin/vers/catalogue.json
"""
import json
import sys
from collections import Counter

KNOWN_PRODUCTS = [875186, 875187, 875188, 875189, 875190, 875191, 875192, 875193, 875194]  # promos 30 ans


def main() -> None:
    pg_path, cat_path = sys.argv[1], sys.argv[2]

    with open(pg_path, encoding="utf-8") as f:
        pg_data = json.load(f)
    with open(cat_path, encoding="utf-8") as f:
        cat_data = json.load(f)

    guides = {p["idProduct"]: p for p in pg_data["priceGuides"]}
    products = {p["idProduct"]: p for p in cat_data["products"]}

    print(f"Price Guide : {len(guides)} produits · créé le {pg_data.get('createdAt')}")
    print(f"Catalogue   : {len(products)} produits · créé le {cat_data.get('createdAt')}")

    print("\nRépartition par catégorie (catalogue) :")
    cat_names = Counter(f"{p['idCategory']} · {p['categoryName']}" for p in products.values())
    for name, n in cat_names.most_common():
        print(f"  {name}: {n}")

    singles = [g for g in guides.values() if g.get("idCategory") == 51]
    with_avg30 = [g for g in singles if g.get("avg30") is not None]
    with_trend = [g for g in singles if g.get("trend") is not None]
    print(f"\nSingles (cat. 51) dans le Price Guide : {len(singles)}")
    print(f"  avec trend renseigné : {len(with_trend)} ({100*len(with_trend)/max(len(singles),1):.0f}%)")
    print(f"  avec avg30 renseigné : {len(with_avg30)} ({100*len(with_avg30)/max(len(singles),1):.0f}%)")

    trend_over_5 = [g for g in singles if (g.get("trend") or 0) >= 5]
    trend_over_20 = [g for g in singles if (g.get("trend") or 0) >= 20]
    print(f"  avec trend >= 5€  : {len(trend_over_5)}")
    print(f"  avec trend >= 20€ : {len(trend_over_20)}")

    print("\nContrôle de cohérence — promos 30 ans :")
    for pid in KNOWN_PRODUCTS:
        g, p = guides.get(pid), products.get(pid)
        name = p["name"] if p else "ABSENT DU CATALOGUE"
        if g:
            print(f"  ✓ {pid} · {name} · trend {g.get('trend')}€ · avg30 {g.get('avg30')}")
        else:
            print(f"  ✗ {pid} · {name} · ABSENT DU PRICE GUIDE")


if __name__ == "__main__":
    main()