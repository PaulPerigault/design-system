/** Entrée de dossier : ce que les contrôles lisent d'un `Dirent`. */
export interface DirEntry {
  name: string;
  isDirectory: () => boolean;
}

export interface GuardIo {
  readText: (path: string) => string;
  readBytes: (path: string) => Uint8Array;
  readdir: (dir: string) => DirEntry[];
  size: (path: string) => number;
  exists: (path: string) => boolean;
  out: (message: string) => void;
  err: (message: string) => void;
}
