import Container from "@/components/container";
import { fetchLatestReport } from "@/lib/pokewatch";
import { VERDICT_STYLES } from "@/lib/verdicts";


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
