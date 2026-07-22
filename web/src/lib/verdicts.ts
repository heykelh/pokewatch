type VerdictStyle = {
  label: string;
  className: string;
};

export const VERDICT_STYLES: { [key: string]: VerdictStyle } = {
  calme: {
    label: "Marché calme",
    className: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  activite_normale: {
    label: "Activité normale",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  signaux_faibles: {
    label: "Signaux faibles",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  attention: {
    label: "Activité inhabituelle",
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  alerte: {
    label: "Activité anormale",
    className: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  donnees_indisponibles: {
    label: "Données indisponibles",
    className: "bg-muted text-muted-foreground",
  },
};
