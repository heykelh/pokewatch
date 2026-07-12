import PokewatchAnomalies from "@/components/chart-blocks/charts/pokewatch-anomalies";
import PokewatchMetrics from "@/components/chart-blocks/charts/pokewatch-metrics";
import PokewatchPipeline from "@/components/chart-blocks/charts/pokewatch-pipeline";
import PokewatchRules from "@/components/chart-blocks/charts/pokewatch-rules";
import PokewatchSets from "@/components/chart-blocks/charts/pokewatch-sets";
import Container from "@/components/container";
import StatusBanner from "@/components/status-banner";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div>
      <StatusBanner />
      <PokewatchMetrics />
      <div className="grid grid-cols-1 divide-y border-b border-border laptop:grid-cols-3 laptop:divide-x laptop:divide-y-0 laptop:divide-border">
        <Container className="py-4 laptop:col-span-2">
          <PokewatchAnomalies />
        </Container>
        <Container className="py-4 laptop:col-span-1">
          <PokewatchRules />
        </Container>
      </div>
      <div className="grid grid-cols-1 divide-y border-b border-border laptop:grid-cols-2 laptop:divide-x laptop:divide-y-0 laptop:divide-border">
        <Container className="py-4 laptop:col-span-1">
          <PokewatchSets />
        </Container>
        <Container className="py-4 laptop:col-span-1">
          <PokewatchPipeline />
        </Container>
      </div>
    </div>
  );
}