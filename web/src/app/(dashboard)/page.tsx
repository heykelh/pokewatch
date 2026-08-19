import PokewatchActivity from "@/components/chart-blocks/charts/pokewatch-activity";
import PokewatchDrift from "@/components/chart-blocks/charts/pokewatch-drift";
import PokewatchMarket from "@/components/chart-blocks/charts/pokewatch-market";
import PokewatchMetrics from "@/components/chart-blocks/charts/pokewatch-metrics";
import PokewatchPipeline from "@/components/chart-blocks/charts/pokewatch-pipeline";
import PokewatchReport from "@/components/chart-blocks/charts/pokewatch-report";
import Container from "@/components/container";
import StatusBanner from "@/components/status-banner";
import PokewatchVerdict from "@/components/chart-blocks/charts/pokewatch-verdict";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div>
      <StatusBanner />
      <PokewatchVerdict />
      <PokewatchReport />
      <PokewatchMetrics />

      {/* Rangée historique : dérive du marché + activité de détection */}
      <div className="grid grid-cols-1 divide-y border-b border-border laptop:grid-cols-2 laptop:divide-x laptop:divide-y-0 laptop:divide-border">
        <Container className="py-4 laptop:col-span-1">
          <PokewatchDrift />
        </Container>
        <Container className="py-4 laptop:col-span-1">
          <PokewatchActivity />
        </Container>
      </div>

      {/* Rangée existante : scan large + pipeline */}
      <div className="grid grid-cols-1 divide-y border-b border-border laptop:grid-cols-2 laptop:divide-x laptop:divide-y-0 laptop:divide-border">
        <Container className="py-4 laptop:col-span-1">
          <PokewatchMarket />
        </Container>
        <Container className="py-4 laptop:col-span-1">
          <PokewatchPipeline />
        </Container>
      </div>
    </div>
  );
}
