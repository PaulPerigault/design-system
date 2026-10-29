import { describe, expect, it } from 'vitest';
import { loadConfig, mergeOptions } from '../src/application/config.ts';
import { GuardUsageError } from '../src/errors.ts';
import { fakeIo } from './fake-io.ts';

describe('loadConfig', () => {
  it('lit pp-guards.config.json du dossier courant', () => {
    const { io } = fakeIo({ 'pp-guards.config.json': '{"size":{"max":5}}' });
    expect(loadConfig(io)).toEqual({ size: { max: 5 } });
  });

  it('retourne {} sans fichier implicite', () => {
    const { io } = fakeIo({ 'src/a.ts': '' });
    expect(loadConfig(io)).toEqual({});
  });

  it('lit un fichier explicite', () => {
    const { io } = fakeIo({ 'conf/x.json': '{"design":{}}' });
    expect(loadConfig(io, 'conf/x.json')).toEqual({ design: {} });
  });

  it('refuse un fichier explicite absent', () => {
    const { io } = fakeIo({ 'src/a.ts': '' });
    expect(() => loadConfig(io, 'nope.json')).toThrow(GuardUsageError);
    expect(() => loadConfig(io, 'nope.json')).toThrow('nope.json');
  });

  it('refuse un JSON invalide en citant le chemin', () => {
    const { io } = fakeIo({ 'pp-guards.config.json': '{oops' });
    expect(() => loadConfig(io)).toThrow(GuardUsageError);
    expect(() => loadConfig(io)).toThrow('pp-guards.config.json');
  });

  it.each(['[]', '3', 'null'])('refuse %s : un objet est attendu', (text) => {
    const { io } = fakeIo({ 'c.json': text });
    expect(() => loadConfig(io, 'c.json')).toThrow(GuardUsageError);
  });
});

describe('mergeOptions', () => {
  const defaults = { max: 120, roots: ['src'], ext: ['.ts'] };

  it('priorité : défauts < section < drapeaux', () => {
    const merged = mergeOptions(defaults, { max: 80, roots: ['lib'] }, { max: '10' }, []);
    expect(merged).toEqual({ max: '10', roots: ['lib'], ext: ['.ts'] });
  });

  it('un tableau remplace, il ne s’ajoute pas', () => {
    const merged = mergeOptions(defaults, { ext: ['.css', '.md'] }, { ext: ['.mjs'] }, []);
    expect(merged.ext).toEqual(['.mjs']);
  });

  it('les positionnels non vides deviennent roots', () => {
    expect(mergeOptions(defaults, { roots: ['lib'] }, {}, ['a', 'b']).roots).toEqual(['a', 'b']);
  });

  it('accepte une section absente et ne modifie pas ses entrées', () => {
    const frozen = Object.freeze({ ...defaults });
    expect(mergeOptions(frozen, undefined, {}, [])).toEqual(defaults);
    expect(defaults.roots).toEqual(['src']);
  });
});
