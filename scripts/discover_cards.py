"""Découverte hebdomadaire : nouveaux sets, sets qui grossissent, re-sondage des 404.

Cache les métadonnées de sets dans discovery_sets pour ne fetcher que le nécessaire.
"""
import os
import time
from datetime import date, timedelta

import httpx
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

API = "https://api.tcgdex.net/v2/en"
MIN_TREND_EUR = 5.0
RECENT_MONTHS = 6
TODAY = date.today()


def existing_ids_and_products() -> tuple[set[str], set[str]]:
    res = supabase.table("cards").select("id, cm_id_product").execute()
    ids = {r["id"] for r in res.data}
    products = {r["cm_id_product"] for r in res.data if r["cm_id_product"]}
    return ids, products


def try_add(client: httpx.Client, card_id: str, reason: str,
            known_ids: set[str], known_products: set[str]) -> str:
    """Retourne 'added' | 'missing' | 'skipped'."""
    if card_id in known_ids:
        return "skipped"
    res = client.get(f"{API}/cards/{card_id}")
    if res.status_code != 200:
        return "missing"
    card = res.json()
    cm = (card.get("pricing") or {}).get("cardmarket")
    if not cm:
        return "missing"
    id_product = str(cm.get("idProduct", ""))
    if id_product and id_product in known_products:
        return "skipped"
    trend = max(cm.get("trend") or 0, cm.get("trend-holo") or 0)
    if trend < MIN_TREND_EUR:
        return "skipped"

    supabase.table("cards").upsert({
        "id": card["id"], "name": card["name"],
        "set_id": (card.get("set") or {}).get("id", "unknown"),
        "set_name": (card.get("set") or {}).get("name"),
        "rarity": card.get("rarity"), "image_url": card.get("image"),
        "watchlist": True, "cm_id_product": id_product or None,
    }).execute()
    supabase.table("watchlist_log").insert({
        "card_id": card["id"], "reason": reason,
    }).execute()
    known_ids.add(card["id"])
    known_products.add(id_product)
    print(f"  ✓ {card_id} · {card['name']} · trend {trend}€")
    return "added"


def get_set_cache() -> dict[str, dict]:
    res = supabase.table("discovery_sets").select("*").execute()
    return {r["set_id"]: r for r in res.data}


def scan_set_cards(client: httpx.Client, set_detail: dict, reason: str,
                   known_ids: set[str], known_products: set[str]) -> int:
    card_ids = [c["id"] for c in set_detail.get("cards", [])]
    new_ids = [cid for cid in card_ids if cid not in known_ids]
    added = 0
    if new_ids:
        print(f"— {set_detail['id']} ({set_detail.get('name')}) : {len(new_ids)} carte(s) à évaluer")
        for cid in new_ids:
            if try_add(client, cid, reason, known_ids, known_products) == "added":
                added += 1
            time.sleep(0.25)
    return added


def scan_sets(client: httpx.Client, known_ids: set[str], known_products: set[str]) -> int:
    cutoff = (TODAY - timedelta(days=RECENT_MONTHS * 30)).isoformat()
    cache = get_set_cache()
    res = client.get(f"{API}/sets")
    listing = res.json()
    print(f"Sets au catalogue : {len(listing)} · en cache : {len(cache)}")
    added = 0

    for brief in listing:
        set_id = brief["id"]
        listed_count = (brief.get("cardCount") or {}).get("total")
        cached = cache.get(set_id)

        is_new = cached is None
        has_grown = (cached is not None and listed_count is not None
                     and cached.get("card_count") != listed_count)
        if not is_new and not has_grown:
            continue

        detail_res = client.get(f"{API}/sets/{set_id}")
        time.sleep(0.25)
        if detail_res.status_code != 200:
            continue
        detail = detail_res.json()
        release_date = detail.get("releaseDate")

        supabase.table("discovery_sets").upsert({
            "set_id": set_id,
            "name": detail.get("name"),
            "release_date": release_date,
            "card_count": listed_count,
            "last_scanned": TODAY.isoformat(),
        }).execute()

        if is_new and (release_date or "") >= cutoff:
            added += scan_set_cards(client, detail, f"scan nouveau set récent {set_id}",
                                    known_ids, known_products)
        elif has_grown:
            added += scan_set_cards(client, detail, f"set {set_id} agrandi",
                                    known_ids, known_products)
    return added


def retry_probes(client: httpx.Client, known_ids: set[str], known_products: set[str]) -> int:
    res = supabase.table("discovery_probes").select("*").eq("resolved", False).execute()
    probes = res.data
    print(f"Sondes actives : {len(probes)}")
    added = 0
    for p in probes:
        status = try_add(client, p["card_id"], f"sonde résolue ({p['reason']})",
                         known_ids, known_products)
        update = {"last_probed": TODAY.isoformat()}
        if status == "added":
            update["resolved"] = True
            added += 1
        supabase.table("discovery_probes").update(update).eq("card_id", p["card_id"]).execute()
        time.sleep(0.25)
    return added


def main() -> None:
    known_ids, known_products = existing_ids_and_products()
    with httpx.Client(timeout=15) as client:
        a = scan_sets(client, known_ids, known_products)
        b = retry_probes(client, known_ids, known_products)
    print(f"\nDécouverte terminée : {a} carte(s) via sets, {b} via sondes.")


if __name__ == "__main__":
    main()