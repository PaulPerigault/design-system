import { expect, it } from 'vitest';
import { ColorError } from '../src/error.ts';
import { oklchToSrgb } from '../src/index.ts';
import { isReady } from '../src/runtime.ts';

it('refuse tout appel avant init() avec une erreur typée', () => {
  expect(isReady()).toBe(false);
  expect(() => oklchToSrgb({ l: 0.5, c: 0.1, h: 30 })).toThrow(ColorError);
  try {
    oklchToSrgb({ l: 0.5, c: 0.1, h: 30 });
  } catch (error) {
    expect(error).toMatchObject({ code: 'not-ready', name: 'ColorError' });
  }
});
