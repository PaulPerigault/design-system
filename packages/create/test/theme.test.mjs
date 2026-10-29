import { fileURLToPath, URL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { main } from '../src/application/cli.ts';
import { run } from '../src/application/commands/create.ts';
import { loadTemplate } from '../src/application/load-template.ts';
import { themeCss, withThemeImport } from '../src/domain/theme-css.ts';
import { nodeIo } from '../src/infrastructure/node-io.ts';
import { buildTheme } from '../src/infrastructure/theme.ts';
import { fakeIo } from './fake-io.mjs';

const TEMPLATES = fileURLToPath(new URL('../templates', import.meta.url));
const sink = { write: () => true };
const template = loadTemplate(nodeIo({ cwd: TEMPLATES, stdout: sink, stderr: sink }), TEMPLATES);
const LAYOUT = 'src/layouts/Base.astro';
const layoutOf = (files) => files['/projet/mon-site/src/layouts/Base.astro'];

function generate(options = {}) {
  const fake = fakeIo({});
  const args = { positionals: ['mon-site'], ...options };
  return { fake, code: run(args, { io: fake.io, template, theme: buildTheme }) };
}

describe('feuille de thème', () => {
  it('trie les variables, apparie clair et sombre, ajoute la pile', () => {
    const colors = {
      light: { '--pp-b': 'oklch(1)', '--pp-a': 'oklch(2)' },
      dark: { '--pp-a': 'oklch(3)' },
    };
    const css = themeCss({ colors, fontStack: 'Inter, sans-serif' });
    expect(css).toContain(
      ':root {\n  --pp-a: light-dark(oklch(2), oklch(3));\n  --pp-b: light-dark(oklch(1), oklch(1));',
    );
    expect(css).toContain('  --pp-font-family-sans: Inter, sans-serif;\n}');
  });

  it('importe la feuille après @paulperigault/css, sans toucher aux autres fichiers', () => {
    const files = [
      { path: LAYOUT, content: "---\nimport '@paulperigault/css';\n---\n" },
      { path: 'a.txt', content: 'x' },
    ];
    const [layout, other] = withThemeImport(files);
    expect(layout.content).toBe(
      "---\nimport '@paulperigault/css';\nimport '../styles/pp-theme.css';\n---\n",
    );
    expect(other).toBe(files[1]);
    expect(() => withThemeImport([{ path: LAYOUT, content: 'rien' }])).toThrow('introuvable');
  });
});

describe('buildTheme : mêmes règles que le build de tokens', () => {
  it('dérive l’accent d’une teinte et la pile seule', () => {
    const hued = buildTheme({ accentHue: '150' });
    expect(hued.ok && hued.css).toContain('--pp-color-accent: light-dark(oklch(47% 0.1294 150)');
    const stacked = buildTheme({ fontStack: 'Inter, system-ui, sans-serif' });
    expect(stacked.ok && stacked.css).not.toContain('--pp-color-accent');
  });

  it('refuse une teinte ou une pile invalide avec un code typé', () => {
    expect(buildTheme({ accentHue: '400' })).toMatchObject({
      ok: false,
      code: 'build.hue-out-of-range',
    });
    expect(buildTheme({ accentHue: 'abc' })).toMatchObject({ ok: false });
    expect(buildTheme({ fontStack: 'a; b' })).toMatchObject({
      ok: false,
      code: 'build.stack-unsafe',
    });
  });
});

describe('create avec teinte et pile', () => {
  it('écrit la feuille et son import ; sans option, la mise en page reste celle du gabarit', () => {
    const { fake, code } = generate({ accentHue: '150', fontStack: 'Inter, sans-serif' });
    expect(code).toBe(0);
    expect(fake.files['/projet/mon-site/src/styles/pp-theme.css']).toContain(
      '--pp-font-family-sans',
    );
    expect(layoutOf(fake.files)).toContain("import '../styles/pp-theme.css';");
    const plain = generate();
    const original = template.files.find((file) => file.path === LAYOUT)?.content;
    expect(layoutOf(plain.fake.files)).toBe(original);
    expect(plain.fake.files['/projet/mon-site/src/styles/pp-theme.css']).toBeUndefined();
  });

  it('lève une erreur typée pour une teinte invalide, ou sans dérivation disponible', () => {
    expect(() => generate({ accentHue: '400' })).toThrow(/hors de 0 à 360/);
    const fake = fakeIo({});
    const args = { positionals: ['x'], fontStack: 'a' };
    expect(() => run(args, { io: fake.io, template })).toThrow('dérivation du thème indisponible');
  });
});

describe('cli : options du thème', () => {
  const setup = () => {
    const fake = fakeIo({ '/t/site/src/pages/index.astro': 'x', '/t/versions.json': '{}' });
    return {
      ...fake,
      cli: (...argv) => main(argv, { io: fake.io, templatesRoot: '/t', version: '1' }),
    };
  };

  it('refuse --accent-hue hors de create', () => {
    const { cli, err } = setup();
    expect(cli('add', 'stack', '--accent-hue', '10')).toBe(2);
    expect(err[0]).toBe('pp-create : --accent-hue ne s’applique pas à add');
  });

  it('refuse --font-stack sans l’adaptateur de dérivation', () => {
    const { cli, err } = setup();
    expect(cli('create', 'x', '--font-stack', 'Inter')).toBe(2);
    expect(err.join('\n')).toContain('dérivation du thème indisponible');
  });
});
