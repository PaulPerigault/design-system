import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { defaults, run } from '../src/application/check-layers.ts';
import { isRecord } from '../src/domain/options.ts';
import { fakeIo } from './fake-io.ts';

const CONFIG = new URL('../../../pp-guards.config.json', import.meta.url);
const parsed: unknown = JSON.parse(readFileSync(CONFIG, 'utf8'));
const sections = isRecord(parsed) ? parsed : {};
const layers = isRecord(sections.layers) ? sections.layers : {};
const options = { ...defaults, ...layers, roots: ['packages'] };

const runLayers = (files: Record<string, string>) => {
  const { io, err } = fakeIo(files);
  return { code: run(options, io), err };
};

describe('sens des couches du dépôt (tokens ← css ← astro, tokens ← dataviz ← astro)', () => {
  it('refuse un import qui remonte, par chemin relatif ou par nom de paquet', () => {
    const upward: [string, string][] = [
      ['packages/tokens/src/a.ts', "import '@paulperigault/css';"],
      ['packages/tokens/src/b.ts', "import '../../astro/src/Button.astro';"],
      ['packages/css/src/c.ts', "import '@paulperigault/astro/Button.astro';"],
      ['packages/dataviz/src/d.ts', "import '@paulperigault/astro/Button.astro';"],
      ['packages/tokens/src/e.ts', "import '@paulperigault/dataviz';"],
    ];
    for (const [file, text] of upward) {
      const { code, err } = runLayers({ [file]: text });
      expect([file, code]).toEqual([file, 1]);
      expect(err[0]).toContain('sens refusé');
    }
  });

  it('accepte les imports qui descendent', () => {
    const { code } = runLayers({
      'packages/astro/src/a.ts': "import '@paulperigault/css';\nimport '@paulperigault/tokens';",
      'packages/css/src/b.ts': "import '@paulperigault/tokens/contrast';",
      'packages/dataviz/src/c.ts': "import '@paulperigault/tokens';",
    });
    expect(code).toBe(0);
  });
});
