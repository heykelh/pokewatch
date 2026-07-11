export function PokewatchLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="PokéWatch"
    >
      {/* œil : la surveillance */}
      <path
        d="M2 16C2 16 7 7 16 7C25 7 30 16 30 16C30 16 25 25 16 25C7 25 2 16 2 16Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Poké Ball comme pupille */}
      <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="2" />
      <path d="M10 16H22" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="16" r="2.5" fill="currentColor" />
    </svg>
  );
}