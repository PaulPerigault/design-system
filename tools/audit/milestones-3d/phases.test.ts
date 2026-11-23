import { describe, expect, it } from 'vitest';
import { describePhases, describeTasks, initWindow } from './phases.ts';

const phases = [
  { name: 'create-scene', start: 150, duration: 60 },
  { name: 'load-wasm', start: 100, duration: 40 },
];

describe('phases', () => {
  it('liste les phases dans l’ordre du temps', () => {
    expect(describePhases(phases)).toBe('load-wasm 40 ms, create-scene 60 ms');
    expect(describePhases([])).toContain('aucune marque');
  });

  it('dit quelle phase recouvre la tâche longue', () => {
    const text = describeTasks([{ start: 148, duration: 62 }], phases, 100);
    expect(text).toContain('+48 ms 62 ms : create-scene 60 ms');
    expect(text).not.toContain('load-wasm 40 ms :');
  });

  it('une tâche hors des phases est dite telle', () => {
    expect(describeTasks([{ start: 300, duration: 55 }], phases, 100)).toContain('hors phases');
    expect(describeTasks([], phases, 100)).toBe('aucune');
  });
});

describe('initWindow', () => {
  it('s’étend jusqu’à la première image réellement tracée, composition comprise', () => {
    const real = [{ name: 'first-frame', start: 400, duration: 5 }];
    expect(initWindow(200, real)).toEqual({ end: 505, drawn: 405 });
  });

  it('sans marque, reste au premier tick d’image', () => {
    expect(initWindow(200, [])).toEqual({ end: 200, drawn: null });
  });
});
