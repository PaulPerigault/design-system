import { describe, expect, it, vi } from 'vitest';
import { TEXTURE_MAX_PX } from '../src/constants.ts';
import { FakeObserver } from './support.ts';
import { badge, begin, settle } from './support-textures.ts';

describe('taille des textures', () => {
  it('une image plus grande que 512 px est redécodée réduite, qualité haute, l’original fermé', async () => {
    const { network, loaded } = await begin();
    network.size.width = 1024;
    network.size.height = 512;
    await loaded();
    network.pending[0]?.respond(true);
    await settle();
    expect(network.decodes).toHaveLength(2);
    expect(network.decodes[1]?.options).toMatchObject({
      resizeWidth: TEXTURE_MAX_PX,
      resizeHeight: TEXTURE_MAX_PX / 2,
      resizeQuality: 'high',
    });
    expect(network.bitmaps[0]?.closed).toBe(true);
    expect(network.bitmaps[1]?.closed).toBe(false);
  });

  it('dimensions déclarées : un seul décodage, déjà réduit', async () => {
    const big = { ...badge('a'), width: 2048, height: 1024 };
    const input = { milestones: [{ id: 'a', label: 'A', status: 'achieved', badge: big }] };
    const { network, loaded } = await begin({}, input);
    await loaded();
    network.pending[0]?.respond(true);
    await settle();
    expect(network.decodes).toHaveLength(1);
    expect(network.decodes[0]?.options).toMatchObject({ resizeWidth: 512, resizeHeight: 256 });
  });
});

describe('annulation', () => {
  it('destroy avant le temps libre : rien n’est demandé', async () => {
    const { h, handle, network } = await begin();
    h.runFrame();
    await settle();
    handle.destroy();
    expect(h.idles.size).toBe(0);
    h.runIdle();
    expect(network.pending).toHaveLength(0);
  });

  it('destroy en cours : requêtes annulées, file vidée, aucune erreur, idempotent', async () => {
    const onTextureError = vi.fn();
    const { h, handle, network, loaded } = await begin({ onTextureError });
    await loaded();
    handle.destroy();
    handle.destroy();
    expect(network.pending.map((p) => p.init.signal.aborted)).toEqual([true, true]);
    await settle();
    expect(network.pending).toHaveLength(2);
    expect(onTextureError).not.toHaveBeenCalled();
    expect(h.scene.textures.size).toBe(0);
  });

  it('un bitmap décodé après destroy est fermé, non transmis', async () => {
    const { network, handle, loaded } = await begin();
    await loaded();
    network.pending[0]?.respond(true);
    handle.destroy();
    await settle();
    expect(network.bitmaps.every((bitmap) => bitmap.closed)).toBe(true);
  });

  it('section jamais visible : aucun badge n’est demandé', async () => {
    const { h, network } = await begin();
    FakeObserver.all.at(2)?.fire([{ isIntersecting: false }]);
    expect(h.runFrame()).toBe(false);
    await settle();
    expect(h.idles.size).toBe(0);
    expect(network.pending).toHaveLength(0);
  });
});
