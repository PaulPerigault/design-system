export interface Groups {
  /** Libellés distincts, dans l'ordre de première apparition. */
  readonly labels: readonly string[];
  /** Pour chaque groupe, les indices de ses points, dans l'ordre des données. */
  readonly members: readonly (readonly number[])[];
}

/** Regroupe les points qui portent le même libellé. */
export function groupByLabel(keys: readonly string[]): Groups {
  const position = new Map<string, number>();
  const labels: string[] = [];
  const members: number[][] = [];
  for (const [index, key] of keys.entries()) {
    const known = position.get(key);
    if (known === undefined) {
      position.set(key, labels.length);
      labels.push(key);
      members.push([index]);
    } else {
      members[known]?.push(index);
    }
  }
  return { labels, members };
}
