// Badges : chargés en différé, après la première image, deux à la fois (ADR-0013, décision 2).
// fetch -> blob -> createImageBitmap -> `setTexture`. Sans pré-multiplication ni conversion de
// couleur de la part du navigateur autre que celles demandées ici : le badge arrive intact. Un
// échec laisse la médaille sans badge et n'arrête jamais la scène.
import { TEXTURE_CONCURRENCY, TEXTURE_MAX_PX } from './constants.ts';
import type { Env } from './env.ts';
import { phaseEnd, phaseStart, timed } from './phases.ts';
import { MilestonesError, parseFault } from './error.ts';
import type { RawScene } from './raw.ts';
import type { Session } from './session.ts';
import type { Badge } from './types.ts';

export interface TextureJob {
  readonly id: string;
  readonly badge: Badge;
}

export interface TextureDeps {
  readonly env: Pick<Env, 'fetch' | 'createImageBitmap'>;
  readonly scene: Pick<RawScene, 'setTexture'>;
  readonly signal: AbortSignal;
  readonly onLoaded: () => void;
  readonly onError: (id: string) => void;
}

const BASE: ImageBitmapOptions = {
  premultiplyAlpha: 'premultiply',
  colorSpaceConversion: 'none',
  imageOrientation: 'none',
};

/** Réduction à `TEXTURE_MAX_PX` au plus, proportions gardées ; rien si l'image tient déjà. */
function shrink(width: number, height: number): ImageBitmapOptions {
  const longest = Math.max(width, height);
  if (longest <= TEXTURE_MAX_PX) return {};
  const ratio = TEXTURE_MAX_PX / longest;
  return {
    resizeWidth: Math.max(1, Math.round(width * ratio)),
    resizeHeight: Math.max(1, Math.round(height * ratio)),
    resizeQuality: 'high',
  };
}

async function decode(blob: Blob, badge: Badge, env: TextureDeps['env']): Promise<ImageBitmap> {
  const known = badge.width !== undefined && badge.height !== undefined;
  const hint = known ? shrink(badge.width ?? 0, badge.height ?? 0) : {};
  const first = await env.createImageBitmap(blob, { ...BASE, ...hint });
  if (!(first.width > 0 && first.height > 0)) {
    first.close();
    throw new MilestonesError('load-failed', 'taille nulle');
  }
  const resize = shrink(first.width, first.height);
  if (resize.resizeWidth === undefined) return first;
  try {
    return await env.createImageBitmap(blob, { ...BASE, ...resize });
  } finally {
    first.close();
  }
}

async function loadOne({ id, badge }: TextureJob, deps: TextureDeps): Promise<void> {
  let bitmap: ImageBitmap | undefined;
  try {
    const init = { signal: deps.signal, credentials: 'same-origin', mode: 'same-origin' } as const;
    const response = await deps.env.fetch(badge.src, init);
    if (!response.ok) throw new MilestonesError('load-failed', id);
    const decoding = phaseStart();
    bitmap = await decode(await response.blob(), badge, deps.env);
    phaseEnd('texture-decode', decoding);
    if (deps.signal.aborted) throw new MilestonesError('load-failed', 'annulé');
    const sent = bitmap;
    timed('texture-upload', () => deps.scene.setTexture(id, sent));
    bitmap = undefined; // transmis : la scène le garde et le ferme
    deps.onLoaded();
  } catch (raised) {
    // `gl-resource` : la scène a gardé le bitmap (elle le recrée à la restauration du contexte).
    if (parseFault(raised).code !== 'gl-resource') bitmap?.close();
    if (!deps.signal.aborted) deps.onError(id);
  }
}

/** Charge les badges, `TEXTURE_CONCURRENCY` à la fois. Ne rejette jamais. */
export async function loadTextures(jobs: readonly TextureJob[], deps: TextureDeps): Promise<void> {
  const queue = [...jobs];
  const worker = async (): Promise<void> => {
    for (let job = queue.shift(); job !== undefined; job = queue.shift()) {
      if (deps.signal.aborted) return;
      await loadOne(job, deps);
    }
  };
  const count = Math.min(TEXTURE_CONCURRENCY, queue.length);
  await Promise.allSettled(Array.from({ length: count }, worker));
}

/** Programme le chargement après la première image, au temps libre ; `destroy()` l'annule. */
export function scheduleTextures(s: Session, jobs: readonly TextureJob[]): void {
  if (jobs.length === 0) return;
  const controller = new AbortController();
  let cancelIdle = (): void => {};
  s.bag.add(() => {
    controller.abort();
    cancelIdle();
  });
  const deps: TextureDeps = {
    env: s.env,
    scene: s.scene,
    signal: controller.signal,
    onLoaded: s.redraw,
    onError: (id) => s.options.onTextureError?.(id),
  };
  void s.firstFrame.then(() => {
    if (s.isDestroyed()) return;
    cancelIdle = s.env.whenIdle(() => void loadTextures(jobs, deps));
  });
}
