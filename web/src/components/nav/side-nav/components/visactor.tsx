import Link from "next/link";

export default function VisActor() {
  return (
    <div className="relative my-2 flex flex-col items-center justify-center gap-y-2 px-4 py-4">
      <div className="dot-matrix absolute left-0 top-0 -z-10 h-full w-full" />
      <Link
        href="https://heykelhachiche.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-md text-accent-foreground hover:underline"
      >
        Portfolio
      </Link>
      <span className="text-center text-[10px] leading-tight text-muted-foreground">
        Autres projets Data/IA
      </span>
    </div>
  );
}