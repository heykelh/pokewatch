"""Ingestion quotidienne des prix Cardmarket ET TCGplayer (via TCGdex) vers Supabase.

Lit la watchlist depuis la table `cards`, snapshot quotidien dans `cm_price_snapshots`.
Idempotent : rejouable sans doublons (contrainte unique card_id/snapshot_date/source).

Note sur les variantes TCGplayer : l'ordre de priorite est FIXE, jamais base sur le
prix. Choisir dynamiquement la variante la plus chere ferait suivre un holographique
un jour et une version normale le lendemain, rendant les variations absurdes.

Resilience reseau : chaque carte est reessayee jusqu'a 3 fois en cas d'erreur de
connexion. Si l'API TCGdex est globalement injoignable (panne reseau du runner ou
de TCGdex), le script se termine proprement sans planter le pipeline : cette etape
est SECONDAIRE (elle enrichit la watchlist), la detection tourne sur le Price Guide.
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

MAX_RETRIES = 3
RETRY_WAIT_S = 5


def get_watchlist() -> list[str]:
    res = supabase.table("cards").select("id").eq("watchlist", True).execute()
    return [row["id"] for row in res.data]


def ingest_card(client: httpx.Client, card_id: str) -> str:
    """Retourne 'ok', 'skip' (pas de pricing / HTTP non-200) ou 'neterror'."""
    card = None
    for attempt in range(MAX_RETRIES):
        try:
            res = client.get(f"{API}/cards/{card_id}")
            if res.status_code != 200:
                print(f"✗ {card_id}: HTTP {res.status_code}")
                return "skip"
            card = res.json()
            break
        except (httpx.ConnectError, httpx.ReadTimeout, httpx.ConnectTimeout):
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_WAIT_S)
                continue
            print(f"  ! {card_id}: reseau injoignable apres {MAX_RETRIES} essais")
            return "neterror"

    if card is None:
        return "neterror"

    pricing = card.get("pricing") or {}
    cm = pricing.get("cardmarket")
    if not cm:
        print(f"○ {card_id}: pas de pricing Cardmarket")
        return "skip"

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
        "source_updated_at": cm.get("updated"),
    }, on_conflict="card_id,snapshot_date,source").execute()

    tag = f" · TCGP {best.get('marketPrice')}$ ({best_variant})" if best else ""
    print(f"✓ {card_id} (CM {cm.get('trend')}€{tag})")
    return "ok"


def main() -> None:
    watchlist = get_watchlist()
    print(f"{len(watchlist)} cartes en watchlist")

    ok = skip = neterror = 0
    consecutive_neterrors = 0

    with httpx.Client(timeout=15) as client:
        for card_id in watchlist:
            result = ingest_card(client, card_id)
            if result == "ok":
                ok += 1
                consecutive_neterrors = 0
            elif result == "skip":
                skip += 1
                consecutive_neterrors = 0
            else:  # neterror
                neterror += 1
                consecutive_neterrors += 1

            # Coupe-circuit : si 10 cartes d'affilee echouent en reseau, l'API
            # est globalement injoignable. Inutile d'insister 289 fois : on
            # s'arrete proprement, l'enrichissement sera rattrape au prochain run.
            if consecutive_neterrors >= 10:
                print("\n⚠ TCGdex injoignable (10 echecs reseau consecutifs).")
                print("  Arret propre : cette etape est secondaire, la detection")
                print("  tourne sur le Price Guide. Rattrapage au prochain run.")
                break

            time.sleep(0.3)

    print(f"\nIngestion terminee : {ok} ok, {skip} sans pricing, "
          f"{neterror} echecs reseau (sur {len(watchlist)}).")

    # On ne sort JAMAIS en erreur : un echec d'enrichissement TCGdex ne doit pas
    # faire echouer le pipeline. Les donnees de detection viennent du Price Guide.


if __name__ == "__main__":
    main()
