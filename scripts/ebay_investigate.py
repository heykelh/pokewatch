"""Investigation eBay ciblee sur les cartes signalees par le scan.

RGPD : les pseudos vendeurs sont haches immediatement, jamais stockes en clair.
On n'interroge eBay QUE pour les cartes en anomalie (pipeline en entonnoir).
"""
import base64
import hashlib
import os
from datetime import date

import httpx
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

CLIENT_ID = os.environ["EBAY_CLIENT_ID"]
CLIENT_SECRET = os.environ["EBAY_CLIENT_SECRET"]
SALT = os.environ["SELLER_HASH_SALT"]
TODAY = date.today().isoformat()


def hash_seller(username: str | None) -> str | None:
    """Hache irreversiblement le pseudo. La base ne verra jamais le clair."""
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


def cards_to_investigate() -> list[dict]:
    """Les cartes signalees aujourd'hui, avec leur nom pour la recherche eBay."""
    res = (
        supabase.table("anomalies")
        .select("card_id, cards(name)")
        .eq("detected_date", TODAY)
        .not_.like("card_id", "test-%")
        .execute()
    )
    seen, out = set(), []
    for row in res.data:
        cid = row["card_id"]
        if cid in seen:
            continue
        seen.add(cid)
        name = (row.get("cards") or {}).get("name")
        if name:
            out.append({"card_id": cid, "name": name})
    return out


def investigate(client: httpx.Client, token: str, card: dict) -> int:
    res = client.get(
        "https://api.ebay.com/buy/browse/v1/item_summary/search",
        headers={"Authorization": f"Bearer {token}",
                 "X-EBAY-C-MARKETPLACE-ID": "EBAY_FR"},
        params={"q": f"{card['name']} pokemon", "limit": 50},
        timeout=30,
    )
    if res.status_code != 200:
        print(f"✗ {card['name']}: HTTP {res.status_code}")
        return 0

    items = res.json().get("itemSummaries", [])
    rows = []
    for it in items:
        rows.append({
            "card_id": card["card_id"],
            "collected_at": TODAY,
            "title": it.get("title"),
            "price": (it.get("price") or {}).get("value"),
            "currency": (it.get("price") or {}).get("currency"),
            "condition": it.get("condition"),
            "seller_hash": hash_seller((it.get("seller") or {}).get("username")),
            "item_id": it.get("itemId"),
            "raw": None,   # on ne conserve pas le brut : il contient le pseudo en clair
        })
    if rows:
        supabase.table("ebay_listings").upsert(
            rows, on_conflict="item_id,collected_at"
        ).execute()
    print(f"✓ {card['name']}: {len(rows)} annonces")
    return len(rows)


def main() -> None:
    cards = cards_to_investigate()
    if not cards:
        print("Aucune carte a investiguer aujourd'hui.")
        return
    print(f"{len(cards)} carte(s) signalee(s) a investiguer sur eBay\n")
    token = get_token()
    total = 0
    with httpx.Client(timeout=30) as client:
        for card in cards:
            total += investigate(client, token, card)
    supabase.rpc("purge_old_ebay_data", {}).execute()
    print(f"\n{total} annonces collectees.")


if __name__ == "__main__":
    main()
