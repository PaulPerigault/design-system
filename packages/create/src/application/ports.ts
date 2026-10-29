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
