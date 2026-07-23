# PokéWatch

**Surveillance de marché appliquée au TCG Pokémon.** Détection de mouvements de prix anormaux par règles déterministes, scores explicables, et refus assumé de conclure quand les preuves manquent.

🔗 **Dashboard public** : [pokewatch-three.vercel.app](https://pokewatch-three.vercel.app)

---

## Le projet en une phrase

Le marché des cartes Pokémon présente toutes les caractéristiques d'un marché financier immature : des actifs échangés à plusieurs milliers d'euros, une asymétrie d'information massive, aucune obligation de transparence, et aucun régulateur. Les mécanismes de manipulation y sont identiques à ceux de la finance (corner sur l'offre, gonflement artificiel des cours, exploitation d'informations privilégiées). PokéWatch transpose à ce marché les principes des dispositifs de surveillance des marchés réglementés.

**Ce n'est pas un tracker de prix.** Il en existe des dizaines. La question posée ici n'est pas *« combien vaut ma carte ? »* mais *« ce mouvement de prix est-il honnête ? »*.

---

## Ce que le projet est, et ce qu'il n'est pas


|
 Le projet 
**
fait
**
|
 Le projet 
**
ne fait pas
**
|
|
---
|
---
|
|
 Détecter des mouvements de prix statistiquement anormaux 
|
 Identifier des personnes (aucune IP, aucun compte, aucune identité) 
|
|
 Produire des alertes documentées avec preuves chiffrées 
|
 Accuser qui que ce soit de manipulation 
|
|
 Distinguer les mouvements suspects des mouvements légitimes 
|
 Prédire les prix futurs 
|
|
 Publier ses métriques de performance, ses erreurs et ses limites 
|
 Prétendre à une exhaustivité ou une certitude qu'il n'a pas 
|
|
 S'appuyer exclusivement sur des sources officielles 
|
 Scraper des sites en violation de leurs conditions d'utilisation 
|

**Principe cardinal : une alerte est un candidat à investigation, pas un verdict.**

---

## Architecture

Cardmarket Price Guide (URL publique, ~22 000 cartes/jour)
│
├──► Téléchargement + ingestion automatiques (GitHub Actions, 13h)
│ │
│ ▼
│ Supabase (Postgres)
│ │
│ ├──► Contrôle de plausibilité (v_market_clean)
│ ├──► Vue matérialisée (moyennes mobiles, liquidité)
│ └──► Moteur de détection (SQL pur, 6 règles)
│ │
TCGdex API ──► Référentiel ▼
(noms, sets, prix Table market_anomalies
TCGplayer) │
┌────────────┼────────────┐
▼ ▼ ▼
Dashboard Bilan LLM Harness d'évaluation
Next.js (Groq) (9 scénarios, CI)
│
eBay Browse API ──► Investigation ciblée (pseudos hachés, RGPD by design)


**Stack**
- **Données** : Python (httpx, supabase-py), Cardmarket Price Guide, TCGdex API, eBay Browse API
- **Base** : Supabase (Postgres), moteur de détection en SQL pur (PL/pgSQL, vues fenêtrées, vue matérialisée)
- **Orchestration** : GitHub Actions — pipeline quotidien complet, sans intervention humaine
- **Frontend** : Next.js 15, TypeScript, Tailwind, déployé sur Vercel
- **LLM** : Groq (Llama 3.3 70B) pour la rédaction des bilans quotidiens, sous garde-fou anti-hallucination
- **Qualité** : harness d'évaluation rejoué en intégration continue à chaque modification du moteur

**Choix d'architecture structurant : la détection est 100 % déterministe.** Aucun modèle opaque dans la chaîne de décision. Chaque alerte est reproductible à partir de ses données sources, et chaque seuil vit en base de données, versionné et daté. Le LLM ne calcule jamais, ne détecte jamais, ne décide jamais : il rédige, et chaque chiffre qu'il cite est vérifié contre la base avant publication.

---

## Les règles de détection

| Règle | Ce qu'elle cherche | Statut |
|---|---|---|
| **R2b** `trend_ma_divergence` | Le prix décroche de sa propre moyenne mobile 7 jours, confirmé sur 30 jours | ✅ Active |
| **R3b** `low_jump` | Le plancher bondit en 24h sans mouvement du prix de référence | ⚠️ Signal faible |
| **R4** `trend_zscore` | Variation anormale au regard de la volatilité propre de la carte | ⏳ Attend 14 jours d'historique |
| **R7** `market_divergence` | La carte s'écarte du mouvement médian du marché (alpha vs bêta) | ✅ Active |
| **R5b** `set_wave` | Plusieurs cartes de la même extension signalées le même jour | ✅ Contexte |
| **R6b** `pokemon_wave` | Plusieurs cartes du même Pokémon, tous sets confondus | ✅ Contexte |

**Filtres transverses**, tous issus de découvertes documentées ci-dessous :
- **Plausibilité** : un prix de référence incohérent avec le prix des ventes réelles est écarté du calcul
- **Liquidité** : une carte doit avoir coté au moins 3 fois sur 7 jours pour être analysée au quotidien
- **Fraîcheur** : le prix doit avoir bougé la veille, sinon la variation condense plusieurs jours
- **Rationalité économique** : prix minimum de 5 €, en dessous duquel une manipulation ne serait pas rentable

Deux règles ont été retirées en cours de route : **R1** (plancher au-dessus du prix de référence) et **R2** (divergence des moyennes de la source). Le journal ci-dessous explique pourquoi.

---

## Performance mesurée

Le moteur est évalué sur neuf scénarios synthétiques dérivés de patterns réellement observés. L'évaluation est rejouée automatiquement à chaque modification du SQL ou du moteur ; une régression fait échouer l'intégration continue.

| Métrique | Résultat |
|---|---|
| Précision | **100 %** |
| Rappel | **100 %** |
| Scénarios couverts | 9 |
| Faux positifs | **0** |

Les scénarios couvrent : une divergence réelle (doit tirer), un décrochage de moyenne mobile (doit tirer), un bond du plancher (doit tirer), un rattrapage après gel (doit se taire), une carte illiquide (doit se taire), un suiveur de marché (doit se taire), et un témoin stable.

**Ces chiffres mesurent la _correction_ du moteur** (fait-il ce que son code prétend faire ?), **pas la _validité_ des hypothèses sous-jacentes.** Le journal ci-dessous démontre pourquoi cette distinction est vitale : un moteur peut être parfaitement correct et parfaitement faux, s'il repose sur une mauvaise compréhension de ses données.

---

## Journal de bord et découvertes

Cette section est le cœur du projet. **Un système de surveillance qui dissimulerait ses propres défauts n'aurait aucune légitimité à en signaler chez les autres.**

### Le mapping N-vers-1

Premier bilan : 44 anomalies sur 151 cartes. Anormalement élevé. Quatre cartes affichaient une sévérité *rigoureusement identique* — statistiquement impossible sur des marchés indépendants.

Vérification : **11 groupes de doublons.** Plusieurs identifiants du référentiel TCGdex pointaient vers un **même produit Cardmarket**. Mêmes prix, donc mêmes anomalies, dupliquées. Pire : la règle de vague intra-set interprétait ces clones comme une *coordination*.

**Correctif** : contrainte d'unicité sur le produit de marché, déduplication rétroactive.

**Leçon** : un défaut d'unicité dans les données de référence produit des alertes fantômes *et* de fausses coordinations.

---

### Les alertes fantômes du marché mince

Deux cartes déclenchaient chaque jour les alertes de plus haute sévérité :

- **Pikachu (2004)** : prix de référence 400 €, prix plancher **40 000 €**
- **Mew** : prix de référence 5 550 €, prix plancher **100 000 €**

Ce ne sont pas des rachats de marché, mais des vendeurs affichant un prix qu'ils ne comptent pas obtenir. La règle R1, conçue pour détecter un plancher relevé par un buyout, se déclenchait sur des **offres hors-marché**.

**Correctif** : fourchette de plausibilité. Au-delà d'un certain ratio, il ne s'agit plus d'une manipulation économiquement rationnelle.

**Leçon** : une signature de manipulation a une *plage* de valeurs plausibles, bornée par la rationalité économique.

---

### Un harness qui ne testait rien

Premier résultat de l'évaluation : **« 100 % de précision, tous les scénarios passent »**. Sauf qu'il n'y avait aucun scénario en base. Le script avait trouvé zéro attente, divisé zéro par zéro, et affiché un score parfait.

**Correctif** : le harness vérifie qu'il a de quoi tester avant de conclure, et échoue explicitement sinon.

**Leçon** : **un test qui ne peut pas échouer est un test qui ne sert à rien.**

Dans la foulée, deux autres défauts : les vues du moteur filtraient sur la source des données, rendant les scénarios **invisibles** ; et un appel de fonction échouait **silencieusement** côté client. Le harness a passé plus de temps à révéler ses propres bugs que ceux du moteur.

---

### Post-mortem : un incident de production

**Symptôme** : le moteur, correct en SQL direct, ne produisait plus aucune alerte via le pipeline applicatif.

**Cause racine** : l'ouverture du dashboard au public avait nécessité l'activation de Row Level Security. Les politiques créées n'autorisaient que la **lecture**. Or la clé utilisée par les scripts backend était une clé *publiable*, non *secrète* : elle ne contournait donc pas RLS. **La chaîne d'écriture du backend était rompue.** Une décision de sécurité côté frontend avait silencieusement cassé le pipeline de données.

**Correctifs** : clé secrète côté serveur, `security definer` sur les fonctions de traitement, script de vérification de la clé exécutable à tout moment.

**Détecté par le harness avant tout impact sur les données de production.**

---

### Les moyennes de la source sont figées

La règle R2, la plus prolifique du moteur (19 à 28 alertes/jour), comparait le prix moyen des ventes du jour à la moyenne sur 30 jours, tous deux fournis par la source. Anomalie repérée dans les bilans : **les mêmes cartes, avec les mêmes sévérités à la décimale près, jour après jour.**

Vérification sur deux relevés consécutifs du catalogue complet :

70 975 singles communs aux deux fichiers

avg : 2919 cartes ont changé (4,1 %)
low : 2066 cartes ont changé (2,9 %)
trend : 11780 cartes ont changé (16,6 %)
avg1 : 0 cartes ont changé (0,0 %)
avg7 : 0 cartes ont changé (0,0 %)
avg30 : 0 cartes ont changé (0,0 %)


**Zéro. Sur soixante-dix mille cartes. En vingt-quatre heures.** R2 ne détectait aucun mouvement : elle resignalait chaque jour un rapport statique.

**Correctif** : R2 suspendue puis refondée sur des moyennes mobiles calculées sur **notre propre historique**.

**Leçon fondamentale** : le harness affichait F1 = 1,00, et il avait raison — le moteur faisait exactement ce que son code disait. Mais le code reposait sur une **hypothèse erronée quant à la signification des données**. Un test d'intégration valide la correction, pas la validité sémantique.

---

### Le prix plancher mélange les états de conservation

Une carte cotée **253 €** affichait un plancher à **11,89 €**.

Les prix publics agrègent **tous les états**, du très abîmé au neuf. Le « prix plancher » n'est donc pas le prix d'entrée du marché : c'est **le prix de la pire carte disponible**. Un « saut du plancher » peut simplement signifier que l'exemplaire le plus abîmé a été vendu.

**Mesure** : 28 % de la watchlist avait un plancher inférieur à 20 % de son prix de référence.

**Correctif** : R1 retirée, R3 conservée en signal faible explicitement documenté.

---

### Le prix de référence contient des valeurs corrompues

Une carte (Murkrow) voit son prix de référence passer de **7,17 € à 273,81 € en une nuit**, puis y rester. Or, dans le même fichier, au même instant :

| | J | J+1 | J+2 |
|---|---|---|---|
| Prix de référence | 7,17 € | **273,81 €** | **273,81 €** |
| Prix plancher | 1,50 € | 1,50 € | 1,50 € |
| Prix moyen des ventes | 7,00 € | 7,00 € | 7,00 € |

Une carte qu'on peut acheter à 1,50 € et dont les ventes se font à 7 € ne vaut pas 274 €. **Le prix de référence est incohérent avec les autres champs de la même source, au même instant.**

**Mesure sur le catalogue complet** : environ **500 cartes par jour, soit 2,3 %**, portent un prix de référence non fiable. Taux stable sur plusieurs jours : défaut structurel, pas incidents isolés. **Sans contrôle, cela représente 500 fausses alertes potentielles quotidiennes.**

**Correctif** : contrôle de plausibilité **en entrée**, et non règle de détection. Un prix de référence n'est exploitable que s'il reste cohérent avec le prix moyen des ventes (rapport entre 0,3 et 3). Le taux de fiabilité est mesuré, historisé et publié (~95 %).

**Leçon** : **aucun champ ne doit être présumé fiable ; chacun doit être validé contre les autres.**

---

### Les deux référentiels de prix ne s'apparient pas

L'ajout d'une seconde source (TCGplayer, marché américain) devait permettre un contrôle croisé. Les niveaux constatés sur les mêmes identifiants de cartes :

| Carte | Cardmarket | TCGplayer |
|---|---|---|
| Charizard, Base Set | 172 € | 728 $ |
| Umbreon, Aquapolis | 1 076 € | 161 $ |
| Une carte de Legendary Collection | **0,02 €** | **71,66 $** |

Ces écarts ne s'expliquent ni par le taux de change ni par des différences de marché : **les deux référentiels ne pointent pas les mêmes exemplaires** (édition, variante holographique). Un identifiant de carte ne suffit pas à apparier deux catalogues.

**Conséquences** : seules les **variations relatives** sont comparables, jamais les niveaux. Et la variante suivie doit être **figée dans le temps** — sélectionner dynamiquement la version la plus chère ferait suivre un holographique un jour et une version normale le lendemain.

**Couverture croisée mesurée** : 79 % de la watchlist dispose d'un prix sur les deux marchés.

---

### La seconde source servait des données périmées

Quatre cartes suivies affichaient un prix **identique au centime près** deux jours consécutifs. Quatre marchés indépendants immobiles simultanément : improbable.

Comparaison avec le Price Guide, source directe, aux mêmes dates :

| Carte | J | J+1 (TCGdex) | J+1 (Price Guide) |
|---|---|---|---|
| Lance's Charizard V | 16,71 € | 16,71 € | **15,82 €** |
| Mega Lucario ex | 11,27 € | 11,27 € | **10,97 €** |
| Mimikyu | 19,09 € | 19,09 € | **18,23 €** |
| Zekrom | 16,36 € | 16,36 € | **15,71 €** |

**L'API intermédiaire recopiait les prix de la veille.** Le moteur tournait donc sur des variations nulles fabriquées — pire que pas de données du tout.

**Correctif majeur** : refonte complète du moteur sur le Price Guide (source directe, 22 000 cartes, données fraîches). L'API TCGdex est reléguée à son rôle légitime : référentiel de cartes et prix TCGplayer pour le contrôle croisé. Le champ d'horodatage de la source est désormais stocké, permettant de détecter toute future péremption.

---

### Le Price Guide n'est pas une série quotidienne

Constat en analysant les plus fortes variations : des cartes affichant +79 % avaient un prix **gelé au centime près pendant trois jours** avant de bondir.

**Mesure de l'ampleur, sur cinq jours consécutifs** :

75,5 % · 77,8 % · 81,9 % · 81,5 % · 77,3 %


**Trois quarts des prix sont identiques d'un jour à l'autre.** Distribution des mouvements sur sept jours glissants :

| Mouvements en 7 jours | Cartes | Part |
|---|---|---|
| 0 (gelée toute la semaine) | 9 193 | **43,5 %** |
| 1 | 4 017 | 19,0 % |
| 2 | 2 291 | 10,8 % |
| 3 et plus | 5 642 | **26,7 %** |

Le prix de référence n'est mis à jour qu'à l'occasion d'une vente. **Une « variation quotidienne » sur une carte illiquide condense en réalité plusieurs jours de mouvement**, et n'est pas comparable au mouvement quotidien du marché.

**Correctifs** : filtre de liquidité (au moins 3 mouvements sur 7 jours) et filtre de fraîcheur (le prix devait avoir bougé la veille). Effet mesuré sur la règle de divergence au marché : **139 → 93 → 46 alertes**, et disparition des cartes en tête de classement qui n'étaient que des rattrapages.

---

### La référence de marché valait structurellement zéro

En construisant le marché de contrôle, constat : **la médiane du marché valait exactement 0,000 % chaque jour**, sur toute la période.

Cause : la médiane était calculée sur l'ensemble du catalogue. Puisque la majorité des cartes ne cotent pas quotidiennement, plus de la moitié des variations valent exactement zéro — et la médiane d'une population majoritairement nulle vaut zéro. Mécaniquement.

**Conséquence** : la règle de divergence au marché, censée distinguer un mouvement propre à une carte d'un mouvement d'ensemble, ne comparait à rien. Elle n'était qu'un seuil de variation brute déguisé.

**Correctif** : la référence est désormais calculée sur les seules cartes ayant effectivement coté ce jour-là. « Parmi les cartes qui ont bougé aujourd'hui, quel a été le mouvement médian ? » — la bonne question pour juger un écart.

---

### Le prix de référence contredit le prix des transactions

Une fois la référence de marché correctement calculée, un motif inattendu apparaît : le mouvement médian est **négatif tous les jours, entre −0,98 % et −1,34 %**, sans une seule journée de hausse sur neuf jours. Un marché réel alterne.

Trois vérifications, chacune sur la population la plus propre disponible :

**Les baisses sont structurellement majoritaires.** Entre 59 % et 64 % des cartes ayant changé de prix ont baissé, chaque jour, sans exception.

**Le prix des transactions réelles, lui, monte.** Parmi les cartes dont le prix moyen de vente a effectivement changé, la variation médiane est de **+1,76 %**, avec une majorité de hausses (55 %).

**Le test décisif : les deux indicateurs, sur la même carte, le même jour.** En isolant les 3 491 observations où le prix de référence *et* le prix des transactions ont tous deux bougé :

| Indicateur | Variation médiane |
|---|---|
| Prix de référence (`trend`) | **−1,19 %** |
| Prix moyen des transactions (`avg`) | **+1,55 %** |

**Les deux vont dans des directions opposées, avec un écart de 2,75 points.** Les échanges se concluent à des prix en hausse pendant que l'indicateur de référence s'érode.

**Une hypothèse testée et réfutée.** Nous avons envisagé une érosion passive : l'indicateur baisserait automatiquement en l'absence de vente, et ne remonterait qu'à l'occasion d'une transaction. Deux tests l'écartent. D'une part, le prix moyen des ventes bouge dans la même proportion que le prix de référence monte (10,2 %) ou baisse (9,8 %) : les hausses ne sont pas plus « actives » que les baisses. D'autre part, les amplitudes sont quasi identiques dans les deux sens (médianes de 3,44 % contre 3,37 %), sans la concentration autour d'une valeur régulière qu'un mécanisme automatique produirait. L'asymétrie porte sur la **fréquence** des mouvements, pas sur leur nature ni leur taille.

**Nous constatons cette contradiction sans l'expliquer.** Le mécanisme de calcul de l'indicateur n'est pas documenté publiquement ; il est possible que les deux mesures ne portent pas sur le même périmètre de transactions ou sur les mêmes fenêtres temporelles. En l'état, nous documentons le fait et ses conséquences.

**Conséquence pour toute lecture de prix : zéro n'est pas le point neutre.** Une carte dont le prix de référence reste stable surperforme son marché d'environ 1,2 % par jour. Tous les écarts publiés sur ce site sont calculés par rapport au mouvement médian réel, dérive comprise.

---

## Le constat structurant : l'historique est le produit

Aucune source publique ne distribue d'historique de prix quotidien pour le TCG Pokémon. Les acteurs qui affichent des courbes ont construit le leur de la même façon : en photographiant le marché tous les jours, pendant des années. C'est leur fonds de commerce.

**Il n'y a pas de raccourci.** Les moyennes que l'on croyait obtenir gratuitement de la source n'existent pas. Il faut les construire.

- La collecte quotidienne n'est pas un *moyen* d'arriver au produit. **Elle est le produit.**
- Un concurrent repartant de zéro devrait attendre un mois pour disposer de la même matière.
- Le code se réécrit en deux semaines. **La barrière à l'entrée est temporelle, pas technique.**

C'est ce qui a motivé l'automatisation intégrale du pipeline : chaque jour manqué est définitivement perdu.

---

## Automatisation intégrale

Le Price Guide est distribué à une **URL publique stable**. Le pipeline complet tourne donc quotidiennement en intégration continue, sans aucune intervention : téléchargement, ingestion, contrôle qualité, rafraîchissement des vues, détection, génération du bilan.

Un détail de conception a évité une corruption silencieuse : **le fichier est daté par son champ interne, jamais par la date d'exécution.** Un fichier publié en retard est ainsi rattaché au bon jour. Sans cette précaution, un décalage de publication aurait enregistré les prix de la veille sous la date du jour, faussant durablement la série temporelle.

Un détecteur de jours manquants surveille l'assiduité de la collecte et l'affiche publiquement.

---

## Investigations publiées

### L'affaire Ectoplasma — mouvement organique

Six cartes du même Pokémon, issues de six extensions couvrant quinze ans, signalées le même jour. Six marchés indépendants qui bougent simultanément : ce n'est pas un hasard statistique.

**Hypothèse 1 — manipulation coordonnée.** Techniquement possible, économiquement absurde : racheter le stock de six cartes sur six marchés indépendants coûterait une fortune pour un rendement dilué.

**Hypothèse 2 — engouement pour le personnage.** Une extension venait de sortir avec ce Pokémon parmi ses cartes vedettes.

**Verdict : mouvement organique probable. Aucune manipulation retenue.**

**Ce que ce cas a changé** : le moteur savait détecter les vagues au sein d'un même *set*, mais était aveugle aux vagues au sein d'un même *personnage*. D'où la règle de vague intra-Pokémon, née d'un cas réel. Sa particularité : elle peut révéler une coordination, mais aussi **innocenter** un mouvement.

### Une recommandation publique fait-elle monter les prix ?

Le 13 juillet, une vidéo présente cinq cartes comme sous-cotées. Protocole établi **le jour même, avant tout résultat** : quatre cartes mesurables suivies, baseline relevée, marché de contrôle défini.

**Résultat à neuf jours : aucun effet haussier détectable.** Aucune des quatre cartes n'a surperformé son marché de référence. Trois ont suivi le marché à moins de deux points près — leur baisse apparente s'explique intégralement par la dérive de l'indicateur. Une seule décroche nettement (−18,5 points).

**Ce que l'analyse ne dit pas** : que la vidéo aurait fait baisser les prix. **Ce qu'elle établit** : l'idée qu'une recommandation publique ferait mécaniquement grimper les prix ne se vérifie pas ici.

C'est en construisant le marché de contrôle de cette investigation qu'a été découverte la dérive de l'indicateur de référence.

---

## Couche eBay — investigation comportementale

eBay apporte ce qu'aucune autre source ne donne : les **états déclarés** des cartes et les **pseudonymes vendeurs**, seule voie légitime vers l'analyse de concentration de l'offre.

**RGPD by design**, gravé avant la première ligne de code :
- Les pseudonymes sont **hachés irréversiblement dès la réception** (SHA-256 + sel secret), jamais stockés en clair, jamais affichés
- Le clustering fonctionne parfaitement sur les empreintes : deux ventes du même vendeur produisent le même haché, sans jamais révéler son identité
- La réponse brute de l'API n'est **pas conservée**, car elle contient le pseudonyme
- Rétention limitée à 90 jours, purge automatique
- Aucune donnée eBay n'est exposée publiquement

Cette conception a permis d'obtenir une **exemption officielle** au processus de notification de suppression de compte : ne stockant aucune donnée personnelle identifiable, il n'y a rien à effacer lorsqu'un compte disparaît.

**Le nettoyage des données est le cœur du travail.** Une recherche brute renvoie une soupe : proxies, lots, accessoires, cartes d'autres extensions portant le même nom, versions japonaises et coréennes, exemplaires gradés mélangés aux bruts — avec des prix allant de 2,40 € à 7 800 € pour ce qui est censé être la même carte. Le pipeline filtre sur le numéro de collection, écarte les termes trahissant un proxy ou un lot, et sépare explicitement les populations gradées et brutes, qui constituent des marchés distincts.

---

## Le cas particulier des cartes récentes

Une carte sortie depuis moins d'un mois est **inanalysable** pour la détection de manipulation, et le système le reconnaît explicitement.

Sur une nouveauté, les prix font littéralement n'importe quoi : le marché n'a pas encore trouvé son équilibre. **Une flambée sur une carte fraîchement sortie n'est pas un signal de manipulation, c'est le fonctionnement normal de la découverte de prix d'un actif neuf.** C'est précisément le scénario où une accusation a le plus de chances d'être fausse.

Cela ne veut pas dire qu'une manipulation y soit impossible — une carte à fort engouement est même une cible plausible. Mais l'affirmer demanderait des preuves que les premières semaines de données ne peuvent pas fournir. En leur absence, le système s'abstient.

---

## Limites assumées

1. **Le marché des cartes n'est pas régulé.** Ni régulateur, ni obligation de transparence, ni sanction. PokéWatch n'a aucun pouvoir de contrainte et ne prétend à aucune autorité.

2. **Les données publiques ne permettent pas d'identifier les acteurs.** Le système détecte des schémas, pas des personnes.

3. **Les prix ne distinguent pas l'état des cartes.** Limite structurelle de la source, avec ses conséquences documentées sur plusieurs règles.

4. **Le prix de référence est mis à jour à la vente, pas quotidiennement.** Trois quarts des cartes ont un prix identique d'un jour à l'autre ; 43,5 % ne cotent pas une seule fois par semaine. Seul un quart du catalogue est analysable au jour le jour.

5. **Le prix de référence dérive à la baisse d'environ 1,2 % par jour, en contradiction avec le prix des transactions réelles** qui, lui, progresse d'environ 1,6 %. Le biais est mesuré et compensé dans tous les calculs d'écart, mais son origine reste inexpliquée.

6. **Les mouvements légitimes existent.** Sorties d'extensions, rotation du format, résultats de tournois, exposition médiatique. Le moteur repère l'anormal, il ne lit pas dans les intentions.

7. **Les seuils sont des hypothèses en cours de validation.** Le taux de faux positifs est mesuré, publié et travaillé, pas dissimulé derrière un vernis de certitude.

---

## Gouvernance et conformité

- **Sources officielles uniquement.** Price Guide Cardmarket, API publique TCGdex, API officielle eBay. Aucun scraping, aucune donnée obtenue en violation de conditions d'utilisation.
- **Minimisation des données personnelles.** Le système analyse des prix, pas des personnes. Les identifiants de vendeurs sont pseudonymisés dès la collecte, avec finalité déclarée et durée de conservation limitée.
- **Traçabilité de bout en bout.** Les réponses brutes sont conservées avec chaque instantané (sauf lorsqu'elles contiennent une donnée personnelle), permettant de recalculer toute alerte a posteriori. Les seuils vivent en base, datés : on peut toujours répondre à « avec quels réglages cette alerte a-t-elle été produite ? ».
- **Idempotence.** Les traitements sont rejouables sans créer de doublons ni corrompre l'historique.
- **Statut des règles publié.** Chaque règle affiche son état — active, signal faible, en attente d'historique, suspendue — avec sa justification.
- **Vocabulaire de suspicion, jamais d'accusation.** Aucune personne, aucune chaîne, aucun compte n'est nommé.

---

## Feuille de route

**Court terme**
- Activation de la détection statistique par carte (14 jours d'historique requis)
- Test de l'hypothèse d'érosion passive du prix de référence
- Calibration des seuils de verdict sur une distribution réelle plutôt qu'estimée
- Correction du calcul de fraîcheur en jours calendaires (un trou de collecte fausse la variation du lendemain)

**Moyen terme**
- Analyse de concentration de vendeurs sur eBay : un vendeur qui domine l'offre d'une carte signalée
- Règle de persistance : un mouvement ne compte que s'il tient plusieurs jours
- Enrichissement contextuel : corréler une alerte avec les sorties d'extensions, résultats de tournois, actualité
- Politique de rétention et agrégats long terme

**Long terme**
- Extension au marché japonais (écosystème de spéculation distinct)
- Score composite inter-règles, pondéré et documenté

---

## Installation

```bash
python -m venv .venv
.venv/Scripts/Activate.ps1        # Windows
pip install -r requirements.txt
```

Variables d'environnement (`.env`) :

SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_... # clé SECRÈTE, jamais la publiable
GROQ_API_KEY=gsk_...
EBAY_CLIENT_ID=...
EBAY_CLIENT_SECRET=...
SELLER_HASH_SALT=... # 64 caractères hexadécimaux, ne jamais changer


Schéma : exécuter les fichiers `sql/` dans l'ordre numérique.

Frontend :

```bash
cd web && pnpm install && pnpm dev
```

**Scripts**

| Script | Rôle |
|---|---|
| `download_priceguide.py` | Téléchargement automatique, datation par le champ interne, ingestion enchaînée |
| `ingest_priceguide.py` | Ingestion du Price Guide (~22 000 cartes) |
| `ingest_tcgdex.py` | Référentiel et prix TCGplayer |
| `detect_market.py` | Exécution du moteur de détection |
| `backfill_detection.py` | Rejeu de la détection sur tout l'historique |
| `eval_market.py` | Harness d'évaluation (échoue en cas de régression) |
| `generate_report.py` | Bilan quotidien, avec vérification anti-hallucination |
| `ebay_investigate.py` | Investigation eBay ciblée, avec nettoyage et hachage RGPD |
| `check_key.py` | Vérification des privilèges de la clé Supabase |

---

## Crédits

Dashboard basé sur [visactor-next-template](https://github.com/mengxi-ream/visactor-next-template) (MIT).

Développé par [Heykel Hachiche](https://heykelhachiche.com).
