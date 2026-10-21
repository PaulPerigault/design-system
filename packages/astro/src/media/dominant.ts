/** Canal sRGB 8 bits tel que renvoyé par `sharp().stats().dominant`. */
interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Sous-ensemble de `sharp` utilisé ici : permet d'injecter un faux en test. */
export type SharpFactory = (input: string | Uint8Array) => {
  stats(): Promise<{ dominant: Rgb }>;
};

export interface DominantDeps {
  /** Chargement de `sharp` (dépendance native, facultative à l'exécution). */
  load?: () => Promise<{ default: SharpFactory }>;
  /** Cache par chemin de fichier ; partagé par défaut entre les appels. */
  cache?: Map<string, Promise<string | undefined>>;
}

/** Valeur maximale d'un canal 8 bits. */
const CHANNEL_MAX = 255;
/** Base hexadécimale et nombre de chiffres par canal dans `#rrggbb`. */
const HEX_RADIX = 16;
const HEX_DIGITS = 2;

const sharedCache = new Map<string, Promise<string | undefined>>();
const loadSharp = (): Promise<{ default: SharpFactory }> => import('sharp');

const channel = (value: number): string =>
  Math.min(CHANNEL_MAX, Math.max(0, Math.round(value)))
    .toString(HEX_RADIX)
    .padStart(HEX_DIGITS, '0');

const toHex = ({ r, g, b }: Rgb): string => `#${channel(r)}${channel(g)}${channel(b)}`;

async function compute(
  input: string | Uint8Array,
  load: NonNullable<DominantDeps['load']>,
): Promise<string | undefined> {
  try {
    const { default: sharp } = await load();
    const { dominant } = await sharp(input).stats();
    return toHex(dominant);
  } catch {
    // `sharp` absent ou fichier illisible : le composant retombe sur
    // `--pp-color-media-placeholder`.
    return undefined;
  }
}

/**
 * Couleur dominante `#rrggbb` (minuscules) d'une image, pour le fond d'attente du composant.
 * Les chemins sont mis en cache ; un tampon mémoire est calculé à chaque appel.
 */
export function dominantColor(
  input: string | Uint8Array,
  deps: DominantDeps = {},
): Promise<string | undefined> {
  const { load = loadSharp, cache = sharedCache } = deps;
  if (typeof input !== 'string') return compute(input, load);
  const cached = cache.get(input);
  if (cached) return cached;
  const pending = compute(input, load);
  cache.set(input, pending);
  return pending;
}
