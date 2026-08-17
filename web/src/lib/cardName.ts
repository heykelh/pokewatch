type CardParts = {
  name: string | null;
  set_name?: string | null;
  card_number?: string | null;
};

/**
 * Nom lisible d'une carte.
 * "Feraligatr [Hydro Splash]" + "Pitch Black" + "087"
 *   -> "Feraligatr · Pitch Black 087"
 * Retombe proprement sur ce qui est disponible.
 */
export function displayCardName(c: CardParts): string {
  // Nom du Pokemon : on coupe la partie technique entre crochets
  const base = (c.name ?? "").split(" [")[0].trim() || "Carte inconnue";

  if (c.set_name && c.card_number) {
    return `${base} · ${c.set_name} ${c.card_number}`;
  }
  if (c.set_name) {
    return `${base} · ${c.set_name}`;
  }
  return base;
}
