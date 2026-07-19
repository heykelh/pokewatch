"""Test de connexion a l'API eBay : obtient un token et fait un appel simple."""
import base64
import os

import httpx
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.environ["EBAY_CLIENT_ID"]
CLIENT_SECRET = os.environ["EBAY_CLIENT_SECRET"]

# 1. Obtenir un token OAuth (client credentials)
def get_token() -> str:
    creds = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    res = httpx.post(
        "https://api.ebay.com/identity/v1/oauth2/token",
        headers={
            "Authorization": f"Basic {creds}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data={
            "grant_type": "client_credentials",
            "scope": "https://api.ebay.com/oauth/api_scope",
        },
        timeout=30,
    )
    res.raise_for_status()
    return res.json()["access_token"]


# 2. Test Browse API : chercher une carte
def test_browse(token: str) -> None:
    res = httpx.get(
        "https://api.ebay.com/buy/browse/v1/item_summary/search",
        headers={
            "Authorization": f"Bearer {token}",
            "X-EBAY-C-MARKETPLACE-ID": "EBAY_FR",
        },
        params={"q": "umbreon vmax alt art 215", "limit": 5},
        timeout=30,
    )
    print(f"Browse API : HTTP {res.status_code}")
    if res.status_code == 200:
        data = res.json()
        print(f"  {data.get('total', 0)} resultats trouves")
        for item in data.get("itemSummaries", [])[:3]:
            print(f"  - {item.get('title', '?')[:50]} · {item.get('price', {}).get('value')} {item.get('price', {}).get('currency')}")
    else:
        print(f"  Reponse : {res.text[:200]}")


def main() -> None:
    print("Obtention du token...")
    token = get_token()
    print("✓ Token obtenu\n")
    test_browse(token)


if __name__ == "__main__":
    main()
