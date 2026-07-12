import { Info } from "lucide-react";
import Container from "./container";

export default function StatusBanner() {
  return (
    <Container className="border-b border-border bg-amber-500/5 py-3">
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" size={16} />
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">
            Phase d&apos;accumulation de données.
          </strong>{" "}
          Le moteur fonctionne en mode dégradé assumé : une règle est
          suspendue et deux sont en signal faible, à la suite d&apos;un
          diagnostic sur la fiabilité des données sources. Sa pleine
          puissance requiert 30 jours d&apos;historique propre, en cours de
          constitution.{" "}
          <a href="/methodologie" className="underline hover:no-underline">
            Voir le détail et le calendrier
          </a>
        </p>
      </div>
    </Container>
  );
}