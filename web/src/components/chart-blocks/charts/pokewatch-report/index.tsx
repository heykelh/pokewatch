import Container from "@/components/container";
import { fetchLatestReport } from "@/lib/pokewatch";

const VERDICT_STYLES: Record<string, { label: string; className: string }> = {
  calme: {
    label: "Marché calme",
    className: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  signaux_faibles: {
    label: "Signaux faibles",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  attention: {
    label: "Attention",
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  alerte: {
    label: "Alerte",
    className: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  donnees_indisponibles: {
    label: "Données indisponibles",
    className: "bg-muted text-muted-foreground",
  },
};

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default async function PokewatchReport() {
  const report = await fetchLatestReport();

  if (!report) {
    return (
      <Container className="border-b border-border py-6">
        <p className="text-sm text-muted-foreground">
          Aucun bilan disponible pour le moment.
        </p>
      </Container>
    );
  }

  const verdict =
    VERDICT_STYLES[report.verdict] ?? VERDICT_STYLES.donnees_indisponibles;

  return (
    <Container className="border-b border-border py-6">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-md px-2 py-1 text-xs font-medium ${verdict.className}`}
        >
          {verdict.label}
        </span>
        <span className="text-xs text-muted-foreground">
          {dateFormat.format(new Date(report.report_date))}
        </span>
      </div>
      <h2 className="mb-3 text-xl font-semibold laptop:text-2xl">
        {report.headline}
      </h2>
      <div className="max-w-3xl space-y-3">
        {report.body.split("\n").filter(Boolean).map((para, i) => (
          <p key={i} className="text-sm text-muted-foreground">
            {para}
          </p>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Bilan rédigé automatiquement à partir des données du jour. Tous les
        chiffres cités sont vérifiés contre la base : aucun n&apos;est inventé.{" "}
        <a href="/bilans" className="underline hover:no-underline">
          Voir les bilans précédents
        </a>
      </p>
    </Container>
  );
}