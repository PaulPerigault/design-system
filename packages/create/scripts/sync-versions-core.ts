// Aligne les versions `@paulperigault/*` du gabarit sur celles des paquets du dépôt (#236, D-129).
// Pur : les versions viennent d'une fonction injectée, rien n'est lu ici.
const SCOPE = '@paulperigault/';

export type VersionTable = Record<string, string>;

export interface Synced {
  next: VersionTable;
  changed: string[];
}

/** Remplace chaque entrée `@paulperigault/*` par la version courante du paquet du dépôt. */
export function syncVersions(
  current: VersionTable,
  versionOf: (name: string) => string | undefined,
): Synced {
  const next: VersionTable = { ...current };
  const changed: string[] = [];
  for (const name of Object.keys(current).filter((key) => key.startsWith(SCOPE))) {
    const version = versionOf(name);
    if (version === undefined) throw new Error(`sync-versions : paquet introuvable : ${name}`);
    if (version !== current[name]) changed.push(name);
    next[name] = version;
  }
  return { next, changed };
}
