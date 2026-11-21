import { describe, expect, it, vi } from 'vitest';
import { TEXTURE_CONCURRENCY } from '../src/constants.ts';
import { begin, settle } from './support-textures.ts';

describe('chargement différé', () => {
  it('rien avant la première image, puis au temps libre ; deux à la fois au plus', async () => {
    const { h, network, loaded } = await begin();
    await settle();
    expect(h.idles.size).toBe(0);
    expect(network.pending).toHaveLength(0);
    await loaded();
    expect(network.pending.map((p) => p.url)).toEqual(['/badges/a.webp', '/badges/b.webp']);
    expect(network.pending[0]?.init).toMatchObject({
      credentials: 'same-origin',
      mode: 'same-origin',
    });
  });

  it('succès : décodage sans retouche, scène alimentée, une image par badge, concurrence <= 2', async () => {
    const { h, network, loaded } = await begin();
    await loaded();
    network.pending[0]?.respond(true);
    network.pending[1]?.respond(true);
    await settle();
    expect(network.pending).toHaveLength(3);
    network.pending[2]?.respond(true);
    await settle();
    expect(h.scene.calls.filter((c) => c.startsWith('texture:'))).toEqual([
      'texture:a',
      'texture:b',
      'texture:c',
    ]);
    expect(network.decodes[0]?.options).toMatchObject({
      premultiplyAlpha: 'premultiply',
      colorSpaceConversion: 'none',
      imageOrientation: 'none',
    });
    expect(network.peak).toBeLessThanOrEqual(TEXTURE_CONCURRENCY);
    expect(h.frames.size).toBe(1);
    expect(network.bitmaps.every((bitmap) => !bitmap.closed)).toBe(true);
  });

  it('un 404, un rejet réseau et une image invalide : onTextureError, la scène continue', async () => {
    const onTextureError = vi.fn();
    const { h, network, loaded } = await begin({ onTextureError });
    network.size.failDecode = true;
    await loaded();
    network.pending[0]?.respond(false);
    network.pending[1]?.fail(new Error('réseau'));
    await settle();
    network.pending[2]?.respond(true);
    await settle();
    expect(onTextureError.mock.calls).toEqual([['a'], ['b'], ['c']]);
    expect(h.scene.textures.size).toBe(0);
    expect(h.scene.calls.at(-1)).not.toBe('destroy');
  });

  it('taille nulle : erreur et bitmap fermé', async () => {
    const onTextureError = vi.fn();
    const { network, loaded } = await begin({ onTextureError });
    network.size.width = 0;
    await loaded();
    network.pending[0]?.respond(true);
    await settle();
    expect(onTextureError).toHaveBeenCalledWith('a');
    expect(network.bitmaps[0]?.closed).toBe(true);
  });

  it('refus de la scène : le bitmap non transmis est fermé', async () => {
    const onTextureError = vi.fn();
    const { h, network, loaded } = await begin({ onTextureError });
    await loaded();
    h.scene.failNext = 'unknown-id';
    network.pending[0]?.respond(true);
    await settle();
    expect(onTextureError).toHaveBeenCalledWith('a');
    expect(network.bitmaps[0]?.closed).toBe(true);
  });
});
