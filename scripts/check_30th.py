"""Verifie combien de cartes du set 30 ans sont dans le dernier Price Guide."""
import glob
import json
import os

import httpx

with httpx.Client(timeout=30) as client:
    s = client.get("https://api.tcgdex.net/v2/en/sets/30th").json()
    cards = s["cards"][:30]

    tcg_ids = set()
    for card in cards:
        cid = card["id"]
        detail = client.get(f"https://api.tcgdex.net/v2/en/cards/{cid}").json()
        cm = (detail.get("pricing") or {}).get("cardmarket") or {}
        idp = cm.get("idProduct")
        if idp:
            tcg_ids.add(str(idp))

f = max(glob.glob(r"C:\Users\hheyk\Documents\pokewatch\priceguides\*.json"),
        key=os.path.getmtime)
pg_ids = {str(g["idProduct"]) for g in json.load(open(f, encoding="utf-8"))["priceGuides"]}

inter = tcg_ids & pg_ids
print(f"{len(inter)} cartes du set 30 ans (sur 30 testees) dans le Price Guide")
print(f"(fichier teste : {os.path.basename(f)})")
