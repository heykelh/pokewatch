"""Diagnostic : que renvoie vraiment pokemontcg.io ?"""
import httpx

with httpx.Client(timeout=30, follow_redirects=True) as c:
    r = c.get("https://api.pokemontcg.io/v2/sets")
    print("Status:", r.status_code)
    print("Content-Type:", r.headers.get("content-type"))
    print("Debut de la reponse :")
    print(r.text[:500])
