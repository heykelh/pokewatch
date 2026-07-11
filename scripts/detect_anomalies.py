"""Exécute le moteur de détection SQL et affiche le bilan du jour."""
import os
from datetime import date

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

TODAY = date.today().isoformat()


def main() -> None:
    result = supabase.rpc("run_detection", {"p_date": TODAY}).execute()
    print(f"Détection du {TODAY} :")
    for row in result.data:
        print(f"  {row['rule_name']}: {row['detections']} anomalie(s)")

    anomalies = (
        supabase.table("anomalies")
        .select("card_id, rule, severity, details, cards(name, set_name)")
        .eq("detected_date", TODAY)
        .order("severity", desc=True)
        .execute()
    )
    if not anomalies.data:
        print("\nAucune anomalie aujourd'hui.")
        return

    print(f"\n{len(anomalies.data)} anomalie(s) détectée(s) :")
    for a in anomalies.data:
        card = a.get("cards") or {}
        print(f"  ⚠ {card.get('name')} ({a['card_id']}) · {a['rule']} · sévérité {a['severity']}")
        print(f"    → {a['details'].get('reading')}")


if __name__ == "__main__":
    main()