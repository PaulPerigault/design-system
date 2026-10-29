import { describe, expect, it } from 'vitest';
import { generate, generateWith } from '../../scripts/build.ts';
import { DEFAULT_HUE, readGenerated, readSource } from './helpers.ts';

const FILES = ['tokens.css', 'tokens.json', 'tokens.d.ts'];

function generated(input: Parameters<typeof generateWith>[1]): Record<string, string> {
  const result = generateWith(readSource, input);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

describe('sorties par défaut identiques octet pour octet', () => {
  it.each(FILES)('%s : sans entrée, égal au fichier versionné', (name) => {
    expect(generate(readSource)[name]).toBe(readGenerated(name));
    expect(generated({})[name]).toBe(readGenerated(name));
  });

  it.each(FILES)('%s : la teinte par défaut rend le même fichier', (name) => {
    expect(generated({ accentHue: DEFAULT_HUE })[name]).toBe(readGenerated(name));
  });
});
