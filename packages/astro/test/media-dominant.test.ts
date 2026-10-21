import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import { dominantColor } from '../src/media/dominant';
import type { DominantDeps, SharpFactory } from '../src/media/dominant';

const fake = (dominant: { r: number; g: number; b: number }): SharpFactory =>
  vi.fn(() => ({ stats: () => Promise.resolve({ dominant }) }));

const deps = (factory: SharpFactory): Required<DominantDeps> => ({
  load: vi.fn(() => Promise.resolve({ default: factory })),
  cache: new Map(),
});

describe('dominantColor : faux sharp', () => {
  it('formate la dominante en #rrggbb minuscules', async () => {
    const color = await dominantColor('/img/a.jpg', deps(fake({ r: 10, g: 171, b: 255 })));
    expect(color).toBe('#0aabff');
  });

  it('borne et arrondit les canaux hors plage', async () => {
    const color = await dominantColor('/img/b.jpg', deps(fake({ r: -3, g: 127.6, b: 300 })));
    expect(color).toBe('#0080ff');
  });

  it('transmet l’entrée telle quelle à sharp', async () => {
    const factory = fake({ r: 0, g: 0, b: 0 });
    const buffer = new Uint8Array([1, 2, 3]);
    await dominantColor(buffer, deps(factory));
    expect(factory).toHaveBeenCalledWith(buffer);
  });
});

describe('dominantColor : échecs', () => {
  it('rend undefined si sharp est absent', async () => {
    const missing = {
      load: () => Promise.reject(new Error('Cannot find module')),
      cache: new Map(),
    };
    await expect(dominantColor('/img/c.jpg', missing)).resolves.toBeUndefined();
  });

  it('rend undefined si sharp lève (fichier illisible)', async () => {
    const throwing: SharpFactory = () => {
      throw new Error('Input file is missing');
    };
    const rejecting: SharpFactory = () => ({
      stats: () => Promise.reject(new Error('unsupported image format')),
    });
    await expect(dominantColor('/img/d.jpg', deps(throwing))).resolves.toBeUndefined();
    await expect(dominantColor('/img/e.jpg', deps(rejecting))).resolves.toBeUndefined();
  });
});

describe('dominantColor : cache par chemin', () => {
  it('ne charge sharp qu’une fois pour un même chemin', async () => {
    const injected = deps(fake({ r: 1, g: 2, b: 3 }));
    const [first, second] = await Promise.all([
      dominantColor('/img/f.jpg', injected),
      dominantColor('/img/f.jpg', injected),
    ]);
    expect(await dominantColor('/img/f.jpg', injected)).toBe('#010203');
    expect([first, second]).toEqual(['#010203', '#010203']);
    expect(injected.load).toHaveBeenCalledTimes(1);
  });

  it('distingue les chemins et ne met pas en cache les tampons', async () => {
    const injected = deps(fake({ r: 1, g: 2, b: 3 }));
    await dominantColor('/img/g.jpg', injected);
    await dominantColor('/img/h.jpg', injected);
    const buffer = new Uint8Array([0]);
    await dominantColor(buffer, injected);
    await dominantColor(buffer, injected);
    expect(injected.load).toHaveBeenCalledTimes(4);
    expect([...injected.cache.keys()]).toEqual(['/img/g.jpg', '/img/h.jpg']);
  });
});

describe('dominantColor : vrai sharp', () => {
  it('trouve la couleur d’un aplat créé en mémoire', async () => {
    // Centres de cases de l'histogramme 16 × 16 × 16 de sharp : valeur restituée à l'identique.
    const background = { r: 24, g: 72, b: 200 };
    const png = await sharp({ create: { width: 8, height: 8, channels: 3, background } })
      .png()
      .toBuffer();
    await expect(dominantColor(png)).resolves.toBe('#1848c8');
  });

  it('rend undefined pour un tampon qui n’est pas une image', async () => {
    await expect(dominantColor(new Uint8Array([1, 2, 3]))).resolves.toBeUndefined();
  });
});
