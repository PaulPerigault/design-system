import { fileURLToPath, URL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { run } from '../src/commands/create.mjs';
import { sha256 } from '../src/lib/hash.mjs';
import { nodeIo } from '../src/lib/io.mjs';
import { npmName, sitePackageJson } from '../src/site/package-json.mjs';
import { loadTemplate, outputPath } from '../src/site/template.mjs';
import { fakeIo } from './fake-io.mjs';

const TEMPLATES = fileURLToPath(new URL('../templates', import.meta.url));
const sink = { write: () => true };
const reader = nodeIo({ cwd: TEMPLATES, stdout: sink, stderr: sink });
const template = loadTemplate(reader, TEMPLATES);

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
    expect(Object.keys(generate().files).filter((path) => path.includes('/_'))).toEqual([]);
  });
});

describe('create : package.json', () => {
  it('versions exactes, reprises de versions.json', () => {
    const manifest = JSON.parse(fileOf(generate().files, 'package.json'));
    const all = { ...manifest.dependencies, ...manifest.devDependencies };
    const deps = ['@paulperigault/css', '@paulperigault/tokens', 'astro'];
    expect(Object.keys(manifest.dependencies)).toEqual(deps);
    expect(all).toEqual(template.versions);
    expect(Object.values(all).every((version) => /^\d+\.\d+\.\d+$/.test(version))).toBe(true);
    expect(() => sitePackageJson('x', { ...all, astro: '^7.0.0' })).toThrow('astro');
  });

  it('scripts, module, engines', () => {
    const text = fileOf(generate().files, 'package.json');
    const manifest = JSON.parse(text);
    expect(text).toMatch(/^\{\n {2}"name": "mon-site",\n[\s\S]*\n\}\n$/);
    expect(manifest).toMatchObject({ private: true, type: 'module', engines: { node: '>=24' } });
    expect(Object.values(manifest.scripts)).toEqual(
      ['astro dev', 'astro build', 'astro preview', 'pp-guards all'].concat([
        'npm run guard && astro build',
        'husky',
      ]),
    );
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

  it('refuse un dossier non vide (même --force) ; code 2 hors un dossier', () => {
    const existing = { '/projet/mon-site/index.html': 'x' };
    const forced = generate({ force: true }, existing);
    expect([forced.code, forced.files]).toEqual([1, existing]);
    expect(generate({}, { '/projet/mon-site': 'fichier' }).code).toBe(1);
    expect([[], ['a', 'b']].map((positionals) => generate({ positionals }).code)).toEqual([2, 2]);
  });

  it('cite le dossier entre guillemets dans « cd » si nécessaire', () => {
    const cd = (dir) => generate({ positionals: [dir] }).out.find((l) => l.startsWith('  cd '));
    expect(cd('clients/Été 2025')).toBe("  cd 'clients/Été 2025'");
    expect([cd("l'atelier"), cd('a/b_c-1.x')]).toEqual(["  cd 'l'\\''atelier'", '  cd a/b_c-1.x']);
  });
});

describe('gabarit', () => {
  const content = (path) => template.files.find((file) => file.path === path).content;

  it('pages sans JS ni style en ligne', () => {
    const pages = ['src/layouts/Base.astro', 'src/pages/index.astro'].map(content).join();
    expect(pages).not.toMatch(/<script|style=|<style/);
    expect(pages).toContain('<html lang="fr">');
  });

  it('ignore les entrées commençant par `.` (.DS_Store)', () => {
    const e = (name, dir = false) => ({ name, isDirectory: () => dir });
    const tree = { '/t/site': [e('.DS_Store'), e('a'), e('s', true)], '/t/site/s': [e('.x')] };
    const io = { cwd: () => '/', readdir: (dir) => tree[dir], readText: () => '{}' };
    expect(loadTemplate(io, '/t').files.map((file) => file.path)).toEqual(['a']);
  });

  it('CI : actions épinglées par SHA, droits en lecture, npm ci sans scripts', () => {
    const ci = content('_github/workflows/ci.yml');
    const uses = [...ci.matchAll(/uses: (\S+)/g)].map((match) => match[1]);
    expect(uses.length).toBeGreaterThan(0);
    expect(uses.every((ref) => /@[0-9a-f]{40}$/.test(ref))).toBe(true);
    const required = ['permissions:\n  contents: read', 'persist-credentials: false'];
    for (const text of [...required, 'run: npm ci --ignore-scripts\n']) expect(ci).toContain(text);
  });
});
