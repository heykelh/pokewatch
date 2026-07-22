import Container from "@/components/container";
import { fetchReportArchive } from "@/lib/pokewatch";
import { VERDICT_STYLES } from "@/lib/verdicts";


const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const dynamic = "force-dynamic";

export default async function BilansPage() {
  const reports = await fetchReportArchive(60);

  return (
    <div>
      <Container className="border-b border-border py-4">
        <h1 className="text-lg font-semibold">Bilans quotidiens</h1>
        <p className="text-sm text-muted-foreground">
          Chaque matin, le système rend compte de ce qu&apos;il a observé. Les
          bilans sont rédigés automatiquement à partir des données du jour, et
          chaque chiffre cité est vérifié contre la base avant publication : un
          bilan contenant un chiffre inventé est rejeté et n&apos;est jamais
          publié.
        </p>
      </Container>

      {reports.length === 0 ? (
        <Container className="py-8">
          <p className="text-center text-sm text-muted-foreground">
            Aucun bilan pour le moment.
          </p>
        </Container>
      ) : (
        reports.map((report) => {
          const verdict =
            VERDICT_STYLES[report.verdict] ??
            VERDICT_STYLES.donnees_indisponibles;
          return (
            <Container
              key={report.report_date}
              className="border-b border-border py-6"
            >
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
              <h2 className="mb-2 text-lg font-semibold">{report.headline}</h2>
              <div className="max-w-3xl space-y-2">
                {report.body
                  .split("\n")
                  .filter(Boolean)
                  .map((para, i) => (
                    <p key={i} className="text-sm text-muted-foreground">
                      {para}
                    </p>
                  ))}
              </div>
            </Container>
          );
        })
      )}
    </div>
  );
}
