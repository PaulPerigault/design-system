import { fileURLToPath, URL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { run } from '../src/commands/create.mjs';
import { sha256 } from '../src/lib/hash.mjs';
import { nodeIo } from '../src/lib/io.mjs';
import { npmName, sitePackageJson } from '../src/site/package-json.mjs';
import { loadTemplate, outputPath } from '../src/site/template.mjs';
import { fakeIo } from './fake-io.mjs';

// Gabarit réel, lu en lecture seule : l'io ne porte ni writeText ni sortie.
const TEMPLATES = fileURLToPath(new URL('../templates', import.meta.url));
const sink = { write: () => true };
const { cwd, readText, readdir } = nodeIo({ cwd: TEMPLATES, stdout: sink, stderr: sink });
const template = loadTemplate({ cwd, readText, readdir }, TEMPLATES);
const EXACT = /^\d+\.\d+\.\d+$/;

function generate(options = {}, files = {}) {
  const fake = fakeIo(files);
  const code = run({ positionals: ['mon-site'], ...options }, { io: fake.io, template });
  return { code, ...fake };
}

const fileOf = (files, rel) => files[`/projet/mon-site/${rel}`];

describe('create : arborescence', () => {
  it('instantané des chemins et empreintes sha256, puis prochaines étapes', () => {
    const { code, files, out } = generate();
    expect(code).toBe(0);
    const tree = Object.fromEntries(Object.entries(files).map(([path, t]) => [path, sha256(t)]));
    expect(tree).toMatchSnapshot();
    expect(out).toEqual(expect.arrayContaining(['écrit mon-site/package.json', '  cd mon-site']));
  });

  it('renomme les segments `_` en `.`', () => {
    expect(outputPath('_gitignore')).toBe('.gitignore');
    expect(outputPath('_github/workflows/ci.yml')).toBe('.github/workflows/ci.yml');
    expect(outputPath('src/pages/index.astro')).toBe('src/pages/index.astro');
    const { files } = generate();
    for (const rel of ['.gitignore', '.npmrc', '.husky/commit-msg', '.github/workflows/ci.yml']) {
      expect(fileOf(files, rel)).toBeDefined();
    }
    expect(Object.keys(files).filter((path) => path.includes('/_'))).toEqual([]);
  });
});

describe('create : package.json', () => {
  it('versions exactes, reprises de versions.json', () => {
    const manifest = JSON.parse(fileOf(generate().files, 'package.json'));
    const all = { ...manifest.dependencies, ...manifest.devDependencies };
    expect(Object.keys(manifest.dependencies)).toEqual(['@paulperigault/css', 'astro']);
    expect(all).toEqual(template.versions);
    expect(Object.values(all).every((version) => EXACT.test(version))).toBe(true);
  });

  it('scripts, module, engines', () => {
    const text = fileOf(generate().files, 'package.json');
    const manifest = JSON.parse(text);
    expect(text).toMatch(/^\{\n {2}"name": "mon-site",\n[\s\S]*\n\}\n$/);
    expect(manifest).toMatchObject({ private: true, type: 'module', engines: { node: '>=24' } });
    const { dev, build, preview, guard, verify, prepare } = manifest.scripts;
    expect([dev, build, preview, prepare].join()).toBe('astro dev,astro build,astro preview,husky');
    expect([guard, verify]).toEqual(['pp-guards all', 'npm run guard && astro build']);
  });

  it('refuse une version non exacte', () => {
    const versions = { ...template.versions, astro: '^7.0.0' };
    expect(() => sitePackageJson('x', versions)).toThrow('astro');
  });

  it('dérive le nom npm du dossier', () => {
    expect(npmName('Mon Site!')).toBe('mon-site-');
    expect(npmName('a.b_c-1')).toBe('a.b_c-1');
    expect(npmName('_Brouillon')).toBe('brouillon');
    const fake = fakeIo({});
    run({ positionals: ['clients/Été 2025'] }, { io: fake.io, template });
    expect(JSON.parse(fake.files['/projet/clients/Été 2025/package.json']).name).toBe('-t--2025');
  });
});

describe('create : garde-fous', () => {
  it('--dry-run liste sans écrire', () => {
    const { code, files, out } = generate({ dryRun: true });
    expect([code, files]).toEqual([0, {}]);
    expect(out).toContain('créerait mon-site/.gitignore');
  });

  it('refuse un dossier non vide, même avec --force', () => {
    const existing = { '/projet/mon-site/index.html': 'x' };
    const { code, files, err } = generate({ force: true }, existing);
    expect(code).toBe(1);
    expect(files).toEqual({ '/projet/mon-site/index.html': 'x' });
    expect(err[0]).toContain('mon-site');
    expect(generate({}, { '/projet/mon-site': 'fichier' }).code).toBe(1);
  });

  it('code 2 sans dossier ou avec plusieurs', () => {
    expect(generate({ positionals: [] }).code).toBe(2);
    expect(generate({ positionals: ['a', 'b'] }).code).toBe(2);
  });
});

describe('gabarit', () => {
  const content = (path) => template.files.find((file) => file.path === path).content;

  it('pages sans JS ni style en ligne', () => {
    for (const path of ['src/layouts/Base.astro', 'src/pages/index.astro']) {
      expect(content(path)).not.toMatch(/<script|style=|<style/);
    }
    expect(content('src/layouts/Base.astro')).toContain('<html lang="fr">');
  });

  it('CI : actions épinglées par SHA, droits en lecture', () => {
    const ci = content('_github/workflows/ci.yml');
    const uses = [...ci.matchAll(/uses: (\S+)/g)].map((match) => match[1]);
    expect(uses.length).toBeGreaterThan(0);
    expect(uses.every((ref) => /@[0-9a-f]{40}$/.test(ref))).toBe(true);
    expect(ci).toContain('permissions:\n  contents: read');
    expect(ci).toContain('persist-credentials: false');
  });
});
