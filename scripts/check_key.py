import base64
import json
import os

from dotenv import load_dotenv

load_dotenv()
key = os.environ["SUPABASE_SERVICE_KEY"]

if key.startswith("sb_secret_"):
    print("✓ Clé secrète (nouveau format) — OK")
elif key.startswith("sb_publishable_"):
    print("✗ Clé PUBLIABLE — c'est le problème, il faut la clé secrète")
else:
    payload = key.split(".")[1]
    payload += "=" * (-len(payload) % 4)
    decoded = json.loads(base64.b64decode(payload))
    role = decoded.get("role")
    print(f"Rôle de la clé : {role}")
    print("✓ Correct" if role == "service_role" else "✗ PROBLÈME : ce doit être 'service_role'")