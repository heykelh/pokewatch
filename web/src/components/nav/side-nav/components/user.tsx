import { PokewatchLogo } from "@/components/pokewatch-logo";

export default function User() {
  return (
    <div className="flex h-16 items-center border-b border-border px-2">
      <div className="flex w-full items-center gap-3 rounded-md px-2 py-1">
        <PokewatchLogo className="h-9 w-9 text-primary" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight">
            PokéWatch
          </span>
          <span className="text-xs text-muted-foreground">
            Surveillance de marché
          </span>
        </div>
      </div>
    </div>
  );
}