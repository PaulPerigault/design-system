import { describe, expect, it } from 'vitest';
import { hasWebGL2 } from '../src/conditions.ts';
import type { CanvasLike } from '../src/conditions.ts';

describe('hasWebGL2', () => {
  const canvas = (context: ReturnType<CanvasLike['getContext']> | Error): CanvasLike => ({
    getContext: () => {
      if (context instanceof Error) throw context;
      return context;
    },
  });

  it('vrai avec un contexte, et le rend au navigateur', () => {
    let lost = 0;
    const context = { getExtension: () => ({ loseContext: () => void (lost += 1) }) };
    expect(hasWebGL2(() => canvas(context))).toBe(true);
    expect(lost).toBe(1);
  });

  it('faux sans contexte ou si la création échoue', () => {
    expect(hasWebGL2(() => canvas(null))).toBe(false);
    expect(hasWebGL2(() => canvas(new Error('refusé')))).toBe(false);
  });

  it('vrai même sans extension de perte de contexte', () => {
    expect(hasWebGL2(() => canvas({ getExtension: () => null }))).toBe(true);
  });
});
