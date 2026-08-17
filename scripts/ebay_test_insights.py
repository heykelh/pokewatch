"""Diagnostic : le compte eBay a-t-il acces aux VENTES CONCLUES ?

La Marketplace Insights API (item_sales) donne l'historique des transactions
reelles, contrairement a la Browse API qui ne montre que les annonces actives.
Son acces est restreint et doit souvent etre demande explicitement.

Ce script tente d'obtenir le scope requis, puis d'appeler l'endpoint.
"""
import base64
import os

import httpx
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.environ["EBAY_CLIENT_ID"]
CLIENT_SECRET = os.environ["EBAY_CLIENT_SECRET"]

INSIGHTS_SCOPE = "https://api.ebay.com/oauth/api_scope/buy.marketplace.insights"


def get_token(scope: str) -> tuple[bool, str]:
    creds = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    res = httpx.post(
        "https://api.ebay.com/identity/v1/oauth2/token",
        headers={"Authorization": f"Basic {creds}",
                 "Content-Type": "application/x-www-form-urlencoded"},
        data={"grant_type": "client_credentials", "scope": scope},
        timeout=30,
    )
    if res.status_code != 200:
        return False, res.text[:300]
    return True, res.json()["access_token"]


def main() -> None:
    print("=== Test 1 : obtention du scope Marketplace Insights ===")
    ok, result = get_token(INSIGHTS_SCOPE)

    if not ok:
        print("✗ Scope REFUSE.")
        print(f"  Reponse : {result}")
        print("\n  => Ton compte n'a PAS acces aux ventes conclues.")
        print("     Il faut en faire la demande sur le portail developpeur eBay")
        print("     (section 'Marketplace Insights API', acces restreint).")
        print("     En attendant, on reste sur la Browse API (annonces actives).")
        return

    print("✓ Scope accorde. Le token contient le droit 'insights'.\n")

    print("=== Test 2 : appel reel de l'endpoint des ventes conclues ===")
    token = result
    res = httpx.get(
        "https://api.ebay.com/buy/marketplace_insights/v1_beta/item_sales/search",
        headers={"Authorization": f"Bearer {token}",
                 "X-EBAY-C-MARKETPLACE-ID": "EBAY_FR"},
        params={"q": "umbreon vmax 215 pokemon", "limit": 5},
        timeout=30,
    )
    print(f"HTTP {res.status_code}")
    if res.status_code == 200:
        data = res.json()
        print(f"✓ ACCES CONFIRME. {data.get('total', 0)} ventes conclues trouvees.")
        for sale in data.get("itemSales", [])[:3]:
            price = (sale.get("lastSoldPrice") or {}).get("value")
            date = sale.get("lastSoldDate")
            cond = sale.get("condition")
            print(f"  - {price} EUR · {cond} · vendu le {date}")
        print("\n  => Tu as acces aux VENTES CONCLUES. C'est la meilleure source.")
    else:
        print(f"  Reponse : {res.text[:300]}")
        print("\n  => Scope accorde mais endpoint inaccessible.")
        print("     Souvent : l'API est en acces limite malgre le scope.")


if __name__ == "__main__":
    main()
