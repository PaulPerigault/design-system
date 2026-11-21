// Faux fetch et faux createImageBitmap commandés à la main : chaque appel reste en attente
// jusqu'à ce que le test le résolve, ce qui rend la concurrence et l'annulation observables.
import type { Env, FetchInit } from '../src/env.ts';
import { createInstance } from '../src/init.ts';
import type { InitOptions } from '../src/options.ts';
import { theme } from './instance-setup.ts';
import { createHarness } from './support.ts';

export interface Pending {
  readonly url: string;
  readonly init: FetchInit;
  /** Réponse HTTP : `ok` faux pour un 404. */
  respond(ok: boolean): void;
  fail(error: Error): void;
}

export interface FakeBitmap extends ImageBitmap {
  closed: boolean;
}

export function createFakeNetwork() {
  const pending: Pending[] = [];
  const decodes: { blob: Blob; options: ImageBitmapOptions }[] = [];
  const bitmaps: FakeBitmap[] = [];
  let inFlight = 0;
  let peak = 0;
  /** Dimensions rendues par `createImageBitmap` pour l'image source. */
  const size = { width: 128, height: 64, failDecode: false };
  const network = {
    pending,
    decodes,
    bitmaps,
    size,
    get peak() {
      return peak;
    },
    env: {
      fetch(url, init) {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        return new Promise((resolve, reject) => {
          let open = true;
          const done = (): void => {
            if (open) inFlight -= 1;
            open = false;
          };
          init.signal.addEventListener('abort', () => (done(), reject(new Error('annulé'))));
          pending.push({
            url,
            init,
            respond: (ok) => (done(), resolve({ ok, blob: async () => new Blob([url]) })),
            fail: (error) => (done(), reject(error)),
          });
        });
      },
      async createImageBitmap(blob, options) {
        if (size.failDecode) throw new Error('image invalide');
        decodes.push({ blob, options });
        const bitmap: FakeBitmap = {
          width: options.resizeWidth ?? size.width,
          height: options.resizeHeight ?? size.height,
          closed: false,
          close() {
            bitmap.closed = true;
          },
        };
        bitmaps.push(bitmap);
        return bitmap;
      },
    } satisfies Pick<Env, 'fetch' | 'createImageBitmap'>,
  };
  return network;
}

/** Laisse les promesses en attente se résoudre (microtâches). */
export const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

export const badge = (name: string) => ({ src: `/badges/${name}.webp` });
export const data = {
  milestones: [
    { id: 'a', label: 'A', status: 'achieved', badge: badge('a') },
    { id: 'b', label: 'B', status: 'achieved', badge: badge('b') },
    { id: 'c', label: 'C', status: 'achieved', badge: badge('c') },
    { id: 'd', label: 'D', status: 'planned' },
  ],
  goal: { label: 'But' },
};

export async function begin(options: InitOptions = {}, input: unknown = data) {
  const network = createFakeNetwork();
  const h = createHarness(theme, network.env);
  const handle = await createInstance(h.canvas, input, theme, { options, env: h.env });
  const loaded = async (): Promise<void> => {
    h.runFrame();
    await settle();
    h.runIdle();
    await settle();
  };
  return { h, handle, network, loaded };
}
