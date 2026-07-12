# Rituel quotidien PokéWatch
# Prerequis : avoir telecharge le Price Guide depuis Cardmarket
Set-Location $PSScriptRoot
.\.venv\Scripts\Activate.ps1

Write-Host "`n=== Ingestion du Price Guide ===" -ForegroundColor Cyan
python scripts/ingest_priceguide.py

Write-Host "`n=== Etat de l'historique ===" -ForegroundColor Cyan
python -c "import os; from dotenv import load_dotenv; from supabase import create_client; load_dotenv(); s = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_KEY']); r = s.table('market_snapshots').select('snapshot_date').execute(); dates = sorted(set(x['snapshot_date'] for x in r.data)); print(f'{len(dates)} jours collectes : {dates[0]} -> {dates[-1]}')"