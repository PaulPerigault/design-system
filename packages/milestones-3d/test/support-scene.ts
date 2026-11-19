// Scène du .wasm simulée : journal des appels, échecs programmables.
import type { RawScene } from '../src/raw.ts';

export class FakeScene implements RawScene {
  calls: string[] = [];
  moreFrames = false;
  failNext: string | undefined;
  pickResult: string | undefined = 'b';
  frame = (now: number): boolean => (this.calls.push(`frame:${now}`), this.moreFrames);
  resize = (w: number, h: number): void => void this.calls.push(`resize:${w}x${h}`);
  setTheme = (theme: Float32Array): void => void this.calls.push(`theme:${theme.length}`);
  setActive = (id: string): void => {
    if (this.failNext) throw this.failNext;
    this.calls.push(`active:${id}`);
  };
  activeId = (): string | undefined => 'a';
  pointerMove = (x: number, y: number): void => void this.calls.push(`move:${x},${y}`);
  pointerLeave = (): void => void this.calls.push('leave');
  setGyro = (x: number, y: number): void => void this.calls.push(`gyro:${x},${y}`);
  pick = (): string | undefined => this.pickResult;
  contextLost = (): void => void this.calls.push('lost');
  contextRestored = (): void => {
    if (this.failNext) throw this.failNext;
    this.calls.push('restored');
  };
  destroy = (): void => void this.calls.push('destroy');
  free = (): void => void this.calls.push('free');
}
