// Coordination entre processus du dispatcher (orchestrateur et ds-lead) par fichiers, dans le
// dossier partagé `.agents/` du dépôt principal :
// - sémaphore `slots/` : au plus `max` sessions Kiro simultanées (fichier `slots/max`, 5 par
//   défaut ; relevé à 6 après 30 min sans erreur de quota, redescendu d'un cran à chaque erreur) ;
// - verrou exclusif `locks/<nom>` (tâches locales lourdes : Playwright, build Astro, verify).
// Création atomique (`wx`), verrou orphelin (processus mort) libéré. FS et horloge injectés.

export const DEFAULT_MAX = 5;
export const CEILING = 6;
export const RAISE_AFTER_MS = 30 * 60 * 1000;
const POLL_MS = 2_000;

export interface LockFs {
  readFileSync: (file: string, encoding: 'utf8') => string;
  writeFileSync: (file: string, text: string, options?: { flag: string }) => void;
  mkdirSync: (dir: string, options: { recursive: boolean }) => unknown;
  rmSync: (file: string, options: { force: boolean }) => void;
}

export interface LockIo {
  fs: LockFs;
  now: () => number;
  pid: number;
  isAlive: (pid: number) => boolean;
  sleep: (ms: number) => Promise<unknown>;
}

function readNumber<F extends number | null>(fs: LockFs, file: string, fallback: F): number | F {
  try {
    const value = Number(fs.readFileSync(file, 'utf8').trim());
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  } catch {
    return fallback;
  }
}

/** Plafond courant, relevé d'un cran après RAISE_AFTER_MS sans erreur depuis le dernier changement. */
export function currentMax(io: LockIo, dir: string): number {
  const max = readNumber(io.fs, `${dir}/max`, DEFAULT_MAX);
  const since = readNumber(io.fs, `${dir}/changed-at`, null);
  if (since === null) io.fs.writeFileSync(`${dir}/changed-at`, String(io.now()));
  if (since === null || max >= CEILING || io.now() - since < RAISE_AFTER_MS) return max;
  io.fs.writeFileSync(`${dir}/max`, String(max + 1));
  io.fs.writeFileSync(`${dir}/changed-at`, String(io.now()));
  return max + 1;
}

/** Erreur de débit ou de quota : plafond abaissé d'un cran (au moins 1). */
export function lowerMax(io: LockIo, dir: string): number {
  const max = Math.max(1, readNumber(io.fs, `${dir}/max`, DEFAULT_MAX) - 1);
  io.fs.writeFileSync(`${dir}/max`, String(max));
  io.fs.writeFileSync(`${dir}/changed-at`, String(io.now()));
  return max;
}

const tryTakeOnce = (io: LockIo, file: string): boolean => {
  try {
    io.fs.writeFileSync(file, String(io.pid), { flag: 'wx' });
    return true;
  } catch {
    return false;
  }
};

/** Prend le fichier s'il est libre ou orphelin ; vrai si pris. */
export function tryTake(io: LockIo, file: string): boolean {
  if (tryTakeOnce(io, file)) return true;
  const owner = readNumber(io.fs, file, 0);
  if (owner && io.isAlive(owner)) return false;
  io.fs.rmSync(file, { force: true });
  return tryTakeOnce(io, file);
}

/** Attend une place du sémaphore ; renvoie la fonction qui la libère. */
export async function acquireSlot(io: LockIo, dir: string): Promise<() => void> {
  io.fs.mkdirSync(dir, { recursive: true });
  for (;;) {
    const max = currentMax(io, dir);
    for (let n = 1; n <= max; n += 1) {
      const file = `${dir}/slot-${n}`;
      if (tryTake(io, file)) return () => io.fs.rmSync(file, { force: true });
    }
    await io.sleep(POLL_MS);
  }
}

/** Attend le verrou exclusif `file` ; renvoie la fonction qui le libère. */
export async function acquireLock(io: LockIo, file: string): Promise<() => void> {
  io.fs.mkdirSync(file.slice(0, file.lastIndexOf('/')), { recursive: true });
  while (!tryTake(io, file)) await io.sleep(POLL_MS);
  return () => io.fs.rmSync(file, { force: true });
}

/** Commande d'acceptation lourde (une seule à la fois sur le poste). */
export const isHeavy = (command: string): boolean =>
  /\bplaywright\b|\bastro (?:build|check)\b|run (?:build|verify|e2e)\b|docs run build\b/.test(
    command,
  );
