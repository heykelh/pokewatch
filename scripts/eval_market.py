"""Harness d'evaluation du moteur Price Guide.

Rejoue les scenarios synthetiques et mesure precision / rappel.
Sort en code 1 si une regression est detectee (utilisable en CI).

Usage : python scripts/eval_market.py
"""
import os
import sys
from collections import defaultdict

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

OBS_DATE = "2027-01-30"
EXPECTED_SNAPSHOTS = 810  # 27 produits x 30 jours


def main() -> None:
    expectations = supabase.table("market_eval_expectations").select("*").execute().data
    if not expectations:
        print("✗ ECHEC : aucune attente en base. Le harness ne teste rien.")
        print("  Verifie que sql/022_market_eval.sql a bien ete execute.")
        sys.exit(1)

    snaps = (
        supabase.table("market_snapshots")
        .select("id_product", count="exact", head=True)
        .lt("id_product", 0)
        .execute()
    )
    if (snaps.count or 0) < EXPECTED_SNAPSHOTS:
        print(f"✗ ECHEC : {snaps.count} snapshots de test, {EXPECTED_SNAPSHOTS} attendus.")
        sys.exit(1)

    supabase.table("market_anomalies").delete().lt("id_product", 0).execute()

    rpc = supabase.rpc("run_market_detection", {"p_date": OBS_DATE}).execute()
    if not rpc.data:
        print("✗ ECHEC : run_market_detection n'a rien renvoye.")
        print("  Cause probable : cache de schema PostgREST obsolete.")
        sys.exit(1)

    fired = defaultdict(set)
    severities = {}
    res = (
        supabase.table("market_anomalies")
        .select("id_product, rule, severity")
        .eq("detected_date", OBS_DATE)
        .lt("id_product", 0)
        .execute()
    )
    for row in res.data:
        fired[row["id_product"]].add(row["rule"])
        severities[(row["id_product"], row["rule"])] = row["severity"]

    tp = fp = tn = fn = 0
    failures = []

    print(f"Evaluation du moteur Price Guide — {len(expectations)} attentes\n")
    for exp in sorted(expectations, key=lambda e: (e["scenario"], e["rule"])):
        did = exp["rule"] in fired[exp["id_product"]]
        should = exp["should_fire"]

        if should and did:
            tp += 1
        elif should and not did:
            fn += 1
            failures.append(exp)
        elif not should and did:
            fp += 1
            failures.append(exp)
        else:
            tn += 1

        sev = severities.get((exp["id_product"], exp["rule"]))
        mark = "✓" if did == should else "✗"
        attendu = "DOIT tirer" if should else "DOIT se taire"
        constate = f"a tire (sev. {sev})" if did else "silencieux"
        print(f"  {mark} [{exp['scenario']:20}] {exp['rule']:22} · {attendu:14} · {constate}")

    precision = tp / (tp + fp) if (tp + fp) else 1.0
    recall = tp / (tp + fn) if (tp + fn) else 1.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0

    print(f"\nVrais positifs  : {tp}")
    print(f"Faux positifs   : {fp}")
    print(f"Vrais negatifs  : {tn}")
    print(f"Faux negatifs   : {fn}")
    print(f"\nPrecision : {precision:.0%}  ·  Rappel : {recall:.0%}  ·  F1 : {f1:.2f}")

    if failures:
        print(f"\n{len(failures)} echec(s) :")
        for f in failures:
            print(f"  ✗ [{f['scenario']}] {f['rule']} — {f['rationale']}")
        sys.exit(1)

    print("\nTous les scenarios passent.")


if __name__ == "__main__":
    main()
