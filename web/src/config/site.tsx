import {
  AlertTriangle,
  BookOpenText,
  Gauge,
  type LucideIcon,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

export type SiteConfig = typeof siteConfig;
export type Navigation = {
  icon: LucideIcon;
  name: string;
  href: string;
};

export const siteConfig = {
  title: "PokéWatch — Surveillance de marché Pokémon TCG",
  description:
    "Détection de mouvements de prix anormaux sur le marché des cartes Pokémon. Règles déterministes, scores explicables, anomalies documentées.",
};

export const navigations: Navigation[] = [
  { icon: Gauge, name: "Dashboard", href: "/" },
  { icon: AlertTriangle, name: "Anomalies", href: "/anomalies" },
  { icon: ScrollText, name: "Investigations", href: "/investigations" },
  { icon: BookOpenText, name: "Méthodologie", href: "/methodologie" },
  { icon: ShieldCheck, name: "Gouvernance", href: "/gouvernance" },
];