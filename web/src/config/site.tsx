import {
  AlertTriangle,
  BookOpenText,
  CalendarClock,
  Gauge,
  type LucideIcon,
  Newspaper,
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
  { icon: Newspaper, name: "Bilans", href: "/bilans" },
  { icon: AlertTriangle, name: "Anomalies", href: "/anomalies" },
  { icon: CalendarClock, name: "Événements", href: "/evenements" },
  { icon: ScrollText, name: "Investigations", href: "/investigations" },
  { icon: BookOpenText, name: "Méthodologie", href: "/methodologie" },
  { icon: ShieldCheck, name: "Gouvernance", href: "/gouvernance" },
];