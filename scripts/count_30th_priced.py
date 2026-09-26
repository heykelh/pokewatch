"""Compte les cartes du set 30 ans qui ont passe le filtre de prix (>= 2 EUR)
et sont donc dans market_snapshots aujourd'hui."""
import os
import httpx
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

with httpx.Client(timeout=60) as client:
    ids = set()
    for set_id in ["30th", "30th-c"]:
        cards = client.get(f"https://api.tcgdex.net/v2/en/sets/{set_id}").json()["cards"]
        for card in cards:
            d = client.get(f"https://api.tcgdex.net/v2/en/cards/{card['id']}").json()
            cm = (d.get("pricing") or {}).get("cardmarket") or {}
            if cm.get("idProduct"):
                ids.add(cm["idProduct"])

print(f"{len(ids)} idProduct du set cote TCGdex")

# Combien sont dans market_snapshots aujourd'hui (donc >= 2 EUR)
present = 0
priced = []
for idp in ids:
    r = supabase.table("market_snapshots").select("id_product, trend") \
        .eq("id_product", idp).eq("snapshot_date", "2026-09-26").execute()
    if r.data:
        present += 1
        priced.append((idp, r.data[0]["trend"]))

print(f"{present} cartes du set >= 2 EUR sont dans market_snapshots aujourd'hui")
print("\nLes plus cheres :")
for idp, trend in sorted(priced, key=lambda x: -(x[1] or 0))[:15]:
    print(f"  idProduct {idp} : {trend} EUR")
