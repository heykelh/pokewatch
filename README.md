# PokéWatch

**Surveillance de marché appliquée au TCG Pokémon.** Détection de mouvements de prix anormaux par règles déterministes, scores explicables, et refus assumé de conclure quand les preuves manquent.

🔗 **Dashboard public** : [pokewatch-three.vercel.app](https://pokewatch-three.vercel.app)

---

## Le projet en une phrase

Le marché des cartes Pokémon présente toutes les caractéristiques d'un marché financier immature : des actifs échangés à plusieurs milliers d'euros, une asymétrie d'information massive, aucune obligation de transparence, et aucun régulateur. Les mécanismes de manipulation y sont identiques à ceux de la finance (corner sur l'offre, gonflement artificiel des cours, exploitation d'informations privilégiées). PokéWatch transpose à ce marché les principes des dispositifs de surveillance des marchés réglementés.

**Ce n'est pas un tracker de prix.** Il en existe des dizaines. La question posée ici n'est pas *"combien vaut ma carte ?"* mais *"ce mouvement de prix est-il honnête ?"*.

---

## Ce que le projet est, et ce qu'il n'est pas

| Le projet **fait** | Le projet **ne fait pas** |
|---|---|
| Détecter des mouvements de prix statistiquement anormaux | Identifier des personnes (aucune IP, aucun compte, aucune identité) |
| Produire des alertes documentées avec preuves chiffrées | Accuser qui que ce soit de manipulation |
| Distinguer les mouvements suspects des mouvements légitimes | Prédire les prix futurs |
| Publier ses métriques de performance, ses erreurs et ses limites | Prétendre à une exhaustivité ou une certitude qu'il n'a pas |
| S'appuyer exclusivement sur des sources officielles | Scraper des sites en violation de leurs conditions d'utilisation |

**Principe cardinal : une alerte est un candidat à investigation, pas un verdict.**

---

## Architecture

```
Cardmarket Price Guide (quotidien, ~14 500 cartes)
        │
        ├──► Ingestion Python ──► Supabase (Postgres)
        │                              │
TCGdex API (watchlist, 219 cartes)     │
        │                              ▼
        └──► GitHub Actions ──►  Moteur de détection (SQL pur)
             (cron quotidien)          │
                                       ▼
                                  Table `anomalies`
                                       │
                          ┌────────────┴────────────┐
                          ▼                         ▼
                 Dashboard Next.js          Harness d'évaluation
                 (Vercel, public)           (CI, 9 scénarios)
```

**Stack**
- **Données** : Python (httpx, supabase-py), Cardmarket Price Guide, TCGdex API
- **Base** : Supabase (Postgres), moteur de détection en SQL pur (fonctions PL/pgSQL, vues fenêtrées)
- **Orchestration** : GitHub Actions (ingestion quotidienne, découverte hebdomadaire, évaluation en CI)
- **Frontend** : Next.js 15, TypeScript, Tailwind, VisActor, déployé sur Vercel
- **Qualité** : harness d'évaluation rejoué à chaque modification du moteur

**Choix d'architecture structurant : la détection est 100 % déterministe.** Aucun modèle opaque dans la chaîne de décision. Chaque alerte est reproductible à partir de ses données sources, et chaque seuil vit en base de données, versionné et daté. C'est un choix de gouvernance autant que de technique : un système de surveillance qui ne peut pas justifier ses alertes n'a aucune légitimité.

---

## Les règles de détection

| Règle | Ce qu'elle cherche | Statut |
|---|---|---|
| **R1** `low_above_trend` | Le prix plancher dépasse le prix de référence : les offres bon marché ont disparu (signature d'un rachat de marché) | ⚠️ Signal faible |
| **R2** `avg1_divergence` | Les ventes du jour décrochent de la moyenne mensuelle | ❌ **Suspendue** |
| **R3** `low_jump` | Le plancher bondit en 24h alors que le prix de référence n'a pas bougé | ⚠️ Signal faible |
| **R4** `trend_zscore` | Variation anormale au regard de la volatilité propre de la carte | ⏳ En attente d'historique |
| **R5** `set_wave` | Plusieurs cartes du même set signalées le même jour | ✅ Active |
| **R6** `pokemon_wave` | Plusieurs cartes du même Pokémon signalées le même jour, tous sets confondus | ✅ Active |

Les statuts ci-dessus ne sont pas des aveux de faiblesse : ils sont le résultat d'un travail de vérification des données sources qui a invalidé plusieurs hypothèses initiales. **Le détail se trouve dans le journal ci-dessous, et c'est la partie la plus intéressante de ce projet.**

---

## Performance mesurée

Le moteur est évalué sur neuf scénarios synthétiques dérivés de patterns réellement observés sur le marché. Chaque scénario reproduit un cas : rachat de plancher, hausse fabriquée, hausse légitime, marché sans échanges, offre hors-marché. Le moteur doit détecter les premiers et rester silencieux sur les seconds. L'évaluation est rejouée automatiquement à chaque modification du moteur.

| Métrique | Avant calibration | Après calibration |
|---|---|---|
| Précision | 50 % | **100 %** |
| Rappel | 100 % | **100 %** |
| F1 | 0,67 | **1,00** |
| Faux positifs | 2 | **0** |

**Ces chiffres mesurent la _correction_ du moteur** (fait-il ce que son code prétend faire ?), **pas la _validité_ des hypothèses sous-jacentes.** C'est une distinction essentielle, et le journal ci-dessous montre pourquoi : un moteur peut être parfaitement correct et parfaitement faux, s'il repose sur une mauvaise compréhension de ses données.

---

## Journal de bord et découvertes

Cette section est le cœur du projet. Elle documente ce qui a été trouvé, comment, et ce que ça a changé. **Un système de surveillance qui dissimulerait ses propres défauts n'aurait aucune légitimité à en signaler chez les autres.**

### Jour 1 : le mapping N-vers-1

Premier bilan de détection : **44 anomalies sur 151 cartes** (29 % de la watchlist). Anormalement élevé.

En inspectant les résultats, quatre cartes affichaient une sévérité *rigoureusement identique* (18,02). Sur des marchés indépendants, cette coïncidence est statistiquement impossible. Vérification :

```sql
select raw->>'idProduct', count(*), array_agg(card_id)
from cm_price_snapshots
where snapshot_date = '2026-07-10'
group by 1 having count(*) > 1;
```

**Résultat : 11 groupes de doublons.** Plusieurs identifiants de cartes du référentiel TCGdex pointaient vers un **même produit Cardmarket**. Mêmes prix, donc mêmes anomalies, dupliquées. Pire : la règle R5 (vague intra-set) interprétait ces clones comme une *coordination* entre plusieurs cartes.

**Correctif** : contrainte d'unicité sur le produit de marché, colonne `cm_id_product` ajoutée au référentiel, déduplication rétroactive. Watchlist réelle : 137 produits uniques, pas 151.

**Leçon** : un défaut d'unicité dans les données de référence produit des alertes fantômes *et* de fausses coordinations. C'est un problème de qualité des données, pas d'algorithme.

---

### Jour 2 : les alertes fantômes du marché mince

Deux cartes déclenchaient chaque jour les alertes de plus haute sévérité du système :

- **Pikachu ex5.5-5** (Poké Card Creator Pack, 2004) : prix de référence 400 €, prix plancher **40 000 €**. Ratio : 100.
- **Mew 554275** : prix de référence 5 550 €, prix plancher **100 000 €**. Ratio : 20.

Ce ne sont pas des rachats de marché. Ce sont des vendeurs qui affichent un prix qu'ils ne comptent pas obtenir. La règle R1, conçue pour détecter un plancher *artificiellement relevé par un buyout*, se déclenchait sur des **offres hors-marché**.

**Correctif** : R1 ne s'active plus que dans une **fourchette de plausibilité** (ratio entre 1,3 et 3). Au-delà, il ne s'agit plus d'une manipulation économiquement rationnelle, mais d'un listing fantaisiste.

**Leçon** : un seuil minimum ne suffit pas. Une signature de manipulation a une *plage* de valeurs plausibles, bornée par la rationalité économique de l'opération.

---

### Jour 3 : un harness qui ne testait rien

Construction du harness d'évaluation. Premier résultat : **« 100 % de précision, tous les scénarios passent »**.

Sauf qu'il n'y avait aucun scénario en base. Le script avait trouvé zéro attente, divisé zéro par zéro, et affiché un score parfait.

**Correctif** : le harness vérifie désormais qu'il a de quoi tester avant de conclure, et échoue explicitement sinon.

**Leçon** : **un test qui ne peut pas échouer est un test qui ne sert à rien.** Un système de mesure doit toujours pouvoir dire « je n'ai pas pu mesurer ».

Dans la foulée, deux autres défauts du harness ont été trouvés :
- les vues du moteur filtraient sur la source des données, rendant les scénarios de test **invisibles au moteur** ;
- un appel de fonction échouait **silencieusement** côté client, faussant tous les résultats.

Le harness a passé plus de temps à révéler ses propres bugs que ceux du moteur. C'est le prix de la fiabilité, et c'est du temps bien investi.

---

### Jour 3 : post-mortem d'un incident de production

**Symptôme** : le moteur, correct en SQL direct, ne produisait plus aucune alerte via le pipeline applicatif.

**Cause racine** : l'ouverture du dashboard au public avait nécessité l'activation de Row Level Security sur les tables. Les politiques créées n'autorisaient que la **lecture**. Or la clé utilisée par les scripts backend était une clé *publiable*, et non une clé *secrète* : elle ne contournait donc pas RLS. **La chaîne d'écriture du backend était rompue.**

Une décision de sécurité côté frontend avait silencieusement cassé le pipeline de données.

**Correctifs** :
- clé secrète côté serveur, clé publiable réservée au frontend ;
- `security definer` sur les fonctions de traitement, pour qu'elles s'exécutent avec les droits de leur propriétaire ;
- script de vérification de la clé, exécutable à tout moment.

**Détecté par le harness d'évaluation avant tout impact sur les données de production.**

---

### Jour 3 : la découverte majeure, les moyennes sont figées

C'est le tournant du projet.

La règle R2, la plus prolifique du moteur (19 à 28 alertes par jour), reposait sur la comparaison entre le prix moyen des ventes du jour (`avg1`) et la moyenne sur 30 jours (`avg30`), tous deux fournis par la source.

En observant les bilans quotidiens, une anomalie saute aux yeux : **les mêmes cartes, avec les mêmes sévérités, à la décimale près, jour après jour.** Charizard GX : 4,66 le 11, 4,66 le 12. Lugia : 3,33 les deux jours.

Vérification sur deux relevés consécutifs du **catalogue Cardmarket complet** :

```
70 975 singles communs aux deux fichiers

  avg    :   2919 cartes ont changé (4,1 %)
  low    :   2066 cartes ont changé (2,9 %)
  trend  :  11780 cartes ont changé (16,6 %)
  avg1   :      0 cartes ont changé (0,0 %)
  avg7   :      0 cartes ont changé (0,0 %)
  avg30  :      0 cartes ont changé (0,0 %)
```

**Zéro. Sur soixante-dix mille cartes. En vingt-quatre heures.**

Les moyennes de vente ne sont pas rafraîchies quotidiennement par la source. R2 ne détectait **aucun mouvement** : elle resignalait chaque jour un rapport statique, figé. Toutes ses alertes étaient vides de sens.

**Correctif** : R2 suspendue, alertes purgées, décision tracée en base avec sa justification.

**Leçon, et elle est fondamentale** : le harness affichait F1 = 1,00. Il avait raison, le moteur faisait *exactement ce que son code disait*. Mais le code reposait sur une **hypothèse erronée quant à la signification des données**. Un test d'intégration valide la correction, pas la validité sémantique. **Il faut aller vérifier ce que les champs veulent dire, sur les données réelles, avant de construire dessus.**

---

### Jour 3 : le prix plancher mélange les états de conservation

Une carte cotée **253 €** affichait un prix plancher à **11,89 €**.

Les prix publics de Cardmarket agrègent **tous les états de conservation**, de l'exemplaire très abîmé (*Poor*) au neuf (*Mint*). Le « prix plancher » n'est donc pas le prix d'entrée du marché : c'est **le prix de la pire carte disponible**.

Conséquence : les règles R1 et R3, entièrement fondées sur ce champ, comparaient des grandeurs non comparables. Un « saut du plancher » peut simplement signifier que le vendeur de l'exemplaire le plus abîmé a écoulé sa carte.

**Mesure** : 61 cartes sur 219 (**28 % de la watchlist**) ont un plancher inférieur à 20 % de leur prix de référence.

**Correctif** : R1 et R3 rétrogradées en signaux faibles. Leur refonte reposera sur l'**écart du plancher à sa propre habitude**, et non sur sa valeur absolue : la composition des états disponibles pour une carte donnée étant relativement stable dans le temps, une rupture de ce ratio reste un signal exploitable.

---

### Jour 4 : le prix de référence lui-même est instable

Premier scan large (14 500 cartes). Les plus fortes hausses du jour :

```
Murkrow          7 €  →   274 €    (+3 718 %)
Yveltal EX      30 €  →   400 €    (+1 233 %)
Gengar Prime   357 €  →  3 332 €     (+834 %)
```

Aucun rachat de marché ne produit cela. Multiplier un prix par dix en vingt-quatre heures supposerait d'acquérir la totalité de l'offre mondiale d'une carte.

L'explication tient au même vice que précédemment : **le prix de référence est calculé à partir des ventes récentes, tous états confondus.** Sur une carte peu liquide (vintage, rare), il repose sur une poignée de transactions. Le jour où un exemplaire en excellent état se vend alors que les précédents étaient abîmés, le prix de référence explose mécaniquement. **Ce n'est pas le marché qui bouge, c'est l'échantillon qui change.**

**Correctif** : plafond de plausibilité sur les variations quotidiennes. Au-delà de ±80 % en 24 heures, il ne s'agit pas d'un mouvement de marché mais d'un défaut de mesure.

**Parade de fond** : exiger la **persistance dans le temps**. Une carte dont le prix bouge *et reste bougé* le lendemain a vécu quelque chose. Une carte qui fait un aller-retour a été mal mesurée. Cette règle exige de l'historique, ce qui nous amène au constat suivant.

---

## Le constat structurant : l'historique est le produit

Aucune source publique ne distribue d'historique de prix quotidien pour le TCG Pokémon. Les acteurs qui affichent des courbes (PriceCharting, Card Ladder) ont construit le leur exactement de la même façon : en photographiant le marché tous les jours, pendant des années. C'est leur fonds de commerce, et ils le vendent.

**Il n'y a pas de raccourci.** Les moyennes que l'on croyait obtenir gratuitement de la source n'existent pas. Il faut les construire.

Cela transforme la nature du projet :

- La collecte quotidienne n'est pas un *moyen* d'arriver au produit. **Elle est le produit.**
- Un concurrent qui repartirait de zéro aujourd'hui devrait attendre un mois pour disposer de la même matière.
- Le code, lui, se réécrit en deux semaines. **La barrière à l'entrée est temporelle, pas technique.**

**Calendrier de montée en puissance :**

| Échéance | Ce qui s'active |
|---|---|
| **Aujourd'hui** | Collecte quotidienne sur ~14 500 cartes. Règles de contexte (R5, R6) actives. |
| **J+7** | Moyennes mobiles calculées sur notre propre historique. R2 refondée sur du mouvement réel. |
| **J+14** | R4 (détection statistique par carte) s'active. R7 (divergence au marché) entre en service. |
| **J+30** | Moteur à pleine puissance, sur une chaîne de données entièrement maîtrisée. |

---

## Une investigation : l'affaire Ectoplasma

Les 10 et 11 juillet, le moteur signale **six cartes du même Pokémon (Ectoplasma), issues de six extensions différentes** couvrant quinze ans de jeu. Six marchés indépendants qui bougent le même jour : ce n'est pas un hasard statistique.

**Hypothèse 1 — manipulation coordonnée.** Techniquement possible, économiquement absurde : racheter le stock de six cartes réparties sur six marchés indépendants coûterait une fortune pour un rendement dilué.

**Hypothèse 2 — engouement pour le personnage.** Le bloc Méga-Évolution vient de sortir, avec Mega Gengar ex parmi ses cartes vedettes. Quand un Pokémon revient sur le devant de la scène, la demande se propage à toute sa gamme historique.

**Verdict : mouvement organique probable. Aucune manipulation retenue.** L'hypothèse de l'engouement explique l'intégralité du signal à un coût d'hypothèse bien moindre, et s'appuie sur un fait vérifiable et daté.

**Ce que ce cas a changé** : le moteur savait détecter les vagues au sein d'un même *set*, mais était aveugle aux vagues au sein d'un même *personnage*. Il a fallu qu'un humain lise les noms dans la liste pour voir la corrélation. D'où la règle **R6 · Vague intra-Pokémon**, née d'un cas réel et non d'une intuition. Sa particularité : elle peut révéler une coordination, mais elle peut aussi **innocenter** un mouvement. C'est une règle de contexte autant que d'alerte.

---

## Limites assumées

1. **Le marché des cartes n'est pas régulé.** Il n'existe ni régulateur, ni obligation de transparence, ni sanction. PokéWatch n'a aucun pouvoir de contrainte et ne prétend à aucune autorité.

2. **Les données publiques ne permettent pas d'identifier les acteurs.** Aucune adresse IP, aucun compte acheteur, aucune identité réelle n'est accessible, ni recherchée. Le système détecte des schémas, pas des personnes.

3. **Les prix ne distinguent pas l'état des cartes.** Limite structurelle de la source, documentée ci-dessus, avec ses conséquences sur trois règles.

4. **Les mouvements légitimes existent.** Sorties d'extensions, rotation du format de jeu, résultats de tournois, exposition médiatique. Le moteur repère l'anormal, il ne lit pas dans les intentions.

5. **Les seuils sont des hypothèses en cours de validation.** Le taux de faux positifs est mesuré, publié et travaillé, pas dissimulé derrière un vernis de certitude.

---

## Gouvernance et conformité

Le projet applique par construction les principes suivants :

- **Sources officielles uniquement.** Price Guide Cardmarket (téléchargement officiel), API publique TCGdex. Aucun scraping, aucune donnée obtenue en violation de conditions d'utilisation.
- **Minimisation des données personnelles.** Le système analyse des prix, pas des personnes. Toute future donnée de vendeur sera pseudonymisée dès la collecte, avec finalité déclarée et durée de conservation limitée.
- **Traçabilité de bout en bout.** Les réponses brutes de la source sont conservées avec chaque instantané, permettant de recalculer toute alerte a posteriori. Les seuils vivent en base, datés : on peut toujours répondre à « avec quels réglages cette alerte a-t-elle été produite ? ».
- **Idempotence.** Les traitements sont rejouables sans créer de doublons ni corrompre l'historique.
- **Journalisation.** Chaque entrée d'une carte dans le périmètre de surveillance est journalisée avec sa date et son motif.
- **Vocabulaire de suspicion, jamais d'accusation.**

---

## Feuille de route

**Court terme**
- Moyennes mobiles calculées sur l'historique propre (J+7)
- Refonte de R1/R3 sur l'écart au ratio habituel plutôt que sur la valeur absolue
- R7 : divergence au marché (distinguer « le marché monte » de « cette carte décroche »)
- Mesure de la fréquence réelle de mise à jour des moyennes de la source (hebdomadaire ? mensuelle ? jamais ?)

**Moyen terme**
- **Couche eBay** : ventes réellement conclues, avec leur état et leur date, et pseudonymes vendeurs (hachés). C'est la seule source légitime permettant l'analyse comportementale et la granularité par état. Architecture en entonnoir : Cardmarket détecte le *quoi* et le *quand*, eBay investigue le *qui probable*.
- Synthèse quotidienne générée par LLM : le SQL détecte, le modèle raconte. Le modèle ne calcule jamais, ne détecte jamais, ne décide jamais.
- Enrichissement contextuel automatisé : corréler une alerte avec les sorties d'extensions, les résultats de tournois, l'actualité, pour innocenter ou aggraver.

**Long terme**
- Extension au marché japonais (écosystème de spéculation distinct, souvent plus nerveux)
- Score composite inter-règles, pondéré et documenté

---

## Installation

```bash
# Backend
python -m venv .venv
.venv/Scripts/Activate.ps1        # Windows
pip install -r requirements.txt

# Variables d'environnement (.env)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_...   # clé SECRÈTE, jamais la publiable

# Schéma
# Exécuter les fichiers sql/ dans l'ordre numérique

# Frontend
cd web
pnpm install
pnpm dev
```

**Scripts**

| Script | Rôle |
|---|---|
| `ingest_priceguide.py` | Ingestion du Price Guide Cardmarket (scan large, ~14 500 cartes) |
| `ingest_tcgdex.py` | Ingestion de la watchlist approfondie (219 cartes) |
| `build_watchlist.py` | Construction de la watchlist, avec validation API et déduplication |
| `discover_cards.py` | Découverte hebdomadaire : nouveaux sets, sets agrandis, re-sondage |
| `add_cards.py` | Ajout manuel contrôlé de cartes |
| `detect_anomalies.py` | Exécution du moteur de détection |
| `eval_detection.py` | Harness d'évaluation (échoue en cas de régression) |
| `check_key.py` | Vérification des privilèges de la clé Supabase |

---

## Crédits

Dashboard basé sur [visactor-next-template](https://github.com/mengxi-ream/visactor-next-template) (MIT).

Développé par [Heykel Hachiche](https://heykelhachiche.com).