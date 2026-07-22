import Container from "@/components/container";

export default function MethodologiePage() {
  return (
    <div>
      <Container className="border-b border-border py-4">
        <h1 className="text-lg font-semibold">Méthodologie</h1>
        <p className="text-sm text-muted-foreground">
          Comment le système détecte, ce qu&apos;il sait faire, ce qu&apos;il
          ne sait pas faire, et les erreurs qu&apos;il a commises en chemin.
        </p>
      </Container>

      <Container className="border-b border-border py-6">
        <h2 className="mb-3 text-base font-semibold">Le principe</h2>
        <p className="mb-3 max-w-3xl text-sm text-muted-foreground">
          Le marché des cartes Pokémon présente les caractéristiques d&apos;un
          marché financier immature : des actifs échangés à plusieurs milliers
          d&apos;euros, une asymétrie d&apos;information massive, aucune
          obligation de transparence, aucun régulateur. Les mécanismes de
          manipulation y sont pourtant identiques à ceux de la finance :
          rachat de l&apos;offre disponible, gonflement artificiel des cours,
          exploitation d&apos;informations non publiques.
        </p>
        <p className="mb-3 max-w-3xl text-sm text-muted-foreground">
          Ce système transpose à ce marché les principes des dispositifs de
          surveillance des marchés réglementés. La question posée n&apos;est
          pas <em>« combien vaut cette carte ? »</em> — d&apos;autres outils y
          répondent — mais{" "}
          <em>« ce mouvement de prix est-il honnête ? »</em>.
        </p>
        <p className="max-w-3xl rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
          <strong className="text-foreground">Principe cardinal :</strong> une
          alerte est un candidat à investigation, jamais un verdict. La
          détection est entièrement déterministe — aucun modèle opaque
          n&apos;intervient dans la chaîne de décision. Chaque alerte est
          reproductible à partir de ses données sources, et chaque seuil vit en
          base de données, daté et versionné.
        </p>
      </Container>

      <Container className="border-b border-border py-6">
        <h2 className="mb-3 text-base font-semibold">Les règles de détection</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-2 py-3 font-medium">Règle</th>
                <th className="px-2 py-3 font-medium">Ce qu&apos;elle cherche</th>
                <th className="px-2 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="px-2 py-3 font-medium">Décrochage de moyenne</td>
                <td className="px-2 py-3 text-muted-foreground">
                  Le prix s&apos;écarte de sa propre moyenne des sept derniers
                  jours, et la tendance est confirmée sur trente jours
                </td>
                <td className="px-2 py-3">
                  <span className="rounded bg-green-500/10 px-2 py-1 text-xs text-green-600 dark:text-green-400">
                    Active
                  </span>
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-2 py-3 font-medium">Divergence au marché</td>
                <td className="px-2 py-3 text-muted-foreground">
                  La carte s&apos;écarte nettement du mouvement d&apos;ensemble
                  — monter quand tout monte n&apos;est pas un signal
                </td>
                <td className="px-2 py-3">
                  <span className="rounded bg-green-500/10 px-2 py-1 text-xs text-green-600 dark:text-green-400">
                    Active
                  </span>
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-2 py-3 font-medium">Vague intra-extension</td>
                <td className="px-2 py-3 text-muted-foreground">
                  Plusieurs cartes de la même extension signalées le même jour
                </td>
                <td className="px-2 py-3">
                  <span className="rounded bg-blue-500/10 px-2 py-1 text-xs text-blue-600 dark:text-blue-400">
                    Contexte
                  </span>
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-2 py-3 font-medium">Vague intra-Pokémon</td>
                <td className="px-2 py-3 text-muted-foreground">
                  Plusieurs cartes du même Pokémon, tous sets confondus. Peut
                  révéler une coordination — ou innocenter un mouvement
                </td>
                <td className="px-2 py-3">
                  <span className="rounded bg-blue-500/10 px-2 py-1 text-xs text-blue-600 dark:text-blue-400">
                    Contexte
                  </span>
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-2 py-3 font-medium">Saut du prix plancher</td>
                <td className="px-2 py-3 text-muted-foreground">
                  Le prix le plus bas bondit en 24 h sans mouvement du prix de
                  référence
                </td>
                <td className="px-2 py-3">
                  <span className="rounded bg-amber-500/10 px-2 py-1 text-xs text-amber-600 dark:text-amber-400">
                    Signal faible
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-2 py-3 font-medium">Écart statistique</td>
                <td className="px-2 py-3 text-muted-foreground">
                  Variation anormale au regard de la volatilité habituelle de
                  la carte elle-même
                </td>
                <td className="px-2 py-3">
                  <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                    Attend l&apos;historique
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-3xl text-sm text-muted-foreground">
          Deux règles ont été <strong>retirées</strong> en cours de route :
          l&apos;une comparait le prix plancher au prix de référence, l&apos;autre
          s&apos;appuyait sur les moyennes de vente fournies par la source. Le
          journal ci-dessous explique pourquoi.
        </p>
      </Container>

      <Container className="border-b border-border py-6">
        <h2 className="mb-3 text-base font-semibold">
          Les filtres appliqués à toute analyse
        </h2>
        <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
          Ces filtres ne sont pas des réglages arbitraires : chacun découle
          d&apos;une découverte documentée plus bas. Ils écartent des données
          avant qu&apos;elles ne produisent de fausses alertes.
        </p>
        <ul className="max-w-3xl space-y-2 text-sm text-muted-foreground">
          <li className="rounded-md border border-border p-3">
            <strong className="text-foreground">Plausibilité</strong> — un prix
            de référence incohérent avec le prix des ventes réelles est écarté
            du calcul. Environ 5 % du catalogue est concerné chaque jour.
          </li>
          <li className="rounded-md border border-border p-3">
            <strong className="text-foreground">Liquidité</strong> — une carte
            doit avoir changé de prix au moins trois fois en sept jours pour
            être analysée au jour le jour. Sans cela, une « variation
            quotidienne » condense en réalité plusieurs jours de mouvement.
          </li>
          <li className="rounded-md border border-border p-3">
            <strong className="text-foreground">Fraîcheur</strong> — le prix
            doit avoir bougé la veille également. Une carte gelée trois jours
            puis rattrapant d&apos;un coup n&apos;est pas comparable au
            mouvement quotidien du marché.
          </li>
          <li className="rounded-md border border-border p-3">
            <strong className="text-foreground">
              Rationalité économique
            </strong>{" "}
            — prix minimum de 5 €. En dessous, racheter l&apos;offre disponible
            coûterait plus cher que le gain espéré.
          </li>
        </ul>
      </Container>

      <Container className="border-b border-border py-6">
        <h2 className="mb-3 text-base font-semibold">
          Performance mesurée du moteur
        </h2>
        <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
          Le moteur est évalué sur neuf scénarios de test rejoués
          automatiquement à chaque modification du code. Chaque scénario
          reproduit un comportement réellement observé : un décrochage de prix
          légitime, une carte dont le prix était gelé plusieurs jours avant de
          rattraper d&apos;un coup, une carte trop peu échangée pour être
          analysée, une carte qui suit simplement le mouvement d&apos;ensemble.
          Le moteur doit signaler les premiers et rester silencieux sur les
          seconds. Une régression fait échouer l&apos;intégration continue et
          bloque la mise en production.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-2 py-3 font-medium">Métrique</th>
                <th className="px-2 py-3 text-right font-medium">Résultat</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="px-2 py-3">
                  Précision{" "}
                  <span className="text-xs text-muted-foreground">
                    (les alertes émises sont-elles justifiées ?)
                  </span>
                </td>
                <td className="px-2 py-3 text-right font-semibold tabular-nums text-green-600 dark:text-green-400">
                  100 %
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-2 py-3">
                  Rappel{" "}
                  <span className="text-xs text-muted-foreground">
                    (les vrais cas sont-ils tous attrapés ?)
                  </span>
                </td>
                <td className="px-2 py-3 text-right font-semibold tabular-nums text-green-600 dark:text-green-400">
                  100 %
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-2 py-3">Scénarios couverts</td>
                <td className="px-2 py-3 text-right tabular-nums">9</td>
              </tr>
              <tr>
                <td className="px-2 py-3">Faux positifs</td>
                <td className="px-2 py-3 text-right font-semibold tabular-nums text-green-600 dark:text-green-400">
                  0
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-3xl text-xs text-muted-foreground">
          Ces chiffres mesurent la <em>correction</em> du moteur : fait-il ce
          que son code prétend faire ? Ils ne garantissent pas la{" "}
          <em>validité</em> des hypothèses sous-jacentes. Le journal ci-dessous
          montre pourquoi cette distinction est vitale : un moteur peut être
          parfaitement correct et parfaitement faux, s&apos;il repose sur une
          mauvaise compréhension de ses données.
        </p>
      </Container>

      <Container className="border-b border-border py-6">
        <h2 className="mb-1 text-base font-semibold">
          Journal des erreurs corrigées
        </h2>
        <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
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
              La règle la plus prolifique du moteur comparait les ventes du
              jour à la moyenne du mois. Vérification sur deux relevés
              consécutifs du catalogue complet :{" "}
              <strong className="text-foreground">
                zéro variation sur 70 975 cartes en vingt-quatre heures
              </strong>
              , alors que le prix de référence bougeait sur 16,6 %
              d&apos;entre elles. Ces moyennes ne sont pas recalculées
              quotidiennement : la règle ne détectait aucun mouvement, elle
              resignalait chaque jour un rapport figé.{" "}
              <strong className="text-foreground">Règle retirée</strong>, puis
              refondée sur des moyennes calculées à partir de notre propre
              historique.
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
              comparaient donc des grandeurs non comparables. L&apos;une a été
              retirée, l&apos;autre conservée en signal faible explicitement
              signalé.
            </p>
          </div>

          <div className="rounded-md border border-border p-4">
            <h3 className="mb-1 text-sm font-semibold">
              Le prix de référence contient des valeurs corrompues
            </h3>
            <p className="text-sm text-muted-foreground">
              Une carte voit son prix de référence passer de 7,17 € à 273,81 €
              en une nuit, puis y rester — alors que dans le même fichier, au
              même instant, son prix plancher reste à 1,50 € et ses ventes se
              font à 7 €.{" "}
              <strong className="text-foreground">
                Environ 500 cartes par jour, soit 2,3 % du catalogue
              </strong>
              , portent ainsi un prix de référence incohérent. Sans contrôle,
              cela représenterait autant de fausses alertes spectaculaires
              chaque jour. Un contrôle de plausibilité écarte désormais ces
              valeurs en entrée, et le taux de fiabilité des données est mesuré
              et publié.
            </p>
          </div>

          <div className="rounded-md border border-border p-4">
            <h3 className="mb-1 text-sm font-semibold">
              La seconde source servait des données périmées
            </h3>
            <p className="text-sm text-muted-foreground">
              Quatre cartes suivies affichaient un prix identique au centime
              près deux jours consécutifs. Comparaison avec la source directe
              aux mêmes dates : les quatre avaient en réalité baissé de 3 à
              5 %.{" "}
              <strong className="text-foreground">
                L&apos;interface intermédiaire recopiait les prix de la veille
              </strong>{" "}
              — le moteur tournait sur des variations nulles fabriquées, ce qui
              est pire que l&apos;absence de données. Le moteur a été refondé
              sur la source directe ; l&apos;horodatage de la source est
              désormais conservé pour détecter toute future péremption.
            </p>
          </div>

          <div className="rounded-md border border-border p-4">
            <h3 className="mb-1 text-sm font-semibold">
              Les prix ne sont pas une série quotidienne
            </h3>
            <p className="text-sm text-muted-foreground">
              Le prix de référence n&apos;est mis à jour qu&apos;à
              l&apos;occasion d&apos;une vente.{" "}
              <strong className="text-foreground">
                Trois quarts des cartes affichent un prix identique d&apos;un
                jour à l&apos;autre, et 43,5 % ne cotent pas une seule fois par
                semaine.
              </strong>{" "}
              Une variation apparente de 79 % en un jour pouvait ainsi
              condenser trois jours de gel suivis d&apos;un rattrapage. Les
              filtres de liquidité et de fraîcheur ont réduit le volume
              d&apos;alertes de la règle concernée de 139 à 46, en éliminant
              précisément ces faux mouvements.
            </p>
          </div>

          <div className="rounded-md border border-border p-4">
            <h3 className="mb-1 text-sm font-semibold">
              La référence de marché valait structurellement zéro
            </h3>
            <p className="text-sm text-muted-foreground">
              La médiane du marché affichait exactement 0,000 % chaque jour.
              Cause : elle était calculée sur l&apos;ensemble du catalogue, or
              la majorité des cartes ne cotent pas quotidiennement — la médiane
              d&apos;une population majoritairement immobile vaut zéro,
              mécaniquement. La règle de divergence au marché ne comparait donc
              à rien : elle n&apos;était qu&apos;un seuil de variation brute
              déguisé. La référence est désormais calculée sur les seules
              cartes ayant effectivement coté ce jour-là.
            </p>
          </div>

          <div className="rounded-md border border-border p-4">
            <h3 className="mb-1 text-sm font-semibold">
              Le prix de référence contredit le prix des transactions
            </h3>
            <p className="text-sm text-muted-foreground">
              En isolant les cartes dont le prix de référence <em>et</em> le
              prix moyen des ventes ont tous deux bougé le même jour — 3 491
              observations — les deux indicateurs vont dans des directions
              opposées :{" "}
              <strong className="text-foreground">
                le prix de référence perd 1,19 % pendant que le prix des
                transactions gagne 1,55 %
              </strong>
              . Deux explications ont été testées et écartées : un rattrapage
              progressif (réfuté — les cartes dont la référence est déjà
              inférieure aux ventes baissent deux fois plus vite) et une
              érosion passive (réfutée — les hausses ne s&apos;accompagnent pas
              plus souvent d&apos;une transaction que les baisses). Nous
              constatons cette contradiction sans l&apos;expliquer.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              <strong className="text-foreground">
                Conséquence pour toute lecture de prix :
              </strong>{" "}
              zéro n&apos;est pas le point neutre. Une carte dont le prix
              affiché reste stable surperforme son marché d&apos;environ 1,2 %
              par jour. Tous les écarts publiés sur ce site sont calculés par
              rapport au mouvement médian réel, dérive comprise.
            </p>
          </div>

          <div className="rounded-md border border-border p-4">
            <h3 className="mb-1 text-sm font-semibold">
              Un test d&apos;évaluation qui ne testait rien
            </h3>
            <p className="text-sm text-muted-foreground">
              La première exécution du harness d&apos;évaluation affichait
              fièrement « 100 % de précision, tous les scénarios passent ».
              Sauf qu&apos;aucun scénario n&apos;était chargé : le script avait
              divisé zéro par zéro. Le harness vérifie désormais qu&apos;il a
              de quoi tester avant de conclure.{" "}
              <strong className="text-foreground">
                Un test qui ne peut pas échouer est un test qui ne sert à rien.
              </strong>
            </p>
          </div>

          <div className="rounded-md border border-border p-4">
            <h3 className="mb-1 text-sm font-semibold">
              Post-mortem : une décision de sécurité casse le pipeline
            </h3>
            <p className="text-sm text-muted-foreground">
              L&apos;ouverture de ce tableau de bord au public a nécessité
              d&apos;activer un contrôle d&apos;accès sur les données. Les
              règles créées n&apos;autorisaient que la lecture, or la clé
              utilisée par les traitements automatiques n&apos;avait pas les
              privilèges nécessaires pour les contourner :{" "}
              <strong className="text-foreground">
                la chaîne d&apos;écriture du système était rompue
              </strong>
              . Une décision de sécurité côté public avait silencieusement
              cassé la collecte. Détecté par le harness d&apos;évaluation avant
              tout impact sur les données de production.
            </p>
          </div>
        </div>
      </Container>

      <Container className="border-b border-border py-6">
        <h2 className="mb-3 text-base font-semibold">
          Le cas particulier des cartes récentes
        </h2>
        <p className="mb-3 max-w-3xl text-sm text-muted-foreground">
          Une carte sortie depuis moins d&apos;un mois est{" "}
          <strong className="text-foreground">inanalysable</strong> pour la
          détection de manipulation, et le système le reconnaît explicitement.
        </p>
        <p className="mb-3 max-w-3xl text-sm text-muted-foreground">
          Sur une nouveauté, les prix font littéralement n&apos;importe quoi :
          le marché n&apos;a pas encore trouvé son équilibre, l&apos;offre et
          la demande se cherchent, les écarts entre vendeurs sont énormes.{" "}
          <strong className="text-foreground">
            Une flambée sur une carte fraîchement sortie n&apos;est pas un
            signal de manipulation, c&apos;est le fonctionnement normal de la
            découverte de prix d&apos;un actif neuf.
          </strong>{" "}
          C&apos;est précisément le scénario où une accusation a le plus de
          chances d&apos;être fausse.
        </p>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Cela ne veut pas dire qu&apos;une manipulation y soit impossible —
          une carte à fort engouement à sa sortie est même une cible plausible.
          Mais l&apos;affirmer demanderait des preuves que les premières
          semaines de données ne peuvent pas fournir. En leur absence, le
          système s&apos;abstient.
        </p>
      </Container>

      <Container className="border-b border-border py-6">
        <h2 className="mb-3 text-base font-semibold">Limites assumées</h2>
        <ol className="max-w-3xl list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">
              Le marché des cartes n&apos;est pas régulé.
            </strong>{" "}
            Ni régulateur, ni obligation de transparence, ni sanction. Ce
            système n&apos;a aucun pouvoir de contrainte et ne prétend à aucune
            autorité.
          </li>
          <li>
            <strong className="text-foreground">
              Les données publiques ne permettent pas d&apos;identifier les
              acteurs.
            </strong>{" "}
            Aucune adresse, aucun compte acheteur, aucune identité réelle
            n&apos;est accessible ni recherchée. Le système détecte des
            schémas, pas des personnes.
          </li>
          <li>
            <strong className="text-foreground">
              Les prix ne distinguent pas l&apos;état des cartes.
            </strong>{" "}
            Limite structurelle de la source, avec ses conséquences documentées
            sur plusieurs règles.
          </li>
          <li>
            <strong className="text-foreground">
              Le prix de référence est mis à jour à la vente, pas
              quotidiennement.
            </strong>{" "}
            Seul un quart du catalogue est analysable au jour le jour.
          </li>
          <li>
            <strong className="text-foreground">
              Le prix de référence dérive à la baisse d&apos;environ 1,2 % par
              jour
            </strong>{" "}
            en contradiction avec le prix des transactions réelles, qui
            progresse d&apos;environ 1,6 %. Le biais est mesuré et compensé
            dans tous les calculs d&apos;écart, mais son origine reste
            inexpliquée.
          </li>
          <li>
            <strong className="text-foreground">
              Les mouvements légitimes existent.
            </strong>{" "}
            Sorties d&apos;extensions, rotation du format de jeu, résultats de
            tournois, exposition médiatique. Le moteur repère l&apos;anormal,
            il ne lit pas dans les intentions.
          </li>
          <li>
            <strong className="text-foreground">
              Les seuils sont des hypothèses en cours de validation.
            </strong>{" "}
            Le taux de faux positifs est mesuré, publié et travaillé, pas
            dissimulé derrière un vernis de certitude.
          </li>
        </ol>
      </Container>

      <Container className="py-6">
        <h2 className="mb-3 text-base font-semibold">
          Sources et traitement des données
        </h2>
        <ul className="max-w-3xl space-y-2 text-sm text-muted-foreground">
          <li className="rounded-md border border-border p-3">
            <strong className="text-foreground">Sources officielles uniquement.</strong>{" "}
            Catalogue de prix Cardmarket, interface publique TCGdex, interface
            officielle eBay. Aucun scraping, aucune donnée obtenue en violation
            de conditions d&apos;utilisation.
          </li>
          <li className="rounded-md border border-border p-3">
            <strong className="text-foreground">Collecte automatisée.</strong>{" "}
            Le pipeline complet — téléchargement, ingestion, contrôle qualité,
            détection, publication du bilan — s&apos;exécute chaque jour sans
            intervention humaine. Un détecteur de jours manquants surveille
            l&apos;assiduité de la collecte et l&apos;affiche publiquement.
          </li>
          <li className="rounded-md border border-border p-3">
            <strong className="text-foreground">Datation par la source.</strong>{" "}
            Chaque relevé est daté par l&apos;horodatage interne du fichier, et
            non par la date d&apos;exécution. Un fichier publié en retard est
            ainsi rattaché au bon jour, ce qui évite une corruption silencieuse
            de la série temporelle.
          </li>
          <li className="rounded-md border border-border p-3">
            <strong className="text-foreground">Traçabilité.</strong> Les
            réponses brutes sont conservées avec chaque instantané, permettant
            de recalculer toute alerte a posteriori. Les seuils vivent en base,
            datés : on peut toujours répondre à « avec quels réglages cette
            alerte a-t-elle été produite ? ».
          </li>
          <li className="rounded-md border border-border p-3">
            <strong className="text-foreground">
              Rédaction assistée, calcul jamais.
            </strong>{" "}
            Les bilans quotidiens sont rédigés par un modèle de langage à
            partir d&apos;un dossier factuel constitué en amont. Le modèle ne
            calcule rien, ne détecte rien, ne décide rien. Chaque chiffre
            qu&apos;il cite est vérifié contre la base avant publication : un
            bilan contenant un chiffre absent du dossier est rejeté et
            n&apos;est jamais mis en ligne.
          </li>
        </ul>
      </Container>
    </div>
  );
}
