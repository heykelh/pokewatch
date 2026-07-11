import Container from "@/components/container";

const RULES = [
  {
    id: "R1",
    name: "Plancher au-dessus du trend",
    code: "low_above_trend",
    signature:
      "Le prix le plus bas du marché dépasse nettement le prix de référence : les listings bon marché ont disparu, signe possible d'un rachat du fond de marché (buyout).",
    severity: "Ratio plancher / trend",
    style: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  {
    id: "R2",
    name: "Divergence des ventes du jour",
    code: "avg1_divergence",
    signature:
      "Le prix moyen des ventes du jour décroche fortement de la moyenne 30 jours : pump ou dump potentiellement en cours.",
    severity: "Ratio avg1 / avg30",
    style: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    id: "R3",
    name: "Saut du plancher, trend stable",
    code: "low_jump",
    signature:
      "Le plancher bondit en 24h alors que le trend lissé n'a pas bougé : signature classique d'un achat massif des listings les moins chers, avant que le marché ne l'ait intégré.",
    severity: "Ratio de saut du plancher sur 24h",
    style: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  {
    id: "R4",
    name: "Variation statistiquement anormale",
    code: "trend_zscore",
    signature:
      "La variation quotidienne du trend est anormale par rapport à la volatilité historique propre de la carte. Une carte calme qui bouge de 10 % est plus suspecte qu'une carte volatile qui fait de même. Active après 14 jours d'historique.",
    severity: "Z-score (en écarts-types)",
    style: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  {
    id: "R5",
    name: "Vague coordonnée intra-set",
    code: "set_wave",
    signature:
      "Plusieurs cartes du même set flaggées le même jour : une carte isolée qui bouge peut être organique, une vague simultanée suggère une coordination.",
    severity: "Nombre de cartes flaggées dans le set",
    style: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
];

const PRINCIPLES = [
  {
    title: "Sources officielles uniquement",
    text: "Prix Cardmarket via des canaux publics et documentés (TCGdex). Aucun scraping, aucune donnée obtenue en violation de conditions d'utilisation.",
  },
  {
    title: "Minimisation des données personnelles",
    text: "Le système analyse des prix et des volumes, pas des personnes. Les futures données de vendeurs (couche eBay) seront pseudonymisées par hachage dès l'ingestion, avec rétention limitée.",
  },
  {
    title: "Vocabulaire de suspicion, jamais d'accusation",
    text: "Le système produit des scores et des patterns « compatibles avec » une coordination. La qualification d'une manipulation relève d'une investigation, pas d'un algorithme.",
  },
  {
    title: "Traçabilité de bout en bout",
    text: "Chaque anomalie embarque ses valeurs sources, le seuil franchi et sa lecture. Les seuils vivent en base de données : chaque calibration est datée et auditable. Les réponses brutes de l'API sont conservées pour permettre le re-calcul.",
  },
];

export default function MethodologiePage() {
  return (
    <div>
      <Container className="border-b border-border py-4">
        <h1 className="text-lg font-semibold">Méthodologie</h1>
        <p className="text-sm text-muted-foreground">
          Comment PokéWatch détecte les mouvements de marché anormaux, ce que
          signifient les scores, et ce que le système ne prétend pas faire.
        </p>
      </Container>

      <Container className="border-b border-border py-6">
        <h2 className="mb-3 text-base font-semibold">
          L&apos;architecture en entonnoir
        </h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Chaque matin, le pipeline photographie les prix Cardmarket de
            chaque carte surveillée : prix de référence (trend), prix plancher
            (low) et moyennes de ventes sur 1, 7 et 30 jours. Chaque photo est
            comparée à celle de la veille, puis cinq règles déterministes
            écrites en SQL passent sur ces variations. Toute carte qui franchit
            un seuil devient une anomalie, enregistrée avec l&apos;intégralité
            de son contexte chiffré.
          </p>
          <p>
            La détection est volontairement <strong>100 % déterministe</strong>{" "}
            : pas de boîte noire, chaque alerte est explicable par une règle
            lisible et des valeurs vérifiables. Les couches suivantes
            (contexte d&apos;actualité, analyse comportementale des vendeurs,
            synthèse) affineront la qualification — l&apos;entonnoir va du
            scan large et automatique vers l&apos;investigation ciblée et
            documentée.
          </p>
          <p className="rounded-md border border-border bg-muted/50 p-3">
            <strong>Le principe cardinal :</strong> une anomalie est un
            candidat à investigation, pas un verdict. Le moteur détecte des
            mouvements <em>anormaux</em> ; distinguer une manipulation
            d&apos;un mouvement légitime (sortie de set, carte jouée en
            tournoi, annonce de reprint) exige des preuves convergentes que la
            détection seule ne fournit pas.
          </p>
        </div>
      </Container>

      <Container className="border-b border-border py-6">
        <h2 className="mb-3 text-base font-semibold">Les cinq règles</h2>
        <div className="space-y-3">
          {RULES.map((rule) => (
            <div
              key={rule.id}
              className="rounded-md border border-border p-4"
            >
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md px-2 py-1 text-xs font-medium ${rule.style}`}
                >
                  {rule.id} · {rule.name}
                </span>
                <code className="text-xs text-muted-foreground">
                  {rule.code}
                </code>
              </div>
              <p className="text-sm text-muted-foreground">{rule.signature}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                <strong>Sévérité :</strong> {rule.severity}
              </p>
            </div>
          ))}
        </div>
      </Container>

      <Container className="border-b border-border py-6">
        <h2 className="mb-3 text-base font-semibold">Lire la sévérité</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            La sévérité mesure <strong>l&apos;intensité du franchissement de
            seuil, dans l&apos;unité propre de chaque règle</strong>. Une
            sévérité de 2,0 sur R3 signifie que le prix plancher a doublé en 24
            heures ; une sévérité de 4,7 sur R2 signifie que les ventes du jour
            se font à 4,7 fois la moyenne des 30 derniers jours.
          </p>
          <p>
            Conséquence importante : les sévérités{" "}
            <strong>ne se comparent pas entre règles</strong>. Un R1 à 18
            n&apos;est pas « pire » qu&apos;un R4 à 3. Elles servent à
            prioriser les anomalies au sein d&apos;une même règle. Un score
            composite inter-règles, pondéré et documenté, fait partie de la
            feuille de route.
          </p>
        </div>
      </Container>

      <Container className="border-b border-border py-6">
        <h2 className="mb-3 text-base font-semibold">
          Limites assumées et biais connus
        </h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>Les marchés minces produisent des artefacts.</strong> Sur
            une carte rare aux ventes quasi inexistantes, un unique listing à
            prix de collectionneur suffit à déclencher R1 sans qu&apos;aucun
            buyout n&apos;ait eu lieu. Exemple réel dans nos données : le
            Pikachu du Poké Card Creator Pack (ex5.5-5), tiré à une poignée
            d&apos;exemplaires, affiche un ratio plancher/trend supérieur à
            100 — c&apos;est un marché fantôme, pas une manipulation. Ce cas
            est conservé volontairement comme spécimen : le garde-fou «
            marché mince » de la prochaine calibration devra le neutraliser,
            et sa disparition des bilans en sera la preuve mesurable.
          </p>
          <p>
            <strong>Les mouvements légitimes existent.</strong> Sorties de
            sets, rotation du format standard, résultats de tournois, annonces
            de reprint : le marché bouge pour de vraies raisons. Le moteur ne
            les distingue pas encore — c&apos;est le rôle des couches
            d&apos;investigation à venir.
          </p>
          <p>
            <strong>Les cartes récentes sont turbulentes.</strong> Dans les
            semaines suivant une sortie, les prix « atterrissent » : les
            moyennes 30 jours embarquent cette turbulence et peuvent générer
            de fausses divergences. Une période de quarantaine avant
            flaggabilité est prévue en calibration.
          </p>
          <p>
            <strong>Les seuils initiaux sont des hypothèses.</strong> Ils ont
            été posés par raisonnement, pas par optimisation. Le processus :
            observation sans conclusion, identification des sources de bruit,
            calibration documentée, puis validation par scénarios de test
            (patterns de manipulation synthétiques que le moteur doit
            détecter, mouvements organiques sur lesquels il doit se taire).
          </p>
        </div>
      </Container>

      <Container className="py-6">
        <h2 className="mb-3 text-base font-semibold">Cadre de conformité</h2>
        <div className="grid grid-cols-1 gap-3 laptop:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="rounded-md border border-border p-4">
              <h3 className="mb-1 text-sm font-semibold">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}