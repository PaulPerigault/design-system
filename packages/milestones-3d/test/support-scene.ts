// Scène du .wasm simulée : journal des appels, échecs programmables.
import type { RawScene } from '../src/raw.ts';

export class FakeScene implements RawScene {
  calls: string[] = [];
  textures = new Map<string, ImageBitmap>();
  moreFrames = false;
  failNext: string | undefined;
  /** Rend faux pour un identifiant inconnu (`setActive`). */
  known = new Set(['a', 'b', '@goal']);
  pickResult = 'b';
  projected = Float32Array.from([0.25, 0.5, 0.1, 1, 0.75, 0.5, 0.1, 0]);
  /** Attentes de la clôture de préchauffage simulées. */
  /** Attentes du GPU (`idle`) simulées avant qu'il rattrape son retard. */
  idleWaits = 0;
  idle = (): boolean => (this.calls.push('idle'), this.idleWaits-- <= 0);
  warmWaits = 0;
  warmFrame = (now: number): void => void this.calls.push(`warm:${now}`);
  warmed = (): boolean => (this.calls.push('warmed'), this.warmWaits-- <= 0);
  /** Étapes du GPU restantes avant la fin, et attentes de compilation simulées. */
  stepsLeft = 0;
  waitsLeft = 0;
  gpuStep = (): number => {
    this.calls.push('gpu-step');
    if (this.waitsLeft > 0) return ((this.waitsLeft -= 1), 2);
    return this.stepsLeft > 0 ? ((this.stepsLeft -= 1), 1) : 0;
  };
  frame = (now: number): boolean => (this.calls.push(`frame:${now}`), this.moreFrames);
  resize = (w: number, h: number): void => void this.calls.push(`resize:${w}x${h}`);
  setTheme = (theme: Float32Array): void => void this.calls.push(`theme:${theme.length}`);
  setProgress = (p: number): void => {
    if (!Number.isFinite(p)) throw 'progress';
    this.calls.push(`progress:${p}`);
  };
  progressOf = (id: string): number => (this.known.has(id) ? 0.5 : -1);
  setActive = (id: string): boolean => {
    if (this.failNext) throw this.failNext;
    this.calls.push(`active:${id}`);
    return id === '' || this.known.has(id);
  };
  setHover = (id: string): void => void this.calls.push(`hover:${id}`);
  pointerMove = (x: number, y: number): void => void this.calls.push(`move:${x},${y}`);
  pointerLeave = (): void => void this.calls.push('leave');
  setGyro = (x: number, y: number): void => void this.calls.push(`gyro:${x},${y}`);
  pick = (): string => this.pickResult;
  project = (): Float32Array => this.projected;
  setTexture = (id: string, bitmap: ImageBitmap): void => {
    if (this.failNext) throw this.failNext;
    this.calls.push(`texture:${id}`);
    this.textures.set(id, bitmap);
  };
  contextLost = (): void => void this.calls.push('lost');
  contextRestored = (): void => {
    if (this.failNext) throw this.failNext;
    this.calls.push('restored');
  };
  destroy = (): void => void this.calls.push('destroy');
  free = (): void => void this.calls.push('free');
}
