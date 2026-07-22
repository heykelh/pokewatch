import Container from "@/components/container";

export default function InvestigationsPage() {
  return (
    <div>
      <Container className="border-b border-border py-4">
        <h1 className="text-lg font-semibold">Investigations</h1>
        <p className="text-sm text-muted-foreground">
          Ce que le système fait d&apos;une alerte. Chaque cas confronte les
          hypothèses, examine les preuves, et conclut — y compris par «
          preuves insuffisantes » ou « pas de manipulation ».
        </p>
      </Container>

      {/* ============ CAS Nº 2 ============ */}
      <Container className="border-b border-border py-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
            Cas nº 2 · Observation en cours
          </span>
          <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            Verdict : aucun effet haussier détectable
          </span>
          <span className="text-xs text-muted-foreground">
            13 — 22 juillet 2026
          </span>
        </div>

        <h2 className="mb-1 text-xl font-semibold">
          Une recommandation publique fait-elle monter les prix ?
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Le 13 juillet, une vidéo présente cinq cartes comme
          « sous-cotées ». L&apos;intuition commune veut qu&apos;une telle
          recommandation fasse mécaniquement grimper les prix. Nous avons
          mesuré — et il a d&apos;abord fallu découvrir que notre propre
          indicateur de référence contredisait le prix des transactions.
        </p>

        <div className="space-y-4 text-sm text-muted-foreground">
          <section>
            <h3 className="mb-1 text-sm font-semibold text-foreground">
              Le protocole, établi avant l&apos;observation
            </h3>
            <p className="mb-2">
              Ce point est essentiel à la validité de l&apos;analyse : la
              méthode a été fixée le jour même de la publication, avant de
              connaître le moindre résultat. Il n&apos;était donc pas possible
              de choisir après coup une référence qui arrangerait la
              conclusion.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="text-foreground">Les cartes suivies</strong>{" "}
                — quatre des cinq cartes citées. La cinquième a été écartée :
                elle ne dispose d&apos;aucun prix sur le marché européen, elle
                n&apos;est donc pas mesurable.
              </li>
              <li>
                <strong className="text-foreground">Le point zéro</strong> —
                prix relevés le 13 juillet, jour de la publication : entre 11
                et 20 € pour les quatre cartes.
              </li>
              <li>
                <strong className="text-foreground">
                  Le marché de contrôle
                </strong>{" "}
                — le mouvement médian des cartes ayant effectivement changé de
                prix chaque jour. Sans cette référence, une variation ne veut
                rien dire : baisser de 10 % quand tout baisse de 10 %
                n&apos;est pas un mouvement.
              </li>
              <li>
                <strong className="text-foreground">
                  Ce que nous cherchions
                </strong>{" "}
                — une surperformance par rapport à ce marché de contrôle dans
                les jours suivant la publication.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Ce que les prix ont fait
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Carte</th>
                    <th className="px-2 py-2 text-right font-medium">
                      13 juil.
                    </th>
                    <th className="px-2 py-2 text-right font-medium">
                      22 juil.
                    </th>
                    <th className="px-2 py-2 text-right font-medium">
                      Variation
                    </th>
                    <th className="px-2 py-2 text-right font-medium">
                      Écart au marché
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="px-2 py-2">Mimikyu</td>
                    <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">
                      19,09 €
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      13,82 €
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-red-600 dark:text-red-400">
                      −27,6 %
                    </td>
                    <td className="px-2 py-2 text-right font-semibold tabular-nums text-red-600 dark:text-red-400">
                      −18,5 pts
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="px-2 py-2">Mega Lucario ex</td>
                    <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">
                      11,27 €
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      10,03 €
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      −11,0 %
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      −1,9 pt
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="px-2 py-2">Zekrom</td>
                    <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">
                      16,36 €
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      14,83 €
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      −9,4 %
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      −0,3 pt
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="px-2 py-2">Lance&apos;s Charizard V</td>
                    <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">
                      16,71 €
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      15,15 €
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      −9,3 %
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      −0,2 pt
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 py-2 text-muted-foreground">
                      <em>Marché de contrôle</em>
                    </td>
                    <td className="px-2 py-2" />
                    <td className="px-2 py-2" />
                    <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">
                      <em>−9,1 %</em>
                    </td>
                    <td className="px-2 py-2" />
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs">
              Aucune des quatre cartes n&apos;a connu de hausse, pas même
              transitoire. La baisse s&apos;installe dès le lendemain de la
              publication et se poursuit sans interruption pendant neuf jours.
            </p>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Une découverte imprévue : l&apos;indicateur de référence
              contredit les transactions
            </h3>
            <p className="mb-3">
              En établissant le marché de contrôle, nous avons constaté que le
              mouvement médian était{" "}
              <strong className="text-foreground">
                négatif tous les jours, entre −0,98 % et −1,34 %
              </strong>
              , sans une seule journée de hausse en neuf jours. Un marché réel
              alterne. Cette régularité a déclenché une vérification.
            </p>
            <div className="space-y-3">
              <div className="rounded-md border border-border p-3">
                <h4 className="mb-1 text-sm font-semibold text-foreground">
                  Les baisses sont structurellement majoritaires
                </h4>
                <p>
                  Entre 59 % et 64 % des cartes ayant changé de prix ont
                  baissé, chaque jour, sans exception sur les neuf jours
                  observés.
                </p>
              </div>
              <div className="rounded-md border border-border p-3">
                <h4 className="mb-1 text-sm font-semibold text-foreground">
                  Le prix des transactions réelles, lui, monte
                </h4>
                <p>
                  En isolant les cartes dont le prix de référence <em>et</em>{" "}
                  le prix moyen des ventes ont tous deux bougé le même
                  jour — 3 491 observations — les deux indicateurs vont dans
                  des directions opposées : le prix de référence perd{" "}
                  <strong className="text-foreground">1,19 %</strong> pendant
                  que le prix des transactions gagne{" "}
                  <strong className="text-foreground">1,55 %</strong>. Les
                  échanges se concluent à des prix en hausse pendant que
                  l&apos;indicateur s&apos;érode.
                </p>
              </div>
              <div className="rounded-md border border-border p-3">
                <h4 className="mb-1 text-sm font-semibold text-foreground">
                  Deux explications testées, deux explications écartées
                </h4>
                <p>
                  L&apos;hypothèse d&apos;un rattrapage progressif du prix de
                  référence vers celui des ventes est réfutée : les cartes dont
                  la référence est déjà <em>inférieure</em> au prix des ventes
                  baissent deux fois plus vite que les autres (−2,3 % contre
                  −0,6 %), alors que la convergence prédirait une remontée.
                  L&apos;hypothèse d&apos;une érosion passive —
                  l&apos;indicateur baisserait tout seul faute de vente — est
                  également écartée : les hausses ne s&apos;accompagnent pas
                  plus souvent d&apos;une transaction que les baisses (10,2 %
                  contre 9,8 %), et les amplitudes sont identiques dans les
                  deux sens (3,44 % contre 3,37 %).
                </p>
              </div>
            </div>
            <p className="mt-3">
              <strong className="text-foreground">
                Nous constatons cette contradiction sans l&apos;expliquer.
              </strong>{" "}
              Le mécanisme de calcul de l&apos;indicateur n&apos;est pas
              documenté publiquement ; il est possible que les deux mesures ne
              portent pas sur le même périmètre de transactions ni sur les
              mêmes fenêtres temporelles. En l&apos;état, nous documentons le
              fait et ses conséquences.
            </p>
            <p className="mt-2">
              <strong className="text-foreground">
                Conséquence pour toute lecture de prix :
              </strong>{" "}
              zéro n&apos;est pas le point neutre. Une carte dont le prix
              affiché reste stable surperforme en réalité son marché
              d&apos;environ 1,2 % par jour. Tous les écarts publiés ici sont
              calculés par rapport au mouvement médian réel, dérive comprise.
            </p>
          </section>

          <section>
            <h3 className="mb-1 text-sm font-semibold text-foreground">
              Le verdict
            </h3>
            <div className="space-y-2 rounded-md border border-border bg-muted/50 p-3">
              <p>
                <strong className="text-foreground">
                  Aucun effet haussier n&apos;est détectable.
                </strong>{" "}
                Neuf jours après une recommandation publique, aucune des quatre
                cartes mesurables n&apos;a surperformé son marché de référence.
              </p>
              <p>
                Trois d&apos;entre elles ont suivi le marché à moins de deux
                points près : leur baisse apparente s&apos;explique
                intégralement par la dérive de l&apos;indicateur décrite
                ci-dessus. En prix de transaction réel, elles n&apos;ont
                probablement pas bougé. Seul le Mimikyu décroche nettement, de
                18,5 points.
              </p>
            </div>
          </section>

          <section>
            <h3 className="mb-1 text-sm font-semibold text-foreground">
              Ce que cette analyse ne dit pas
            </h3>
            <p>
              Elle ne dit pas que la vidéo aurait fait baisser les prix. Trois
              cartes sur quatre ont simplement suivi la tendance générale, et
              le décrochage du Mimikyu peut avoir de nombreuses causes sans
              rapport avec la publication. Une observation isolée ne fonde pas
              une relation de cause à effet.
            </p>
            <p className="mt-2">
              <strong className="text-foreground">
                Ce qu&apos;elle établit en revanche :
              </strong>{" "}
              l&apos;idée qu&apos;une recommandation publique ferait
              mécaniquement grimper les prix des cartes citées ne se vérifie
              pas ici. Sur ce cas, l&apos;effet mesuré est nul.
            </p>
            <p className="mt-2">
              L&apos;observation se poursuit jusqu&apos;à trente jours : un
              effet retardé reste concevable, et le comportement du Mimikyu
              mérite d&apos;être suivi.
            </p>
          </section>

          <section>
            <h3 className="mb-1 text-sm font-semibold text-foreground">
              Limites de cette investigation
            </h3>
            <p className="rounded-md border border-dashed border-border p-3 text-xs">
              Un seul événement observé ne permet aucune généralisation : ce
              résultat vaut pour ce cas, pas pour toutes les recommandations
              publiques. La taille de l&apos;audience touchée nous est inconnue,
              et une audience restreinte suffirait à expliquer l&apos;absence
              d&apos;effet. Enfin, le marché de contrôle repose sur un
              indicateur dont nous venons de montrer qu&apos;il contredit le
              prix des transactions : les écarts calculés sont cohérents entre
              eux, mais leur ancrage absolu reste incertain.
            </p>
          </section>

          <section>
            <div className="rounded-md border border-border bg-muted/50 p-3 text-xs">
              <p className="mb-1">
                <strong className="text-foreground">
                  Aucune personne n&apos;est nommée, et ce n&apos;est pas un
                  oubli.
                </strong>
              </p>
              <p>
                Recommander publiquement des cartes est parfaitement légitime.
                Cette analyse porte sur un{" "}
                <strong className="text-foreground">
                  mécanisme de marché
                </strong>{" "}
                — l&apos;effet mesurable d&apos;une recommandation publique sur
                les prix — et non sur l&apos;auteur d&apos;une publication. Le
                questionnement serait identique quelle qu&apos;en soit la
                source.
              </p>
            </div>
          </section>
        </div>
      </Container>

      {/* ============ CAS Nº 1 ============ */}
      <Container className="border-b border-border py-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400">
            Cas nº 1 · Clos
          </span>
          <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            Verdict : mouvement organique probable
          </span>
          <span className="text-xs text-muted-foreground">Juillet 2026</span>
        </div>

        <h2 className="mb-1 text-xl font-semibold">
          L&apos;affaire Ectoplasma : six cartes, six sets, un seul Pokémon
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Comment une vague d&apos;alertes apparemment coordonnée s&apos;est
          révélée être un engouement légitime — et a fait naître une nouvelle
          règle de détection.
        </p>

        <div className="space-y-4 text-sm text-muted-foreground">
          <section>
            <h3 className="mb-1 text-sm font-semibold text-foreground">
              Le signal
            </h3>
            <p>
              Les 10 et 11 juillet 2026, lors des tout premiers jours de
              collecte, le moteur signale coup sur coup six cartes du même
              Pokémon, Ectoplasma (Gengar), issues de six extensions
              différentes s&apos;étalant sur quinze ans de jeu : Gengar &amp;
              Mimikyu GX (Team Up), Gengar (Triumphant), Gengar VMAX (Fusion
              Strike), Gengar (Legendary Collection), Mega Gengar ex (Ascended
              Heroes). Toutes déclenchent la même règle, R2 : leurs ventes du
              jour décrochent nettement de leur moyenne mensuelle.
            </p>
            <p className="mt-2">
              En parallèle, des sources publiques indiquent que l&apos;une des
              cartes emblématiques du personnage, l&apos;Ectoplasma TG06 de
              l&apos;extension Origine Perdue, progresse d&apos;environ 14 à
              15 % sur trente jours.
            </p>
          </section>

          <section>
            <h3 className="mb-1 text-sm font-semibold text-foreground">
              Pourquoi c&apos;était suspect
            </h3>
            <p>
              Six cartes du même Pokémon qui bougent le même jour, ce
              n&apos;est pas un hasard statistique. Une coordination
              délibérée — quelqu&apos;un achetant massivement toute la gamme
              d&apos;un personnage populaire pour en faire monter la cote —
              produirait exactement cette signature.
            </p>
          </section>

          <section>
            <h3 className="mb-1 text-sm font-semibold text-foreground">
              Les hypothèses concurrentes
            </h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="text-foreground">
                  Manipulation coordonnée sur un personnage.
                </strong>{" "}
                Techniquement possible, mais économiquement absurde : racheter
                le stock de six cartes différentes réparties sur six marchés
                indépendants coûterait une fortune pour un rendement dilué.
              </li>
              <li>
                <strong className="text-foreground">
                  Engouement pour le personnage.
                </strong>{" "}
                Le bloc Méga-Évolution vient de sortir, avec Mega Gengar ex
                parmi ses cartes vedettes. Quand un Pokémon revient sur le
                devant de la scène, la demande se propage à toute sa gamme
                historique — un phénomène bien connu des collectionneurs.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="mb-1 text-sm font-semibold text-foreground">
              Le verdict
            </h3>
            <p className="rounded-md border border-border bg-muted/50 p-3">
              <strong className="text-foreground">
                Mouvement organique probable. Aucune manipulation retenue.
              </strong>{" "}
              L&apos;hypothèse de l&apos;engouement explique l&apos;intégralité
              du signal à un coût d&apos;hypothèse bien moindre, et elle
              s&apos;appuie sur un fait vérifiable et daté : la sortie du bloc
              Méga-Évolution. En l&apos;absence de tout indice
              supplémentaire — assèchement brutal de l&apos;offre, saut du
              premier prix, concentration de vendeurs — conclure à la
              manipulation relèverait de la spéculation.
            </p>
          </section>

          <section>
            <h3 className="mb-1 text-sm font-semibold text-foreground">
              Ce que ce cas a changé dans le moteur
            </h3>
            <p>
              L&apos;enquête a révélé un angle mort : le système savait
              détecter les vagues au sein d&apos;un même <em>set</em> (règle
              R5), mais il était aveugle aux vagues au sein d&apos;un même{" "}
              <em>personnage</em>. Il a fallu qu&apos;un humain lise les noms
              dans la liste pour voir la corrélation.
            </p>
            <p className="mt-2">
              D&apos;où une nouvelle règle,{" "}
              <strong className="text-foreground">
                R6 · Vague intra-personnage
              </strong>{" "}
              : plusieurs cartes du même Pokémon signalées le même jour, tous
              sets confondus. Sa particularité est d&apos;être une règle à
              double tranchant : elle peut révéler une coordination, mais elle
              peut aussi <em>innocenter</em> un mouvement en montrant
              qu&apos;il relève d&apos;un engouement de personnage. C&apos;est
              une règle de contexte autant que d&apos;alerte — née d&apos;un
              cas réel, pas d&apos;une intuition.
            </p>
          </section>

          <section>
            <h3 className="mb-1 text-sm font-semibold text-foreground">
              Limites de cette investigation
            </h3>
            <p className="rounded-md border border-dashed border-border p-3 text-xs">
              Notre collecte de prix a démarré le 10 juillet 2026 : nous
              n&apos;avons pas observé la hausse se construire, seulement sa
              phase finale. L&apos;historique antérieur provient de sources
              tierces, exprimées en dollars sur des places de marché
              nord-américaines, quand nos données sont en euros et proviennent
              du marché européen. Les deux marchés évoluent souvent de concert,
              mais pas systématiquement. Ce cas est donc une reconstruction
              partielle, pas une démonstration à partir de nos seules données.
              Nous le documentons ainsi plutôt que de laisser croire à une
              détection que nous n&apos;avons pas faite.
            </p>
          </section>
        </div>
      </Container>

      <Container className="py-6">
        <p className="text-sm text-muted-foreground">
          Les prochains cas seront ouverts au fil des alertes. Un cas
          n&apos;est publié que lorsqu&apos;il est instruit : signal, hypothèses
          concurrentes, preuves, verdict motivé, et limites.
        </p>
      </Container>
    </div>
  );
}
