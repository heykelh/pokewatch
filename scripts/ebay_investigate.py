"""Investigation eBay ciblee sur les cartes signalees, avec nettoyage strict.

Principe : recherche LARGE cote eBay (volume), tamis STRICT cote nettoyage.
On isole les annonces de LA carte precise via son numero de collection,
on ecarte proxies/lots/accessoires, et on separe gradees et brutes.

RGPD : pseudos vendeurs haches a la reception, jamais en clair.

Usage :
  python scripts/ebay_investigate.py            -> cartes signalees aujourd'hui
  python scripts/ebay_investigate.py swsh7-215  -> investigation forcee
"""
import base64
import hashlib
import os
import re
import sys
from datetime import date

import httpx
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

CLIENT_ID = os.environ["EBAY_CLIENT_ID"]
CLIENT_SECRET = os.environ["EBAY_CLIENT_SECRET"]
SALT = os.environ["SELLER_HASH_SALT"]
TCGDEX = "https://api.tcgdex.net/v2/en"
TODAY = date.today().isoformat()

JUNK_TERMS = re.compile(
    r"\b(proxy|proxies|custom|orica|fan\s?art|reproduction|repro|"
    r"lot|bundle|playset|sleeve|sleeves|protege|toploader|"
    r"metal|acrylic|plush|peluche|sticker|autocollant|jumbo)\b",
    re.IGNORECASE,
)


def hash_seller(username: str | None) -> str | None:
    if not username:
        return None
    return hashlib.sha256((SALT + username).encode()).hexdigest()


def get_token() -> str:
    creds = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    res = httpx.post(
        "https://api.ebay.com/identity/v1/oauth2/token",
        headers={"Authorization": f"Basic {creds}",
                 "Content-Type": "application/x-www-form-urlencoded"},
        data={"grant_type": "client_credentials",
              "scope": "https://api.ebay.com/oauth/api_scope"},
        timeout=30,
    )
    res.raise_for_status()
    return res.json()["access_token"]


def get_card_meta(client: httpx.Client, card_id: str) -> dict | None:
    res = client.get(f"{TCGDEX}/cards/{card_id}")
    if res.status_code != 200:
        return None
    c = res.json()
    return {
        "name": c.get("name"),
        "local_id": str(c.get("localId") or ""),
    }


def is_clean(title: str, local_id: str) -> tuple[bool, str]:
    """Le coeur du travail d'enqueteur. Retourne (garder?, raison_du_rejet)."""
    if JUNK_TERMS.search(title):
        return False, "proxy/lot/accessoire"
    # Filtre decisif : le numero de collection doit apparaitre dans le titre.
    # On teste plusieurs formes ("215", "215/", "215 ") pour tolerer les
    # variations d'ecriture des vendeurs, sans accepter un simple sous-nombre.
    if local_id:
        pattern = re.compile(rf"\b0*{re.escape(local_id)}\b")
        if not pattern.search(title):
            return False, f"numero {local_id} absent"
    return True, ""


def classify_grading(condition: str | None, title: str) -> str:
    t = (title or "").lower()
    if condition and "grad" in condition.lower():
        return "graded"
    if re.search(r"\b(psa|bgs|cgc|ace|slab|gradee?|graded)\b", t):
        return "graded"
    return "raw"


def investigate(client: httpx.Client, token: str, card_id: str, meta: dict) -> None:
    query = f"{meta['name']} pokemon"
    res = client.get(
        "https://api.ebay.com/buy/browse/v1/item_summary/search",
        headers={"Authorization": f"Bearer {token}",
                 "X-EBAY-C-MARKETPLACE-ID": "EBAY_FR"},
        params={"q": query, "limit": 100},
        timeout=30,
    )
    if res.status_code != 200:
        print(f"✗ {meta['name']}: HTTP {res.status_code}")
        return

    items = res.json().get("itemSummaries", [])
    print(f"\n--- DEBUG : 15 premiers titres eBay pour '{query}' ---")
    for it in items[:15]:
        print(f"  {it.get('title', '')[:75]}")
    print("--- fin debug ---\n")

    kept, rejected = [], {}
    for it in items:
        title = it.get("title") or ""
        ok, reason = is_clean(title, meta["local_id"])
        if not ok:
            rejected[reason] = rejected.get(reason, 0) + 1
            continue
        kept.append({
            "card_id": card_id, "collected_at": TODAY, "title": title,
            "price": (it.get("price") or {}).get("value"),
            "currency": (it.get("price") or {}).get("currency"),
            "condition": it.get("condition"),
            "grading": classify_grading(it.get("condition"), title),
            "seller_hash": hash_seller((it.get("seller") or {}).get("username")),
            "item_id": it.get("itemId"), "raw": None,
        })

    if kept:
        supabase.table("ebay_listings").upsert(
            kept, on_conflict="item_id,collected_at"
        ).execute()

    print(f"✓ {meta['name']} ({meta['local_id']}) : {len(kept)}/{len(items)} retenues")
    for reason, n in sorted(rejected.items(), key=lambda x: -x[1]):
        print(f"    - {n} rejetees : {reason}")

    conc = (
        supabase.table("v_ebay_concentration")
        .select("grading, annonces, vendeurs, hhi, part_max_pct, lecture")
        .eq("card_id", card_id).eq("collected_at", TODAY)
        .execute()
    )
    for c in conc.data:
        print(f"    → {c['grading']:6} : {c['annonces']} annonces, "
              f"{c['vendeurs']} vendeurs, HHI {c['hhi']}, "
              f"plus gros {c['part_max_pct']}% — {c['lecture']}")


def main() -> None:
    with httpx.Client(timeout=30) as client:
        if len(sys.argv) > 1:
            card_id = sys.argv[1]
            meta = get_card_meta(client, card_id)
            if not meta:
                print(f"Carte {card_id} introuvable sur TCGdex.")
                return
            targets = [(card_id, meta)]
        else:
            res = (supabase.table("market_anomalies").select("id_product")
                   .eq("detected_date", TODAY).gt("id_product", 0)
                   .in_("rule", ["trend_ma_divergence", "market_divergence", "trend_zscore"])
                   .execute())
            # Les anomalies sont sur id_product Cardmarket ; il faut le mapping
            # vers card_id TCGdex. Pour l'instant, mode manuel privilegie.
            ids = list({r["id_product"] for r in res.data})
            if not ids:
                print("Aucune carte forte a investiguer aujourd'hui.")
                return
            print(f"{len(ids)} carte(s) signalee(s), mais le mapping "
                  f"id_product -> card_id n'est pas encore implemente.")
            print("Utilise le mode manuel : python scripts/ebay_investigate.py <card_id>")
            return

        print(f"{len(targets)} carte(s) a investiguer\n")
        token = get_token()
        for card_id, meta in targets:
            investigate(client, token, card_id, meta)

    supabase.rpc("purge_old_ebay_data", {}).execute()
    print("\nInvestigation terminee.")


if __name__ == "__main__":
    main()
