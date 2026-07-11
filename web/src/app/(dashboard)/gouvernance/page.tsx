import Container from "@/components/container";

const PARALLELS = [
  {
    market: "Surveillance de marché (MAR / AMF)",
    pokewatch:
      "Scan quotidien de l'ensemble des cartes suivies, détection automatique des mouvements anormaux, génération d'alertes horodatées et documentées.",
  },
  {
    market: "Détection de manipulation de cours",
    pokewatch:
      "Règles ciblant les signatures connues : assèchement artificiel de l'offre (buyout), gonflement des prix (pump), mouvements coordonnés sur plusieurs actifs liés.",
  },
  {
    market: "Faisceau d'indices et standard de preuve",
    pokewatch:
      "Une alerte n'est jamais un verdict. La qualification exige des preuves convergentes, et l'absence de preuve conduit à une conclusion de non-lieu, pas au silence.",
  },
  {
    market: "Explicabilité et auditabilité",
    pokewatch:
      "Détection 100 % déterministe : chaque alerte est reproductible à partir de ses données sources. Aucun modèle opaque dans la chaîne de décision.",
  },
  {
    market: "Traçabilité des paramètres",
    pokewatch:
      "Les seuils de détection vivent en base, versionnés et datés. On peut toujours répondre à la question : avec quels réglages cette alerte a-t-elle été produite ?",
  },
  {
    market: "Protection des données personnelles (RGPD)",
    pokewatch:
      "Le système analyse des prix, pas des personnes. Toute donnée de vendeur serait pseudonymisée dès la collecte, avec une durée de conservation limitée et une finalité déclarée.",
  },
];

const DATA_QUALITY = [
  {
    title: "Exactitude",
    text: "Les identifiants de cartes sont validés contre l'API source avant toute entrée en base. Aucune référence n'est ajoutée sur la foi d'une liste manuelle.",
  },
  {
    title: "Unicité",
    text: "Un contrôle d'unicité par produit de marché empêche qu'une même carte soit surveillée en double sous plusieurs identifiants — un défaut détecté et corrigé dès le premier jour d'exploitation.",
  },
  {
    title: "Complétude",
    text: "Le dashboard expose son propre taux de couverture : la proportion de cartes effectivement collectées chaque jour. Une collecte incomplète est visible, pas dissimulée.",
  },
  {
    title: "Traçabilité (lignage)",
    text: "Les réponses brutes de la source sont conservées avec chaque instantané, permettant de recalculer toute alerte a posteriori et de prouver ce que le système a vu, et quand.",
  },
  {
    title: "Idempotence",
    text: "Les traitements peuvent être rejoués sans créer de doublons ni corrompre l'historique. Une reprise après incident ne dégrade pas la qualité des données.",
  },
  {
    title: "Journalisation",
    text: "Chaque entrée d'une carte dans le périmètre de surveillance est journalisée avec sa date et son motif. On peut toujours répondre à : pourquoi cette carte est-elle surveillée ?",
  },
];

const LIMITS = [
  "Le marché des cartes à collectionner n'est pas un marché réglementé. Il n'existe ni régulateur, ni obligation de transparence, ni sanction. PokéWatch n'a aucun pouvoir de contrainte et ne prétend à aucune autorité.",
  "Les données publiquement disponibles ne permettent pas d'identifier les acteurs. Aucune adresse IP, aucun compte d'acheteur, aucune identité réelle n'est accessible — ni recherchée. Le système détecte des schémas, pas des personnes.",
  "Une alerte peut avoir des causes parfaitement légitimes : sortie d'extension, rotation du format de jeu, résultats de tournois, exposition médiatique. Le moteur repère l'anormal, il ne lit pas dans les intentions.",
  "Les seuils actuels sont des hypothèses en cours de validation. Le taux de faux positifs est mesuré, publié et travaillé — pas dissimulé derrière un vernis de certitude.",
];

export default function GouvernancePage() {
  return (
    <div>
      <Container className="border-b border-border py-4">
        <h1 className="text-lg font-semibold">Gouvernance &amp; conformité</h1>
        <p className="text-sm text-muted-foreground">
          PokéWatch applique à un marché non régulé les principes des
          dispositifs de surveillance des marchés financiers. Cette page
          explique lesquels, comment, et où s&apos;arrêtent leurs limites.
        </p>
      </Container>

      <Container className="border-b border-border py-6">
        <h2 className="mb-3 text-base font-semibold">
          Le parallèle avec la surveillance des marchés financiers
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Le marché des cartes Pokémon présente les caractéristiques d&apos;un
          marché financier immature : des actifs échangés à des prix parfois
          très élevés, une forte asymétrie d&apos;information, aucune
          obligation de transparence, et aucun régulateur. Les mécanismes de
          manipulation y sont pourtant les mêmes qu&apos;en finance — corner
          sur l&apos;offre, gonflement artificiel des cours, exploitation
          d&apos;informations privilégiées lors des fuites avant sortie. Les
          outils de détection, dès lors, peuvent être transposés.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-2 py-3 font-medium">
                  Principe des marchés réglementés
                </th>
                <th className="px-2 py-3 font-medium">
                  Mise en œuvre dans PokéWatch
                </th>
              </tr>
            </thead>
            <tbody>
              {PARALLELS.map((p) => (
                <tr key={p.market} className="border-b border-border/50">
                  <td className="px-2 py-3 align-top font-medium">
                    {p.market}
                  </td>
                  <td className="px-2 py-3 align-top text-muted-foreground">
                    {p.pokewatch}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>

      <Container className="border-b border-border py-6">
        <h2 className="mb-1 text-base font-semibold">
          Qualité des données : les dimensions contrôlées
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Un système de détection ne vaut que ce que valent ses données. Les
          dimensions de qualité suivantes, issues des cadres de référence de la
          gestion des données, sont contrôlées par construction.
        </p>
        <div className="grid grid-cols-1 gap-3 laptop:grid-cols-2">
          {DATA_QUALITY.map((d) => (
            <div key={d.title} className="rounded-md border border-border p-4">
              <h3 className="mb-1 text-sm font-semibold">{d.title}</h3>
              <p className="text-sm text-muted-foreground">{d.text}</p>
            </div>
          ))}
        </div>
      </Container>

      <Container className="border-b border-border py-6">
        <h2 className="mb-3 text-base font-semibold">
          Ce que PokéWatch ne fait pas, et pourquoi
        </h2>
        <ul className="space-y-3">
          {LIMITS.map((limit) => (
            <li
              key={limit.slice(0, 30)}
              className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground"
            >
              {limit}
            </li>
          ))}
        </ul>
      </Container>

      <Container className="py-6">
        <h2 className="mb-3 text-base font-semibold">
          Le principe qui prime sur tous les autres
        </h2>
        <p className="rounded-md border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
          Un système de détection qui ne sait pas dire « je ne sais pas » est
          un système dangereux. La valeur d&apos;un dispositif de surveillance
          ne se mesure pas au nombre d&apos;alertes qu&apos;il produit, mais à
          la solidité de celles qu&apos;il retient — et à sa capacité à
          écarter, publiquement et avec méthode, celles qui ne tiennent pas.
          C&apos;est vrai en conformité bancaire. Ça l&apos;est ici aussi.
        </p>
      </Container>
    </div>
  );
}