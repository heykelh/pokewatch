import Container from "@/components/container";

const RULES = [
  {
    id: "R1",
    name: "Plancher au-dessus du prix de référence",
    code: "low_above_trend",
    signature:
      "Imaginez un marché où une carte se vend habituellement autour de 50 €. D'ordinaire, on trouve toujours quelques vendeurs pressés qui la proposent moins cher, à 40 ou 45 €. Un jour, toutes ces offres bon marché disparaissent d'un coup : la moins chère du marché est soudain à 65 €, au-dessus même du prix habituel. C'est étrange, car ces offres ne disparaissent pas toutes seules. Quelqu'un les a peut-être toutes achetées d'un coup pour assécher le marché (un « buyout »), avant de revendre plus cher.",
    severity:
      "Combien de fois le prix de l'offre la moins chère dépasse le prix habituel. Exemple : sévérité 1,5 = l'offre la moins chère coûte 1,5 fois le prix habituel.",
    style: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  {
    id: "R2",
    name: "Ventes du jour très au-dessus de l'habitude",
    code: "avg1_divergence",
    signature:
      "On compare le prix moyen auquel la carte s'est vendue aujourd'hui avec son prix moyen sur les 30 derniers jours. Si la carte se vendait 20 € en moyenne depuis un mois et que les ventes d'aujourd'hui se font à 60 €, quelque chose se passe : soit un vrai engouement (une carte devenue populaire), soit une hausse fabriquée artificiellement pour créer une impression de rareté.",
    severity:
      "Le rapport entre le prix des ventes d'aujourd'hui et la moyenne du mois. Exemple : sévérité 3 = les ventes du jour se font à 3 fois le prix habituel.",
    style: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    id: "R3",
    name: "L'offre la moins chère bondit du jour au lendemain",
    code: "low_jump",
    signature:
      "Hier, l'offre la moins chère pour cette carte était à 30 €. Aujourd'hui, elle est à 55 €, alors que le prix de référence global n'a presque pas bougé. Un vrai marché monte progressivement, offre après offre. Un bond aussi brutal du « premier prix », sans que le reste ne suive encore, ressemble fort à quelqu'un qui vient de racheter toutes les offres les moins chères en une seule fois. C'est la signature la plus typique d'un buyout, captée le jour même où il se produit.",
    severity:
      "Combien de fois le premier prix a été multiplié en 24 heures. Exemple : sévérité 2 = le premier prix a doublé en un jour.",
    style: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  {
    id: "R4",
    name: "Un mouvement inhabituel pour cette carte précise",
    code: "trend_zscore",
    signature:
      "Chaque carte a son tempérament : certaines voient leur prix bouger tous les jours, d'autres sont stables depuis des mois. Cette règle apprend le comportement normal de chaque carte, puis repère les journées qui sortent de ce comportement. Une variation de 10 % ne veut rien dire sur une carte nerveuse, mais elle est très suspecte sur une carte d'ordinaire immobile. C'est la même logique qu'une banque qui repère une dépense inhabituelle sur votre carte bancaire. Cette règle a besoin d'observer une carte pendant au moins 14 jours avant de pouvoir juger.",
    severity:
      "À quel point la journée sort de l'ordinaire pour cette carte, mesuré en « écarts-types » (l'unité statistique de l'inhabituel). Au-delà de 3, la journée est vraiment exceptionnelle.",
    style: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  {
    id: "R5",
    name: "Plusieurs cartes de la même série bougent ensemble",
    code: "set_wave",
    signature:
      "Les cartes Pokémon sortent par séries (des « sets »). Qu'une carte isolée s'emballe, cela arrive naturellement : un joueur célèbre l'utilise, une vidéo devient virale. Mais que trois, cinq ou sept cartes de la même série déclenchent des alertes le même jour, c'est une autre histoire : les hasards ne se synchronisent pas. Une vague simultanée suggère une action coordonnée sur toute la série.",
    severity:
      "Le nombre de cartes de la même série en alerte le même jour.",
    style: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
];

const PRINCIPLES = [
  {
    title: "Sources officielles uniquement",
    text: "Les prix proviennent de canaux publics et documentés. Aucune extraction sauvage de sites web (« scraping »), aucune donnée obtenue en violation de conditions d'utilisation.",
  },
  {
    title: "Aucune donnée personnelle",
    text: "Le système analyse des prix et des volumes de vente, pas des personnes. Si des données de vendeurs sont un jour analysées, elles seront rendues anonymes dès leur collecte, avec une durée de conservation limitée.",
  },
  {
    title: "De la suspicion, jamais d'accusation",
    text: "Le système signale des situations « compatibles avec » une manipulation. Affirmer qu'une manipulation a eu lieu exigerait une enquête que des chiffres seuls ne remplacent pas.",
  },
  {
    title: "Tout est vérifiable",
    text: "Chaque alerte conserve les chiffres qui l'ont déclenchée, le seuil franchi et son explication. Les seuils eux-mêmes sont enregistrés et datés : on peut toujours reconstituer pourquoi le système a alerté, et avec quels réglages.",
  },
];

export default function MethodologiePage() {
  return (
    <div>
      <Container className="border-b border-border py-4">
        <h1 className="text-lg font-semibold">Méthodologie</h1>
        <p className="text-sm text-muted-foreground">
          Comment PokéWatch repère les mouvements de prix anormaux, ce que
          signifient les scores, et ce que le système ne prétend pas faire.
          Aucune connaissance en finance n&apos;est nécessaire.
        </p>
      </Container>

      <Container className="border-b border-border py-6">
        <h2 className="mb-3 text-base font-semibold">
          Le problème qu&apos;on cherche à détecter
        </h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Certaines cartes Pokémon valent des centaines d&apos;euros, et
            leur marché fonctionne comme n&apos;importe quel marché : des
            vendeurs affichent des offres, des acheteurs les acceptent, et les
            prix évoluent selon l&apos;offre et la demande. Ce marché
            n&apos;étant pas régulé, certains tentent de le truquer. La
            technique classique : acheter d&apos;un coup toutes les offres bon
            marché d&apos;une carte (un <strong>« buyout »</strong>), créer
            ainsi une rareté artificielle, laisser les prix monter, puis
            revendre au prix fort. PokéWatch cherche les traces chiffrées que
            ces opérations laissent dans les prix.
          </p>
        </div>
      </Container>

      <Container className="border-b border-border py-6">
        <h2 className="mb-3 text-base font-semibold">
          Les trois chiffres qu&apos;on surveille chaque jour
        </h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Chaque matin, le système photographie l&apos;état du marché de
            chaque carte suivie. Trois chiffres résument cette photo :
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Le prix de référence</strong> (« trend ») : le prix
              autour duquel la carte s&apos;échange réellement, calculé par la
              place de marché en lissant les ventes récentes. C&apos;est le «
              prix normal » du moment.
            </li>
            <li>
              <strong>Le premier prix</strong> (« low ») : l&apos;offre la
              moins chère disponible à l&apos;instant de la photo. C&apos;est
              la porte d&apos;entrée du marché — et la première chose
              qu&apos;un manipulateur fait disparaître.
            </li>
            <li>
              <strong>Les moyennes de ventes</strong> sur 1, 7 et 30 jours :
              à quel prix la carte s&apos;est effectivement vendue
              aujourd&apos;hui, cette semaine, ce mois-ci. Comparer ces trois
              horizons permet de voir si le présent s&apos;écarte du passé
              récent.
            </li>
          </ul>
          <p>
            Chaque photo est ensuite comparée à celle de la veille, et cinq
            règles automatiques examinent les écarts. Ces règles sont{" "}
            <strong>délibérément simples et transparentes</strong> : pas
            d&apos;intelligence artificielle opaque à ce stade, chaque alerte
            s&apos;explique par une règle lisible et des chiffres
            vérifiables.
          </p>
        </div>
      </Container>

      <Container className="border-b border-border py-6">
        <h2 className="mb-3 text-base font-semibold">Les cinq règles</h2>
        <div className="space-y-3">
          {RULES.map((rule) => (
            <div key={rule.id} className="rounded-md border border-border p-4">
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
              <p className="mt-2 text-xs text-muted-foreground">
                <strong>Comment lire son score :</strong> {rule.severity}
              </p>
            </div>
          ))}
        </div>
      </Container>

      <Container className="border-b border-border py-6">
        <h2 className="mb-3 text-base font-semibold">
          Lire la sévérité (le score d&apos;une alerte)
        </h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Chaque alerte porte un score, sa <strong>sévérité</strong> : il
            mesure l&apos;ampleur de l&apos;écart détecté, dans l&apos;unité
            propre à chaque règle. Un score de 2 sur R3 veut dire « le premier
            prix a doublé en un jour » ; un score de 4,7 sur R2 veut dire «
            les ventes du jour se font à 4,7 fois le prix habituel ».
          </p>
          <p>
            Attention au piège :{" "}
            <strong>
              les scores ne se comparent pas d&apos;une règle à l&apos;autre
            </strong>
            . Un 18 sur R1 n&apos;est pas « pire » qu&apos;un 3 sur R4 — ce
            sont des unités différentes, comme des degrés et des kilomètres.
            Le score sert à classer les alertes au sein d&apos;une même règle.
            Un score global unique, combinant toutes les règles de façon
            documentée, fait partie de la feuille de route.
          </p>
        </div>
      </Container>

      <Container className="border-b border-border py-6">
        <h2 className="mb-3 text-base font-semibold">
          Une alerte n&apos;est pas un verdict
        </h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="rounded-md border border-border bg-muted/50 p-3">
            <strong>Le principe cardinal du système :</strong> une alerte est
            un candidat à investigation, pas une preuve de manipulation. Les
            prix bougent aussi pour d&apos;excellentes raisons — une carte
            devient populaire en tournoi, une nouvelle série sort, un
            youtubeur en parle. Le moteur repère l&apos;<em>anormal</em> ;
            distinguer le truqué du légitime demande des preuves
            convergentes qu&apos;un calcul seul ne fournit pas.
          </p>
        </div>
      </Container>

      <Container className="border-b border-border py-6">
        <h2 className="mb-3 text-base font-semibold">
          Limites assumées et biais connus
        </h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>
              Les cartes très rares déclenchent de fausses alertes.
            </strong>{" "}
            Quand une carte ne s&apos;échange presque jamais, un seul vendeur
            affichant un prix de collectionneur suffit à faire hurler R1 —
            sans qu&apos;aucune manipulation n&apos;existe. Exemple réel dans
            nos données : un Pikachu promotionnel japonais de 2004 (ex5.5-5),
            tiré à une poignée d&apos;exemplaires, affiche un premier prix à
            plus de 100 fois son prix de référence. Ce n&apos;est pas un
            buyout, c&apos;est un marché fantôme où plus rien ne s&apos;échange.
            Nous le gardons volontairement sous surveillance comme cas
            d&apos;école : le futur garde-fou « marché trop mince pour être
            analysé » devra le faire taire, et sa disparition des alertes
            prouvera que le correctif fonctionne.
          </p>
          <p>
            <strong>Les cartes qui viennent de sortir sont agitées.</strong>{" "}
            Dans les semaines suivant une sortie, les prix se cherchent avant
            de se stabiliser. Comparer « aujourd&apos;hui » à une moyenne de
            30 jours n&apos;a pas grand sens quand la carte n&apos;existe que
            depuis 20 jours. Une période de quarantaine avant qu&apos;une
            carte neuve devienne « alertable » est prévue.
          </p>
          <p>
            <strong>Les seuils actuels sont des hypothèses de départ.</strong>{" "}
            À partir de quel écart alerter ? ×1,3 ? ×1,5 ? Ces valeurs ont été
            posées par raisonnement, pas encore validées par
            l&apos;expérience. La démarche : observer plusieurs semaines sans
            conclure, identifier ce qui génère du bruit, ajuster en
            documentant chaque changement, puis valider avec des scénarios de
            test — des manipulations simulées que le système doit détecter,
            et des mouvements naturels sur lesquels il doit rester
            silencieux.
          </p>
        </div>
      </Container>

      <Container className="border-b border-border py-6">
        <h2 className="mb-3 text-base font-semibold">
          Performance mesurée du moteur
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Le moteur est évalué sur neuf scénarios de test rejoués à chaque
          modification du code, en intégration continue. Chaque scénario
          reproduit un pattern observé sur le marché réel : un rachat de
          plancher, une hausse fabriquée, une hausse légitime, un marché sans
          échanges, une offre hors-marché. Le moteur doit détecter les
          premiers et rester silencieux sur les seconds.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-2 py-3 font-medium">Métrique</th>
                <th className="px-2 py-3 text-right font-medium">
                  Avant calibration
                </th>
                <th className="px-2 py-3 text-right font-medium">
                  Après calibration
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="px-2 py-3">
                  Précision <span className="text-xs text-muted-foreground">(les alertes émises sont-elles justifiées ?)</span>
                </td>
                <td className="px-2 py-3 text-right tabular-nums">50 %</td>
                <td className="px-2 py-3 text-right font-semibold tabular-nums text-green-600 dark:text-green-400">
                  100 %
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-2 py-3">
                  Rappel <span className="text-xs text-muted-foreground">(les vrais cas sont-ils tous attrapés ?)</span>
                </td>
                <td className="px-2 py-3 text-right tabular-nums">100 %</td>
                <td className="px-2 py-3 text-right font-semibold tabular-nums text-green-600 dark:text-green-400">
                  100 %
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-2 py-3">Faux positifs</td>
                <td className="px-2 py-3 text-right tabular-nums">2</td>
                <td className="px-2 py-3 text-right font-semibold tabular-nums text-green-600 dark:text-green-400">
                  0
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Ces chiffres mesurent la <em>correction</em> du moteur : fait-il ce
          que son code prétend faire ? Ils ne garantissent pas la{" "}
          <em>validité</em> des hypothèses sous-jacentes — comme la section
          suivante le démontre.
        </p>
      </Container>

      <Container className="border-b border-border py-6">
        <h2 className="mb-1 text-base font-semibold">
          Journal des erreurs corrigées
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Ce projet publie ses erreurs. Un système de surveillance qui
          dissimulerait ses propres défauts n&apos;aurait aucune légitimité à
          en signaler chez les autres.
        </p>
        <div className="space-y-3">
          <div className="rounded-md border border-border p-4">
            <h3 className="mb-1 text-sm font-semibold">
              Les moyennes de vente de la source sont figées
            </h3>
            <p className="text-sm text-muted-foreground">
              La règle la plus prolifique du moteur (R2) reposait sur la
              comparaison entre les ventes du jour et la moyenne du mois.
              Vérification faite sur deux relevés consécutifs du catalogue
              complet : <strong className="text-foreground">zéro variation
              sur 70 975 cartes en 24 heures</strong>, alors que le prix de
              référence, lui, bougeait sur 16,6 % d&apos;entre elles. Ces
              moyennes ne sont donc pas recalculées quotidiennement : la règle
              ne détectait aucun mouvement, elle resignalait chaque jour un
              rapport figé. <strong className="text-foreground">Règle
              suspendue</strong>, alertes correspondantes purgées.
            </p>
          </div>
          <div className="rounded-md border border-border p-4">
            <h3 className="mb-1 text-sm font-semibold">
              Le prix plancher mélange les états de conservation
            </h3>
            <p className="text-sm text-muted-foreground">
              Les prix publics agrègent tous les états, de l&apos;exemplaire
              très abîmé au neuf. Une carte cotée 253 € peut afficher un
              plancher à 11,89 € : ce n&apos;est pas une affaire, c&apos;est un
              exemplaire en mauvais état. Les règles fondées sur le plancher
              (R1, R3) comparaient donc des grandeurs non comparables.{" "}
              <strong className="text-foreground">Rétrogradées en signaux
              faibles</strong> ; leur refonte utilisera l&apos;écart du
              plancher à sa propre habitude, et non sa valeur absolue.
            </p>
          </div>
          <div className="rounded-md border border-border p-4">
            <h3 className="mb-1 text-sm font-semibold">
              Une alerte fantôme : le Pikachu à 40 000 €
            </h3>
            <p className="text-sm text-muted-foreground">
              Une carte cotée 400 € dont un vendeur affichait un exemplaire à
              40 000 € déclenchait quotidiennement l&apos;alerte de plus haute
              sévérité du système. Ce n&apos;était pas un rachat de marché,
              c&apos;était un vendeur qui ne souhaitait pas vendre. Correctif :
              les alertes de plancher ne se déclenchent plus que dans une
              fourchette plausible — au-delà d&apos;un certain écart, il ne
              s&apos;agit plus d&apos;une manipulation mais d&apos;une offre
              hors-marché.
            </p>
          </div>
        </div>
      </Container>

      <Container className="border-b border-border py-6">
        <h2 className="mb-1 text-base font-semibold">
          État du moteur et calendrier
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Les données de vente exploitables commencent le 10 juillet 2026. Un
          moteur de détection statistique a besoin de connaître le comportement{" "}
          <em>habituel</em> de chaque carte avant de pouvoir juger qu&apos;une
          journée est anormale. Cette connaissance ne s&apos;achète pas :
          elle se construit, jour après jour.
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="rounded-md border border-border p-3">
            <strong className="text-foreground">Aujourd&apos;hui</strong> —
            Collecte quotidienne sur environ 14 500 cartes. Règles de contexte
            (R5, R6) actives. Signaux faibles (R1, R3) conservés à titre
            indicatif. R2 suspendue.
          </li>
          <li className="rounded-md border border-border p-3">
            <strong className="text-foreground">À 7 jours</strong> — Moyennes
            mobiles calculées sur notre propre historique, sur la seule donnée
            réellement vivante. Nouvelle règle de divergence, cette fois sur du
            mouvement réel.
          </li>
          <li className="rounded-md border border-border p-3">
            <strong className="text-foreground">À 14 jours</strong> —
            Activation de la détection statistique (R4) : chaque carte est
            jugée à l&apos;aune de sa propre volatilité. Et d&apos;une règle de
            divergence au marché : une carte ne compte que si elle s&apos;écarte
            du mouvement d&apos;ensemble — la distinction entre un marché qui
            monte et une carte qui décroche.
          </li>
          <li className="rounded-md border border-border p-3">
            <strong className="text-foreground">À 30 jours</strong> — Moteur à
            pleine puissance, sur une chaîne de données entièrement maîtrisée.
          </li>
        </ul>
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