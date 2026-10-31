// Contrat d'erreur du paquet construit : codes littéraux, jamais de panic ni de texte brut, et
// écarts documentés avec la référence TypeScript (README, « Écarts de contrat »).
import { relativeLuminance as referenceLuminance } from '@paulperigault/tokens/contrast';
import { beforeAll, expect, it } from 'vitest';
import { loadBuilt, whenBuilt } from './support.ts';
import type { Api } from './support.ts';

whenBuilt('contrat d’erreur', () => {
  let api: Api;
  beforeAll(async () => {
    api = await loadBuilt();
  });

  // `dist/` a sa propre classe : l'`instanceof` se fait avec celle du paquet construit.
  const failure = (call: () => unknown): InstanceType<Api['ColorError']> => {
    try {
      call();
    } catch (error) {
      if (error instanceof api.ColorError) return error;
      throw error;
    }
    throw new Error('aucune erreur levée');
  };

  it('refuse une valeur non finie, avec la grandeur fautive', () => {
    const error = failure(() => api.oklchToSrgb({ l: Number.NaN, c: 0.1, h: 30 }));
    expect([error.code, error.component]).toEqual(['non-finite', 'lightness']);
    expect(failure(() => api.fitToGamut({ l: 0.5, c: 0.1, h: Infinity })).component).toBe('hue');
  });

  it('refuse une valeur finie hors plage', () => {
    expect(failure(() => api.toHex({ l: 1.5, c: 0, h: 0 })).code).toBe('out-of-range');
    expect(failure(() => api.inSrgbGamut({ l: 0.5, c: -1, h: 0 })).component).toBe('chroma');
    expect(failure(() => api.inSrgbGamut({ l: 0.5, c: 0, h: 0 }, -1)).component).toBe('epsilon');
  });

  it('refuse un texte qui n’est pas #rrggbb, oklch(…) compris', () => {
    for (const text of ['#12', 'rouge', '#gggggg', 'oklch(0.5 0.1 30)']) {
      expect(failure(() => api.hexToOklch(text)).code, text).toBe('invalid-hex');
      expect(failure(() => api.contrastRatio(text, '#ffffff')).code, text).toBe('invalid-hex');
    }
  });

  it('écart : un canal sRGB hors [0, 1] est refusé ici, la référence rend un nombre', () => {
    const outside = { r: -0.1, g: 0.5, b: 0.5 };
    expect(failure(() => api.relativeLuminance(outside))).toMatchObject({
      code: 'out-of-range',
      component: 'red',
    });
    expect(Number.isFinite(referenceLuminance(outside))).toBe(true);
    expect(failure(() => api.relativeLuminance({ r: 1.2, g: 0, b: 0 })).component).toBe('red');
  });

  it('init() est idempotent', async () => {
    await expect(Promise.all([api.init(), api.init()])).resolves.toBeDefined();
    expect(api.isReady()).toBe(true);
  });
});
