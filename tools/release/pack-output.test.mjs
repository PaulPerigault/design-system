import { describe, expect, it } from 'vitest';
import { parsePackOutput } from './pack-output.mjs';
import { forbiddenReason, tarballProblems } from './tarball-rules.mjs';

const entry = (name, paths) => ({ name, files: paths.map((path) => ({ path })) });

describe('parsePackOutput', () => {
  it('ignore le bruit des scripts prepack avant le tableau', () => {
    const out = 'vendor-tokens : 64 fichiers\n[\n  { "name": "a", "files": [] }\n]\n';
    expect(parsePackOutput(out)).toEqual([{ name: 'a', files: [] }]);
  });
  it('rend un tableau vide devant une sortie illisible ou absente', () => {
    expect(parsePackOutput(undefined)).toEqual([]);
    expect(parsePackOutput('rien')).toEqual([]);
    expect(parsePackOutput('[\n{ pas du json\n]')).toEqual([]);
  });
});

describe('forbiddenReason', () => {
  it('refuse secrets, tests, sources TypeScript et tsconfig', () => {
    expect(forbiddenReason('.env.local', 'x')).toBe('fichier d’environnement');
    expect(forbiddenReason('keys/server.pem', 'x')).toBe('clé ou certificat');
    expect(forbiddenReason('test/a.mjs', 'x')).toBe('fichier de test');
    expect(forbiddenReason('dist/a.test.js', 'x')).toBe('fichier de test');
    expect(forbiddenReason('src/a.ts', '@paulperigault/guards')).toBe('source TypeScript');
    expect(forbiddenReason('tsconfig.build.json', 'x')).toBe('tsconfig du dépôt');
  });
  it('accepte les déclarations, les sources d’astro et les gabarits', () => {
    expect(forbiddenReason('dist/a.d.ts', '@paulperigault/guards')).toBeUndefined();
    expect(forbiddenReason('src/a.ts', '@paulperigault/astro')).toBeUndefined();
    expect(
      forbiddenReason('templates/site/tsconfig.json', '@paulperigault/create'),
    ).toBeUndefined();
  });
});

describe('tarballProblems', () => {
  const ok = ['README.md', 'LICENSE', 'dist/a.js'];
  it('ne dit rien d’un paquet complet', () => {
    expect(tarballProblems(entry('p', ok))).toEqual([]);
  });
  it('bloque un fichier interdit, avertit d’un README, d’une LICENSE ou d’un wasm manquant', () => {
    const levels = tarballProblems(entry('p', ['.env', 'dist/a.js']), { wasm: true }).map(
      (problem) => `${problem.level}:${problem.message}`,
    );
    expect(levels).toEqual([
      'blocking:.env : fichier d’environnement',
      'warning:README.md absent',
      'warning:LICENSE absent',
      'warning:.wasm absent (attendu après build:wasm)',
    ]);
  });
});
