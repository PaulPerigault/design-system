// Ports de `create` : ce que les cas d'usage demandent à l'extérieur (système de fichiers, sorties).

export interface DirEntry {
  name: string;
  isDirectory: () => boolean;
}

export interface CreateIo {
  /** Absolu, séparateurs `/`, lettre de lecteur admise. */
  cwd: string;
  readText: (path: string) => string;
  /** Crée les dossiers parents. */
  writeText: (path: string, text: string) => void;
  exists: (path: string) => boolean;
  readdir: (dir: string) => DirEntry[];
  out: (message: string) => void;
  err: (message: string) => void;
}

/** Teinte d'accent (degrés OKLCH, texte) et pile de police demandées pour le site généré. */
export interface ThemeRequest {
  accentHue?: string | undefined;
  fontStack?: string | undefined;
}

export type ThemeResult = { ok: true; css: string } | { ok: false; code: string; message: string };

/** Dérivation du thème (adaptateur sur le code compilé de `tokens`, embarqué dans `dist/`). */
export type ThemeBuilder = (request: ThemeRequest) => ThemeResult;
