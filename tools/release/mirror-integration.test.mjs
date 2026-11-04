// Intégration locale du miroir (#308), sans réseau : tarball réel d'un paquet du dépôt, extrait HORS du
// dépôt comme dans le job, réécrit par le code du miroir, puis essai à blanc de publication. L'essai à
// blanc ne publie rien mais exécute les scripts de cycle de vie : c'est ce qui a échoué le 2026-11-04.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { GITHUB_REGISTRY } from './mirror-plan.mjs';
import { extractTarball, rewriteExtracted } from './mirror-prepare.mjs';

const REPO = resolve(import.meta.dirname, '..', '..');
const CHECK = 'check-publish-env.mjs';
const TIMEOUT = 120_000;
const roots = [];

/** npm hors du dépôt, avec une configuration vide : ni .npmrc de l'utilisateur, ni jeton. */
function npm(args, cwd, config) {
  // Deux fichiers distincts : npm refuse de charger le même fichier comme « user » puis « global ».
  const env = {
    ...process.env,
    npm_config_userconfig: config,
    npm_config_globalconfig: `${config}.global`,
  };
  // Windows : npm est un .cmd que Node refuse de lancer sans shell ; on appelle son script JS.
  const cli = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
  const [file, head] = existsSync(cli) ? [process.execPath, [cli]] : ['npm', []];
  const done = spawnSync(file, [...head, ...args], { cwd, env, encoding: 'utf8' });
  return { status: done.status, output: `${done.stdout}${done.stderr}` };
}

function scratch() {
  const root = mkdtempSync(join(tmpdir(), 'mirror-it-'));
  roots.push(root);
  const config = join(root, 'npmrc');
  writeFileSync(config, '');
  writeFileSync(`${config}.global`, '');
  const workdir = join(root, 'work');
  mkdirSync(workdir);
  return { root, config, workdir };
}

/** Tarball réel (`npm pack`, sans lancer `prepack` : le build n'est pas l'objet), extrait hors du dépôt. */
function extractedPackage(name) {
  const { config, workdir } = scratch();
  const packed = npm(
    ['pack', '--ignore-scripts', '--pack-destination', workdir],
    join(REPO, 'packages', name),
    config,
  );
  expect(packed.status, packed.output).toBe(0);
  return { packageDir: extractTarball(workdir), config };
}

afterAll(() => roots.forEach((root) => rmSync(root, { recursive: true, force: true })));

describe.each(['tokens', 'create'])('miroir : @paulperigault/%s extrait hors du dépôt', (name) => {
  const dry = (dir, config) =>
    npm(['publish', '--dry-run', '--registry', GITHUB_REGISTRY], dir, config);

  it(
    'le dossier est bien hors du dépôt',
    () => {
      const { packageDir } = extractedPackage(name);
      expect(packageDir.startsWith(REPO + sep)).toBe(false);
    },
    TIMEOUT,
  );

  it(
    'sans réécriture, l’essai à blanc échoue sur le script du dépôt (le défaut)',
    () => {
      const { packageDir, config } = extractedPackage(name);
      const result = dry(packageDir, config);
      expect(result.status).not.toBe(0);
      expect(result.output).toContain(CHECK);
    },
    TIMEOUT,
  );

  it(
    'après réécriture, l’essai à blanc réussit sans script ni module du dépôt',
    () => {
      const { packageDir, config } = extractedPackage(name);
      rewriteExtracted(packageDir);
      const result = dry(packageDir, config);
      expect(result.status, result.output).toBe(0);
      expect(result.output).not.toContain(CHECK);
      expect(result.output).not.toMatch(/prepublishOnly|prepack|Cannot find module/);
      expect(result.output).toContain(GITHUB_REGISTRY);
    },
    TIMEOUT,
  );
});
