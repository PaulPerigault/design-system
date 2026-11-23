import { describe, expect, it } from 'vitest';
import { DPR_MAX_DEFAULT } from '../src/constants.ts';
import { FakeObserver } from './support.ts';
import { start } from './instance-setup.ts';

describe('création', () => {
  it('passe les colonnes validées et le thème (34 nombres) à la scène', async () => {
    const { h } = await start({ activeId: 'b' });
    expect(h.created).toHaveLength(1);
    expect(h.created[0]).toMatchObject({
      ids: ['a', 'b'],
      statuses: ['achieved', 'planned'],
      badges: Uint8Array.of(0, 0),
      goal: true,
      active: 'b',
    });
    expect(h.created[0]?.theme).toHaveLength(34);
  });

  it('applique la taille avec un rapport de pixels plafonné à 2 par défaut', async () => {
    const { h } = await start();
    expect(h.scene.calls).toContain(`resize:${400 * DPR_MAX_DEFAULT}x${200 * DPR_MAX_DEFAULT}`);
    const custom = await start({ dprMax: 1 });
    expect(custom.h.scene.calls).toContain('resize:400x200');
  });

  it('ne renvoie pas à la scène une taille déjà appliquée (le tampon WebGL se réalloue)', async () => {
    const { h } = await start();
    const resizes = (): number => h.scene.calls.filter((c) => c.startsWith('resize:')).length;
    expect(resizes()).toBe(1);
    FakeObserver.all.at(0)?.fire([{ contentRect: { width: 400, height: 200 } }]);
    expect(resizes()).toBe(1);
    FakeObserver.all.at(0)?.fire([{ contentRect: { width: 300, height: 200 } }]);
    expect(resizes()).toBe(2);
  });

  it('fait précéder le premier rendu d’une image d’attente (redimensionnement du composant hôte)', async () => {
    const { h } = await start();
    const play = (): void => {
      const [id, callback] = [...h.frames][0] ?? [];
      if (id === undefined || !callback) return;
      h.frames.delete(id);
      callback(h.clock);
    };
    play();
    expect(h.scene.calls.some((c) => c.startsWith('frame:'))).toBe(false);
    expect(h.frames.size).toBe(1);
    play();
    expect(h.scene.calls.filter((c) => c.startsWith('frame:'))).toEqual(['frame:0']);
  });

  it('rend à la demande : une image, puis plus rien tant que la scène n’en veut plus', async () => {
    const { h } = await start();
    expect(h.runFrame()).toBe(true);
    expect(h.runFrame()).toBe(false);
    expect(h.scene.calls.filter((c) => c.startsWith('frame:'))).toEqual(['frame:0']);
  });

  it('continue tant que la scène demande une autre image', async () => {
    const { h } = await start({}, (x) => (x.scene.moreFrames = true));
    h.runFrame();
    expect(h.runFrame()).toBe(true);
    h.scene.moreFrames = false;
    h.runFrame();
    expect(h.runFrame()).toBe(false);
  });
});

describe('pause : hors écran et onglet masqué', () => {
  it('hors écran : aucune image ; de retour : une image', async () => {
    const { h } = await start();
    const io = FakeObserver.all.at(2);
    io?.fire([{ isIntersecting: false }]);
    expect(h.frames.size).toBe(0);
    io?.fire([{ isIntersecting: true }]);
    expect(h.frames.size).toBe(1);
  });

  it('onglet masqué : aucune image ; réaffiché : une image', async () => {
    const { h } = await start();
    h.visible = false;
    h.document.emit('visibilitychange');
    expect(h.frames.size).toBe(0);
    h.visible = true;
    h.document.emit('visibilitychange');
    expect(h.frames.size).toBe(1);
  });
});
