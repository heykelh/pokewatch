"""Harness d'évaluation du moteur de détection.

Rejoue les scénarios synthétiques et mesure précision / rappel.
Sort en code 1 si une régression est détectée (utilisable en CI).

Usage : python scripts/eval_detection.py
"""
import os
import sys
from collections import defaultdict

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

OBS_DATE = "2027-01-30"  # jour d'observation des scénarios


def main() -> None:
    # Purge des anomalies de test, puis rejeu de la détection sur le jour d'observation
    # Purge des anomalies de test
    supabase.table("anomalies").delete().like("card_id", "test-%").execute()

    # Rejeu de la détection — on vérifie explicitement que le RPC a répondu
    rpc = supabase.rpc("run_detection", {"p_date": OBS_DATE}).execute()
    if not rpc.data:
        print("✗ ÉCHEC : run_detection n'a rien renvoyé.")
        print("  Cause probable : cache de schéma PostgREST obsolète après recréation de la fonction.")
        print("  Correctif : exécuter `notify pgrst, 'reload schema';` dans le SQL Editor.")
        sys.exit(1)
    print("Détection rejouée :")
    for row in rpc.data:
        print(f"  {row['rule_name']}: {row['detections']}")
    print()

    fired = defaultdict(set)  # card_id -> {règles déclenchées}
    res = (
        supabase.table("anomalies")
        .select("card_id, rule, severity")
        .eq("detected_date", OBS_DATE)
        .like("card_id", "test-%")
        .execute()
    )
    severities = {}
    for row in res.data:
        fired[row["card_id"]].add(row["rule"])
        severities[(row["card_id"], row["rule"])] = row["severity"]

    expectations = supabase.table("eval_expectations").select("*").execute().data

    if not expectations:
        print("✗ ÉCHEC : aucune attente en base. Le harness ne teste rien.")
        print("  Vérifie que sql/007_eval_harness.sql a bien été exécuté en entier.")
        sys.exit(1)

    snapshots = (
        supabase.table("cm_price_snapshots")
        .select("id", count="exact", head=True)
        .like("card_id", "test-%")
        .execute()
    )
    if (snapshots.count or 0) < 180:
        print(f"✗ ÉCHEC : {snapshots.count} snapshots de test en base, 180 attendus.")
        sys.exit(1)

    tp = fp = tn = fn = 0
    failures = []

    print(f"Évaluation du moteur — {len(expectations)} attentes\n")
    for exp in sorted(expectations, key=lambda e: (e["scenario"], e["rule"])):
        did_fire = exp["rule"] in fired[exp["card_id"]]
        should = exp["should_fire"]
        ok = did_fire == should

        if should and did_fire:
            tp += 1
        elif should and not did_fire:
            fn += 1
            failures.append(exp)
        elif not should and did_fire:
            fp += 1
            failures.append(exp)
        else:
            tn += 1

        sev = severities.get((exp["card_id"], exp["rule"]))
        mark = "✓" if ok else "✗"
        expected = "DOIT tirer" if should else "DOIT se taire"
        actual = f"a tiré (sév. {sev})" if did_fire else "silencieux"
        print(f"  {mark} [{exp['scenario']:15}] {exp['rule']:18} · {expected:14} · {actual}")

    precision = tp / (tp + fp) if (tp + fp) else 1.0
    recall = tp / (tp + fn) if (tp + fn) else 1.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0

    print(f"\nVrais positifs  : {tp}")
    print(f"Faux positifs   : {fp}")
    print(f"Vrais négatifs  : {tn}")
    print(f"Faux négatifs   : {fn}")
    print(f"\nPrécision : {precision:.0%}  ·  Rappel : {recall:.0%}  ·  F1 : {f1:.2f}")

    if failures:
        print(f"\n{len(failures)} échec(s) :")
        for f in failures:
            print(f"  ✗ [{f['scenario']}] {f['rule']} — {f['rationale']}")
        sys.exit(1)

    print("\nTous les scénarios passent.")


if __name__ == "__main__":
    main()