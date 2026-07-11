"use client";

import { PokewatchLogo } from "../pokewatch-logo";
import Container from "../container";
import { ThemeToggle } from "../theme-toggle";

export default function TopNav({ title }: { title: string }) {
  return (
    <Container className="flex h-16 items-center justify-between border-b border-border">
      <div className="flex items-center gap-3">
        <PokewatchLogo className="h-7 w-7 text-primary" />
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-semibold tracking-tight">
            Poké<span className="text-primary">Watch</span>
          </span>
          <span className="hidden text-sm text-muted-foreground laptop:inline">
            / {title}
          </span>
        </div>
      </div>
      <ThemeToggle />
    </Container>
  );
}