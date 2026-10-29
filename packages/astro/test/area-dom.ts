/** Tracé (`d`) du fond (`area`) ou du contour (`line`) de la couche de rang `rank`, 1 pour la première. */
export const layer = (document: Document, rank: number, part: 'area' | 'line'): string =>
  document
    .querySelector(`figure > svg > g[data-series="${rank}"] > path.pp-area-chart__${part}`)
    ?.getAttribute('d') ?? '';

/** Nombre de points d'un chemin `M x y l dx dy …` : deux nombres par point. */
export const pointCount = (d: string): number => (d.match(/-?\d*\.?\d+/g) ?? []).length / 2;
