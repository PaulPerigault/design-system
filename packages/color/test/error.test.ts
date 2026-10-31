import { describe, expect, it } from 'vitest';
import { ColorError, parseFault } from '../src/error.ts';

describe('parseFault', () => {
  it('lit code et grandeur du .wasm', () => {
    const error = parseFault('out-of-range:lightness');
    expect(error).toBeInstanceOf(ColorError);
    expect(error.code).toBe('out-of-range');
    expect(error.component).toBe('lightness');
  });

  it('accepte un code sans grandeur', () => {
    expect(parseFault('out-of-gamut:').code).toBe('out-of-gamut');
    expect(parseFault('out-of-gamut:').component).toBeUndefined();
    expect(parseFault('invalid-length:').code).toBe('invalid-length');
  });

  it('refuse tout le reste en `internal`, jamais en texte brut', () => {
    for (const raised of ['nimporte:quoi', 'panic', '', 42, undefined, new TypeError('x')]) {
      const error = parseFault(raised);
      expect(error).toBeInstanceOf(ColorError);
      expect(error.code).toBe('internal');
    }
  });

  it('garde une ColorError telle quelle', () => {
    const own = new ColorError('not-ready');
    expect(parseFault(own)).toBe(own);
  });
});
