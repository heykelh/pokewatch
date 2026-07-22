"""Detection sur le Price Guide (moteur refonde, 22 000 cartes).

Usage : python scripts/detect_market.py [--date YYYY-MM-DD]
"""
import argparse
import os
import sys
from datetime import date

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=date.today().isoformat())
    args = ap.parse_args()

    rpc = supabase.rpc("run_market_detection", {"p_date": args.date}).execute()
    if not rpc.data:
        print("✗ run_market_detection n'a rien renvoye (cache PostgREST ?).")
        sys.exit(1)

    print(f"Detection du {args.date} :")
    total = 0
    for row in rpc.data:
        print(f"  {row['rule_name']}: {row['detections']}")
        total += row["detections"]

    if total == 0:
        print("\nAucune anomalie aujourd'hui.")
        return

    res = (
        supabase.table("market_anomalies")
        .select("id_product, rule, severity, details")
        .eq("detected_date", args.date)
        .order("severity", desc=True)
        .limit(30)
        .execute()
    )
    print(f"\n{len(res.data)} anomalie(s) affichee(s) :")
    for a in res.data:
        print(f"  ⚠ produit {a['id_product']} · {a['rule']} · sev {a['severity']}")


if __name__ == "__main__":
    main()
