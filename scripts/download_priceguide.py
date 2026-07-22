"""Telecharge le Price Guide Cardmarket depuis l'URL publique S3,
le date selon son champ createdAt interne, et ne le traite que s'il est nouveau.

Usage : python scripts/download_priceguide.py
"""
import json
import os
import subprocess
import sys
from pathlib import Path

import httpx

URL = "https://downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_6.json"
DEST_DIR = Path(__file__).resolve().parent.parent / "priceguides"


def main() -> None:
    DEST_DIR.mkdir(parents=True, exist_ok=True)

    print("Telechargement du Price Guide...")
    with httpx.Client(timeout=120) as client:
        res = client.get(URL)
        res.raise_for_status()
        data = res.json()

    created = data.get("createdAt", "")[:10]  # YYYY-MM-DD
    if not created:
        print("✗ Champ createdAt absent, fichier suspect. Abandon.")
        sys.exit(1)

    dest = DEST_DIR / f"price_guide_{created}.json"

    if dest.exists():
        print(f"○ Deja telecharge : {created} (rien a faire).")
        return

    dest.write_text(json.dumps(data), encoding="utf-8")
    print(f"✓ Nouveau Price Guide du {created} enregistre : {dest.name}")

    # Ingestion automatique dans la foulee
    print("\nIngestion...")
    result = subprocess.run(
        [sys.executable, "scripts/ingest_priceguide.py", "--file", str(dest)],
        cwd=str(Path.home() / "Documents" / "pokewatch"),
    )
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
