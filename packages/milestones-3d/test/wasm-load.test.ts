import { expect, it } from 'vitest';
import { MilestonesError } from '../src/error.ts';
import { themeToArray } from '../src/raw-theme.ts';
import { loadScene } from '../src/runtime.ts';
import { FakeCanvas } from './support.ts';
import { theme, whenBuilt } from './wasm-support.ts';

whenBuilt('.wasm construit', () => {
  it('se charge une seule fois et rend une fabrique de scènes', async () => {
    const first = loadScene();
    expect(loadScene()).toBe(first);
    expect(typeof (await first).create).toBe('function');
  });

  it('refuse un canvas qui n’en est pas un : gl-unavailable', async () => {
    const factory = await loadScene();
    const input = {
      ids: ['a'],
      statuses: ['achieved'],
      emblems: [''],
      goal: false,
      theme: themeToArray(theme),
      active: '',
    };
    expect(() => factory.create(new FakeCanvas(), input)).toThrow(MilestonesError);
    expect(() => factory.create(new FakeCanvas(), input)).toThrow(/gl-unavailable/);
  });
});
