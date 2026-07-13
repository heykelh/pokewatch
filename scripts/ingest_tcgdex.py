"""Ingestion quotidienne des prix Cardmarket ET TCGplayer (via TCGdex) vers Supabase.

Lit la watchlist depuis la table `cards`, snapshot quotidien dans `cm_price_snapshots`.
Idempotent : rejouable sans doublons (contrainte unique card_id/snapshot_date/source).

Note sur les variantes TCGplayer : l'ordre de priorite est FIXE, jamais base sur le
prix. Choisir dynamiquement la variante la plus chere ferait suivre un holographique
un jour et une version normale le lendemain, rendant les variations absurdes.
"""
import os
import time
from datetime import date

import httpx
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

API = "https://api.tcgdex.net/v2/en"
TODAY = date.today().isoformat()

# Ordre de priorite FIXE des variantes TCGplayer
TCGP_VARIANTS = ("holofoil", "reverseHolofoil", "1stEditionHolofoil", "normal")


def get_watchlist() -> list[str]:
    res = supabase.table("cards").select("id").eq("watchlist", True).execute()
    return [row["id"] for row in res.data]


def ingest_card(client: httpx.Client, card_id: str) -> bool:
    res = client.get(f"{API}/cards/{card_id}")
    if res.status_code != 200:
        print(f"✗ {card_id}: HTTP {res.status_code}")
        return False

    card = res.json()
    pricing = card.get("pricing") or {}
    cm = pricing.get("cardmarket")
    if not cm:
        print(f"○ {card_id}: pas de pricing Cardmarket")
        return False

    # Variante TCGplayer : premiere disponible dans l'ordre fixe ci-dessus
    tcgp = pricing.get("tcgplayer") or {}
    best_variant, best = None, {}
    for variant in TCGP_VARIANTS:
        if tcgp.get(variant):
            best_variant, best = variant, tcgp[variant]
            break

    supabase.table("cm_price_snapshots").upsert({
        "card_id": card["id"],
        "snapshot_date": TODAY,
        "source": "tcgdex",
        "avg": cm.get("avg"), "low": cm.get("low"), "trend": cm.get("trend"),
        "avg1": cm.get("avg1"), "avg7": cm.get("avg7"), "avg30": cm.get("avg30"),
        "avg_holo": cm.get("avg-holo"), "low_holo": cm.get("low-holo"),
        "trend_holo": cm.get("trend-holo"), "avg1_holo": cm.get("avg1-holo"),
        "avg7_holo": cm.get("avg7-holo"), "avg30_holo": cm.get("avg30-holo"),
        "tcgp_variant": best_variant,
        "tcgp_low": best.get("lowPrice"),
        "tcgp_mid": best.get("midPrice"),
        "tcgp_high": best.get("highPrice"),
        "tcgp_market": best.get("marketPrice"),
        "tcgp_direct_low": best.get("directLowPrice"),
        "raw": pricing,
    }, on_conflict="card_id,snapshot_date,source").execute()

    tag = f" · TCGP {best.get('marketPrice')}$ ({best_variant})" if best else ""
    print(f"✓ {card_id} (CM {cm.get('trend')}€{tag})")
    return True


def main() -> None:
    watchlist = get_watchlist()
    print(f"{len(watchlist)} cartes en watchlist")
    ok = 0
    with httpx.Client(timeout=15) as client:
        for card_id in watchlist:
            if ingest_card(client, card_id):
                ok += 1
            time.sleep(0.3)
    print(f"Ingestion terminée : {ok}/{len(watchlist)} cartes snapshotées.")


if __name__ == "__main__":
    main()