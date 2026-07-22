"""Investigation eBay ciblee sur les cartes signalees, avec nettoyage des donnees.

Principe d'enqueteur : les donnees brutes eBay sont polluees (proxies, lots,
mauvaises cartes, mauvaises langues). Le nettoyage EST le travail. On ne garde
que les annonces de LA carte precise, en separant gradees et brutes.

RGPD : pseudos vendeurs haches a l'ingestion, jamais en clair.

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

# Termes qui trahissent une annonce a exclure (proxy, lot, accessoire)
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
    """Recupere nom et numero de collection (localId) depuis TCGdex."""
    res = client.get(f"{TCGDEX}/cards/{card_id}")
    if res.status_code != 200:
        return None
    c = res.json()
    return {
        "name": c.get("name"),
        "local_id": str(c.get("localId") or ""),
        "set_total": str((c.get("set") or {}).get("cardCount", {}).get("official") or ""),
    }


def is_clean(title: str, local_id: str) -> tuple[bool, str]:
    """Retourne (garder?, raison_du_rejet). Le coeur du travail d'enqueteur."""
    if JUNK_TERMS.search(title):
        return False, "proxy/lot/accessoire"
    # Si on connait le numero de collection, on l'exige dans le titre.
    # C'est le filtre le plus fiable pour isoler LA bonne carte.
    if local_id and local_id not in title:
        return False, f"numero {local_id} absent du titre"
    return True, ""


def classify_grading(condition: str | None, title: str) -> str:
    """Separe les populations : gradee vs brute (marches distincts)."""
    t = (title or "").lower()
    if condition and "grad" in condition.lower():
        return "graded"
    if re.search(r"\b(psa|bgs|cgc|ace|slab)\b", t):
        return "graded"
    return "raw"


def investigate(client: httpx.Client, token: str, card_id: str, meta: dict) -> None:
    query = f"{meta['name']} {meta['local_id']} pokemon".strip()
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
    kept, rejected = [], {}
    for it in items:
        title = it.get("title") or ""
        ok, reason = is_clean(title, meta["local_id"])
        if not ok:
            rejected[reason] = rejected.get(reason, 0) + 1
            continue
        kept.append({
            "card_id": card_id,
            "collected_at": TODAY,
            "title": title,
            "price": (it.get("price") or {}).get("value"),
            "currency": (it.get("price") or {}).get("currency"),
            "condition": it.get("condition"),
            "grading": classify_grading(it.get("condition"), title),
            "seller_hash": hash_seller((it.get("seller") or {}).get("username")),
            "item_id": it.get("itemId"),
            "raw": None,
        })

    if kept:
        supabase.table("ebay_listings").upsert(
            kept, on_conflict="item_id,collected_at"
        ).execute()

    total = len(items)
    print(f"✓ {meta['name']} ({meta['local_id']}) : {len(kept)}/{total} annonces retenues")
    for reason, n in sorted(rejected.items(), key=lambda x: -x[1]):
        print(f"    - {n} rejetees : {reason}")


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
            res = (supabase.table("anomalies").select("card_id")
                   .eq("detected_date", TODAY).not_.like("card_id", "test-%")
                   .execute())
            ids = list({r["card_id"] for r in res.data})
            if not ids:
                print("Aucune carte a investiguer aujourd'hui.")
                return
            targets = []
            for cid in ids:
                m = get_card_meta(client, cid)
                if m:
                    targets.append((cid, m))

        print(f"{len(targets)} carte(s) a investiguer\n")
        token = get_token()
        for card_id, meta in targets:
            investigate(client, token, card_id, meta)

    supabase.rpc("purge_old_ebay_data", {}).execute()
    print("\nInvestigation terminee.")
if __name__ == "__main__":
    main()
