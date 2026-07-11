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