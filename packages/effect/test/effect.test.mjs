import { Effect, Exit } from 'effect';
import { describe, expect, it } from 'vitest';
import {
  Hue,
  ValidationError,
  clockLayer,
  fileSystemLayer,
  now,
  readText,
  validate,
  writeText,
} from '../src/index.ts';

const memory = (files = {}) => ({
  readText: (path) => {
    if (!(path in files)) throw new Error(`absent : ${path}`);
    return files[path];
  },
  writeText: (path, text) => {
    files[path] = text;
  },
  exists: (path) => path in files,
});
const run = (effect, layer) => Effect.runPromise(Effect.provide(effect, layer));
const fail = (effect, layer) => Effect.runPromise(Effect.flip(Effect.provide(effect, layer)));

describe('adaptateur de fichiers', () => {
  it('lit et écrit par le port fourni', async () => {
    const files = { 'a.txt': 'bonjour' };
    const layer = fileSystemLayer(memory(files));
    expect(await run(readText('a.txt'), layer)).toBe('bonjour');
    await run(writeText('b.txt', 'salut'), layer);
    expect(files['b.txt']).toBe('salut');
  });
  it('transforme une exception du port en FileSystemError typée', async () => {
    const error = await fail(readText('nulle.txt'), fileSystemLayer(memory()));
    expect(error._tag).toBe('FileSystemError');
    expect(error.operation).toBe('readText');
    expect(error.path).toBe('nulle.txt');
    expect(error.reason).toContain('absent');
  });
});

describe('adaptateur d’horloge', () => {
  it('rend l’instant du port, sans horloge réelle', async () => {
    expect(await run(now, clockLayer({ now: () => 1234 }))).toBe(1234);
  });
});

describe('validation Schema', () => {
  const hue = validate('accent-hue', Hue);
  it('accepte une teinte de 0 à 360', async () => {
    expect(await Effect.runPromise(hue(270.7))).toBe(270.7);
  });
  it.each([[400], [-1], ['rouge'], [Number.NaN]])(
    'refuse %j par une ValidationError',
    async (bad) => {
      const error = await Effect.runPromise(Effect.flip(hue(bad)));
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe('accent-hue');
    },
  );
  it('un échec reste une valeur de sortie typée, jamais une exception', async () => {
    const exit = await Effect.runPromiseExit(hue(999));
    expect(Exit.isFailure(exit)).toBe(true);
  });
});
