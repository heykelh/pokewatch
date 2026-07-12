"""Compare deux Price Guides Cardmarket pour identifier quels champs bougent réellement."""
import json
import sys

FIELDS = ["avg", "low", "trend", "avg1", "avg7", "avg30"]


def load(path: str) -> dict:
    with open(path, encoding="utf-8") as f:
        return {p["idProduct"]: p for p in json.load(f)["priceGuides"]}


def main() -> None:
    a, b = load(sys.argv[1]), load(sys.argv[2])
    common = set(a) & set(b)
    singles = [pid for pid in common if a[pid].get("idCategory") == 51]
    print(f"{len(singles)} singles communs aux deux fichiers\n")

    for field in FIELDS:
        changed = sum(
            1 for pid in singles
            if a[pid].get(field) != b[pid].get(field)
        )
        pct = 100 * changed / max(len(singles), 1)
        print(f"  {field:6} : {changed:6} cartes ont change ({pct:.1f}%)")


if __name__ == "__main__":
    main()