"""Genere le bilan quotidien narratif a partir du dossier factuel.

Le LLM ne calcule rien, ne detecte rien, ne decide rien : il redige.
Chaque chiffre cite est verifie contre le dossier source apres generation.

Usage : python scripts/generate_report.py [--date YYYY-MM-DD] [--dry-run]
"""
import argparse
import json
import os
import re
import sys
from datetime import date

import httpx
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """Tu es l'analyste de PokéWatch, un système de surveillance du marché des cartes Pokémon.

Tu rédiges le bilan quotidien. Ton style est vivant et accessible, jamais jargonneux, jamais sensationnaliste. Tu écris pour un collectionneur curieux, pas pour un trader.

RÈGLES ABSOLUES, non négociables :

1. Tu ne cites QUE des chiffres présents dans le dossier fourni. Jamais d'estimation, jamais d'arrondi inventé, jamais de pourcentage calculé de tête.
2. Tu n'accuses JAMAIS personne. Le vocabulaire est celui de la suspicion documentée : "compatible avec", "pourrait indiquer", "mérite d'être suivi". Jamais "quelqu'un a manipulé".
3. Tu tiens compte du statut des règles. Une règle en "signal faible" ou "suspendue" ne peut pas fonder une conclusion ferme, et tu le dis.
4. S'il ne se passe rien, TU LE DIS. Une journée calme est une information, pas un échec. Ne brode jamais pour remplir.
5. Tu rappelles, quand c'est pertinent, qu'une alerte est un candidat à investigation, pas un verdict.
6. DISTINGUE l'absence de données de l'absence d'événement. Si `data_available` est faux, cela signifie que le système n'a PAS OBSERVÉ le marché ce jour-là. Tu ne peux alors rien conclure sur l'état du marché : tu signales que la collecte n'a pas eu lieu, et tu t'arrêtes là. Ne dis JAMAIS que le marché est calme si tu ne l'as pas regardé.
7. Ne récite pas la liste des règles et de leurs statuts comme un inventaire. Mentionne-les seulement si elles éclairent la lecture du jour, en une phrase, dans le fil du texte.

FORMAT DE SORTIE : uniquement du JSON, sans préambule ni balises Markdown.

{
  "headline": "Une phrase accrocheuse et honnête, 10 mots max",
  "body": "2 à 4 paragraphes. Le premier plante le décor du jour. Les suivants détaillent ce qui mérite l'attention, s'il y a lieu. Si la journée est calme, un seul paragraphe suffit, et il le dit clairement.",
  "verdict": "calme" | "signaux_faibles" | "attention" | "alerte" | "donnees_indisponibles"
}

Exemple de journée calme (à suivre sans hésiter si c'est le cas) :
{
  "headline": "Rien à signaler, et c'est très bien ainsi",
  "body": "Le marché a passé une journée sans relief. Aucune carte n'a déclenché d'alerte, et le mouvement médian est resté proche de zéro.\\n\\nÀ noter que deux de nos règles sont actuellement en signal faible : même une journée agitée aurait été difficile à interpréter avec certitude. Le moteur se renforcera à mesure que l'historique s'accumule.",
  "verdict": "calme"
}

Exemple de collecte manquante (à suivre si data_available est faux) :
{
  "headline": "Pas de bilan aujourd'hui : le marché n'a pas été observé",
  "body": "Les données du jour ne sont pas encore disponibles. Le système n'a donc rien pu observer, et il serait malhonnête d'en tirer la moindre conclusion sur l'état du marché.\\n\\nCe bilan sera régénéré dès que la collecte aura eu lieu.",
  "verdict": "donnees_indisponibles"
}
"""


def extract_numbers(text: str) -> set[str]:
    """Extrait les nombres cites dans le texte, pour verification."""
    return set(re.findall(r"\d+(?:[.,]\d+)?", text))


def dossier_numbers(dossier: dict) -> set[str]:
    """Tous les nombres presents dans le dossier, sous forme de chaines."""
    raw = json.dumps(dossier, ensure_ascii=False)
    nums = set(re.findall(r"\d+(?:\.\d+)?", raw))
    # Tolerance : variantes d'ecriture (virgule/point, entier/decimal)
    extended = set(nums)
    for n in nums:
        extended.add(n.replace(".", ","))
        if "." in n:
            extended.add(n.split(".")[0])
    return extended


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=date.today().isoformat())
    ap.add_argument("--dry-run", action="store_true", help="N'ecrit pas en base")
    args = ap.parse_args()

    dossier = supabase.rpc("build_daily_dossier", {"p_date": args.date}).execute().data
    if not dossier:
        print("✗ Dossier vide : la fonction n'a rien renvoye.")
        sys.exit(1)

    print(f"Dossier du {args.date} :")
    print(f"  {dossier.get('cards_scanned', 0)} cartes scannees")
    print(f"  {len(dossier.get('anomalies', []))} anomalie(s)")
    print(f"  {dossier.get('history_days', 0)} jour(s) d'historique\n")

    resp = httpx.post(
        GROQ_URL,
        headers={"Authorization": f"Bearer {os.environ['GROQ_API_KEY']}"},
        json={
            "model": MODEL,
            "temperature": 0.4,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"Dossier factuel du {args.date} :\n\n"
                    + json.dumps(dossier, ensure_ascii=False, indent=2),
                },
            ],
        },
        timeout=60,
    )
    resp.raise_for_status()
    report = json.loads(resp.json()["choices"][0]["message"]["content"])

    print("─" * 60)
    print(f"  {report['headline']}")
    print("─" * 60)
    print(report["body"])
    print("─" * 60)
    print(f"Verdict : {report['verdict']}\n")

    # GARDE-FOU : tout chiffre cite doit exister dans le dossier
    cited = extract_numbers(report["headline"] + " " + report["body"])
    known = dossier_numbers(dossier)
    # On tolere les petits entiers (numeros de paragraphe, "2 regles", annees)
    suspicious = {n for n in cited - known if len(n) > 2 and n not in {"2026", "2027"}}

    if suspicious:
        print(f"⚠ HALLUCINATION POSSIBLE : chiffres absents du dossier : {sorted(suspicious)}")
        print("  Le bilan n'est PAS enregistre.")
        sys.exit(1)

    print("✓ Verification : tous les chiffres cites proviennent du dossier.")

    if args.dry_run:
        print("[DRY-RUN] Rien ecrit en base.")
        return

    supabase.table("daily_reports").upsert({
        "report_date": args.date,
        "headline": report["headline"],
        "body": report["body"],
        "verdict": report["verdict"],
        "dossier": dossier,
        "model": MODEL,
    }).execute()
    print(f"✓ Bilan du {args.date} enregistre.")


if __name__ == "__main__":
    main()