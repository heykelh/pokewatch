"""Rejoue la detection sur tout l'historique disponible.

Idempotent (on conflict do nothing) : rejouable sans dommage.
Necessaire pour constituer la reference d'activite normale du marche.

Usage : python scripts/backfill_detection.py
"""
import os

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


def main() -> None:
    # PostgREST plafonne a 1000 lignes : on ne peut pas lister les dates
    # distinctes par un select simple. On borne et on genere la serie.
    from datetime import date, timedelta

    first = (
        supabase.table("market_snapshots").select("snapshot_date")
        .gt("id_product", 0).order("snapshot_date").limit(1).execute()
    )
    last = (
        supabase.table("market_snapshots").select("snapshot_date")
        .gt("id_product", 0).order("snapshot_date", desc=True).limit(1).execute()
    )
    d0 = date.fromisoformat(first.data[0]["snapshot_date"])
    d1 = date.fromisoformat(last.data[0]["snapshot_date"])

    dates = [(d0 + timedelta(days=i)).isoformat() for i in range((d1 - d0).days + 1)]
    print(f"{len(dates)} jour(s) a traiter : {dates[0]} -> {dates[-1]}\n")

    for d in dates:
        rpc = supabase.rpc("run_market_detection", {"p_date": d}).execute()
        total = sum(r["detections"] for r in (rpc.data or []))
        detail = " · ".join(
            f"{r['rule_name'].split('_', 1)[0]}:{r['detections']}"
            for r in (rpc.data or [])
            if r["detections"] > 0
        )
        print(f"  {d} : {total:4} anomalie(s)  {detail}")

    print("\nBackfill termine.")


if __name__ == "__main__":
    main()
