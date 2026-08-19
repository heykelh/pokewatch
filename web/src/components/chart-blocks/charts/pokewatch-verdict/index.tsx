import { fetchMarketVerdict } from "@/lib/pokewatch";
import Container from "@/components/container";

type VerdictStyle = {
  label: string;
  sub: string;
  bg: string;
  text: string;
  dot: string;
};

const VERDICT_CONFIG: { [key: string]: VerdictStyle } = {
  calme: {
    label: "Marché calme",
    sub: "Aucun mouvement notable détecté",
    bg: "bg-green-500/10 border-green-500/30",
    text: "text-green-600 dark:text-green-400",
    dot: "bg-green-500",
  },
  activite_normale: {
    label: "Activité normale",
    sub: "Le marché bouge comme d'habitude",
    bg: "bg-blue-500/10 border-blue-500/30",
    text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  attention: {
    label: "Activité inhabituelle",
    sub: "Plus de mouvements que d'ordinaire",
    bg: "bg-orange-500/10 border-orange-500/30",
    text: "text-orange-600 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  alerte: {
    label: "Activité anormale",
    sub: "Volume de signaux très supérieur à la normale",
    bg: "bg-red-500/10 border-red-500/30",
    text: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
  donnees_indisponibles: {
    label: "Données indisponibles",
    sub: "La source n'a pas publié ce jour",
    bg: "bg-muted border-border",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default async function PokewatchVerdict() {
  const v = await fetchMarketVerdict();
  const cfg = VERDICT_CONFIG[v.verdict] ?? VERDICT_CONFIG.activite_normale;

  const medianPct = v.medianReturn != null ? v.medianReturn * 100 : null;
  // Le marche derive structurellement de -1.2%/jour. On situe le jour par
  // rapport a cette derive, pas par rapport a zero.
  const vsDrift =
    medianPct != null ? medianPct - v.driftBaseline * 100 : null;

  const marketMood =
    vsDrift == null
      ? "indéterminé"
      : vsDrift > 0.5
        ? "plus porteur que d'habitude"
        : vsDrift < -0.5
          ? "plus faible que d'habitude"
          : "dans sa dérive habituelle";

  return (
    <Container className="border-b border-border py-6">
      <div className={`rounded-xl border p-5 ${cfg.bg}`}>
        <div className="flex items-center gap-3">
          <span className={`h-3 w-3 rounded-full ${cfg.dot} animate-pulse`} />
          <div>
            <div className={`text-lg font-semibold ${cfg.text}`}>
              {cfg.label}
            </div>
            <div className="text-sm text-muted-foreground">
              {v.date ? dateFormat.format(new Date(v.date)) : "—"} · {cfg.sub}
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 laptop:grid-cols-4">
          <div>
            <div className="text-2xl font-bold tabular-nums">
              {medianPct != null ? `${medianPct.toFixed(2)}%` : "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              Mouvement médian du marché
            </div>
            <div className="mt-1 text-xs font-medium">
              {marketMood}
            </div>
          </div>

          <div>
            <div className="text-2xl font-bold tabular-nums">
              {v.strongAnomalies}
            </div>
            <div className="text-xs text-muted-foreground">
              Signaux forts aujourd&apos;hui
            </div>
            <div className="mt-1 text-xs font-medium">
              {v.medianHabitual != null
                ? `habituellement ~${v.medianHabitual}`
                : ""}
            </div>
          </div>

          <div>
            <div className="text-2xl font-bold tabular-nums">
              {v.cardsAnalysed.toLocaleString("fr-FR")}
            </div>
            <div className="text-xs text-muted-foreground">
              Cartes ayant coté
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              sur {v.cardsScanned.toLocaleString("fr-FR")} scannées
            </div>
          </div>

          <div>
            <div className="text-2xl font-bold tabular-nums">
              {v.reliability != null ? `${v.reliability}%` : "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              Fiabilité des données
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              prix jugés cohérents
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-background/50 p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            Comment lire ce chiffre ?
          </span>{" "}
          Le prix de référence du marché s&apos;érode d&apos;environ 1,2 % par
          jour, alors que les transactions réelles montent. Un mouvement médian
          proche de −1,2 % est donc une journée <strong>ordinaire</strong>. Une
          carte n&apos;est intéressante que si elle s&apos;écarte nettement de
          ce mouvement d&apos;ensemble.
        </div>
      </div>
    </Container>
  );
}
