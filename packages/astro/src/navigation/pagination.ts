/** Écart entre deux numéros affichés qui ne cache qu'une seule page : on l'affiche. */
const SINGLE_HIDDEN_GAP = 2;

/**
 * Numéros de page à afficher, avec `null` pour une ellipsis. Garde toujours la première page, la
 * dernière et `around` pages de chaque côté de la page courante. Une ellipsis ne remplace jamais
 * une page unique. Renvoie `[]` si `total` n'est pas un entier ≥ 1. `current` est borné à [1, total].
 */
export function pageWindow(total: number, current: number, around = 1): (number | null)[] {
  if (!Number.isInteger(total) || total < 1) return [];
  const spread = Math.max(0, Math.floor(around));
  const here = Math.min(Math.max(Math.round(current), 1), total);
  const kept = new Set<number>([1, total]);
  for (let page = here - spread; page <= here + spread; page += 1) {
    if (page >= 1 && page <= total) kept.add(page);
  }
  const sorted = [...kept].sort((a, b) => a - b);
  return sorted.flatMap((page, index) => {
    const gap = index === 0 ? 0 : page - (sorted[index - 1] ?? page);
    if (gap === SINGLE_HIDDEN_GAP) return [page - 1, page];
    return gap > SINGLE_HIDDEN_GAP ? [null, page] : [page];
  });
}
