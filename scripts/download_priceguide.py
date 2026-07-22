"""Telecharge le Price Guide Cardmarket depuis l'URL publique S3,
le date selon son champ createdAt interne, et ne le traite que s'il est nouveau.

Fonctionne en local (venv Windows) comme en CI (runner Linux).

Usage : python scripts/download_priceguide.py
"""
import json
import subprocess
import sys
from pathlib import Path

import httpx

URL = "https://downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_6.json"

PROJECT_DIR = Path(__file__).resolve().parent.parent
DEST_DIR = PROJECT_DIR / "priceguides"


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

    # Ingestion dans la foulee, avec le Python du venv s'il existe (local),
    # sinon l'interpreteur courant (CI).
    print("\nIngestion...")
    venv_python = PROJECT_DIR / ".venv" / "Scripts" / "python.exe"
    interpreter = str(venv_python) if venv_python.exists() else sys.executable

    result = subprocess.run(
        [interpreter, str(PROJECT_DIR / "scripts" / "ingest_priceguide.py"),
         "--file", str(dest)],
        cwd=str(PROJECT_DIR),
    )
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
