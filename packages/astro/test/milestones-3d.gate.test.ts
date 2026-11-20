import { describe, expect, it } from 'vitest';
import {
  blockedEarly,
  inFirstScreen,
  whenReady,
  type GateEnv,
} from '../src/behaviors/milestones-3d-gate';
import { page } from './milestones-3d-fixtures';

describe('blockedEarly', () => {
  const env = (reduce: boolean, saveData?: boolean) => ({
    matchMedia: () => ({ matches: reduce }),
    navigator: { connection: saveData === undefined ? undefined : { saveData } },
  });

  it('refuse le mouvement réduit puis l’économie de données', () => {
    expect(blockedEarly(env(true))).toBe('reduced-motion');
    expect(blockedEarly(env(false, true))).toBe('save-data');
  });

  it('admet une valeur absente ou fausse : l’absence n’est pas une mesure', () => {
    expect(blockedEarly(env(false))).toBeNull();
    expect(blockedEarly(env(false, false))).toBeNull();
  });
});

describe('inFirstScreen', () => {
  it('distingue le viewport de la seule marge d’observation', () => {
    expect(inFirstScreen({ top: 100, bottom: 400 }, 800)).toBe(true);
    expect(inFirstScreen({ top: 900, bottom: 1200 }, 800)).toBe(false);
    expect(inFirstScreen({ top: -300, bottom: 0 }, 800)).toBe(false);
  });
});

/** Plateforme d'attente factice : on déclenche l'entrée, le geste et l'inactivité à la main. */
function fakeGate(rect: { top: number; bottom: number }) {
  const calls = { gesture: () => undefined, idle: () => undefined, stopped: 0, listening: 0 };
  const env: GateEnv = {
    observe: (_target, onEntry) => {
      queueMicrotask(() => onEntry({ isIntersecting: true, ...rect }));
      return () => {
        calls.stopped += 1;
      };
    },
    viewportHeight: () => 800,
    onGesture: (callback) => {
      calls.gesture = callback as never;
      calls.listening += 1;
      return () => {
        calls.listening -= 1;
      };
    },
    onIdle: (callback) => {
      calls.idle = callback as never;
      return () => undefined;
    },
  };
  return { env, calls };
}

describe('whenReady', () => {
  it('résout aussitôt quand la section arrive de plus bas que le viewport', async () => {
    const { env, calls } = fakeGate({ top: 900, bottom: 1200 });
    await whenReady(page(), env);
    expect(calls.stopped).toBe(1);
    expect(calls.listening).toBe(0);
  });

  it('attend le premier geste quand la section est déjà à l’écran, puis retire les écouteurs', async () => {
    const { env, calls } = fakeGate({ top: 100, bottom: 400 });
    let ready = false;
    const pending = whenReady(page(), env).then(() => (ready = true));
    await new Promise((resolve) => setTimeout(resolve));
    expect(ready).toBe(false);
    calls.gesture();
    await pending;
    expect(calls.listening).toBe(0);
  });

  it('attend l’inactivité du navigateur à défaut de geste', async () => {
    const { env, calls } = fakeGate({ top: 100, bottom: 400 });
    const pending = whenReady(page(), env);
    await new Promise((resolve) => setTimeout(resolve));
    calls.idle();
    await expect(pending).resolves.toBeUndefined();
  });
});
