/**
 * Matrice d'appareils de L12 (docs/benchmark/gap.md) : téléphones en portrait et paysage,
 * tablette, ordinateurs, et le plus petit téléphone avec mouvement réduit. Chaque entrée devient
 * un projet Playwright `matrice-<nom>` qui exécute `e2e/matrix/`.
 */
export interface MatrixDevice {
  name: string;
  width: number;
  height: number;
  /** Téléphone ou tablette : contexte mobile, tactile, densité 3 (2 pour la tablette). */
  touch: boolean;
  reducedMotion?: boolean;
}

const PHONES = [
  { name: '360x800', width: 360, height: 800 }, // Android d'entrée de gamme
  { name: '375x667', width: 375, height: 667 }, // iPhone SE
  { name: '393x852', width: 393, height: 852 },
  { name: '430x932', width: 430, height: 932 },
];

export const MATRIX: readonly MatrixDevice[] = [
  ...PHONES.map((phone) => ({ ...phone, touch: true })),
  ...PHONES.map(({ name, width, height }) => ({
    name: `${name}-paysage`,
    width: height,
    height: width,
    touch: true,
  })),
  { name: 'tablette-820x1180', width: 820, height: 1180, touch: true },
  { name: 'bureau-1280x800', width: 1280, height: 800, touch: false },
  { name: 'bureau-1440x900', width: 1440, height: 900, touch: false },
  { name: 'bureau-1920x1080', width: 1920, height: 1080, touch: false },
  { name: '360x800-mouvement-reduit', width: 360, height: 800, touch: true, reducedMotion: true },
];

/** Options de contexte Playwright d'un appareil de la matrice. */
export function contextOf(device: MatrixDevice) {
  const tablet = device.width >= 800 && device.touch;
  return {
    viewport: { width: device.width, height: device.height },
    isMobile: device.touch,
    hasTouch: device.touch,
    deviceScaleFactor: device.touch ? (tablet ? 2 : 3) : 1,
    reducedMotion: device.reducedMotion ? ('reduce' as const) : ('no-preference' as const),
  };
}
