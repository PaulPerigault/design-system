// Registre cible du miroir (#130), sans réseau : la commande de publication du job, lancée comme
// dans le job (depuis la racine du dépôt, donc avec son `.npmrc` de projet, et avec le `.npmrc`
// qu'écrit setup-node), doit viser GitHub Packages. Le 2026-11-05 elle visait npmjs : ENEEDAUTH.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GITHUB_REGISTRY, publishArgs } from './mirror-plan.mjs';
import { prepareMirrorDir } from './mirror-prepare.mjs';

const REPO = resolve(import.meta.dirname, '..', '..');
const SCOPE = '@paulperigault';
const TIMEOUT = 120_000;
/** Copie du `.npmrc` écrit par actions/setup-node avec `registry-url` GitHub (portée du propriétaire). */
const SETUP_NODE_NPMRC = [
  '//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}',
  `${SCOPE}:registry=${GITHUB_REGISTRY}/`,
].join('\n');

let root = '';
let packageDir = '';

/** Script JS de npm (Windows : un .cmd que Node ne lance pas sans shell), sinon `npm` du PATH. */
function npmCommand() {
  const bin = dirname(process.execPath);
  const candidates = [
    join(bin, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    join(bin, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  ];
  const cli = candidates.find((file) => existsSync(file));
  return cli ? [process.execPath, [cli]] : ['npm', []];
}

/** npm hors réseau (`--offline`), jeton factice, hors détection CI (aucun échange OIDC). */
function npm(args, cwd, userconfig) {
  const env = {
    ...process.env,
    NODE_AUTH_TOKEN: 'jeton-factice',
    npm_config_userconfig: userconfig,
    npm_config_globalconfig: `${userconfig}.global`,
  };
  delete env.GITHUB_ACTIONS;
  delete env.NPM_CONFIG_USERCONFIG;
  delete env.NPM_CONFIG_GLOBALCONFIG;
  const [file, head] = npmCommand();
  const done = spawnSync(file, [...head, ...args, '--offline'], { cwd, env, encoding: 'utf8' });
  return { status: done.status, output: `${done.stdout}${done.stderr}` };
}

/** Registre de la ligne « Publishing to <registre> » de l'essai à blanc, sans barre finale. */
function publishTarget(args) {
  const result = npm([...args, '--dry-run'], REPO, join(root, 'npmrc'));
  expect(result.status, result.output).toBe(0);
  const match = /Publishing to (\S+)/.exec(result.output);
  expect(match, result.output).not.toBeNull();
  return { target: match[1].replace(/\/$/, ''), output: result.output };
}

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'mirror-target-'));
  writeFileSync(join(root, 'npmrc'), SETUP_NODE_NPMRC);
  writeFileSync(join(root, 'npmrc.global'), '');
  const workdir = join(root, 'work');
  mkdirSync(workdir);
  const packed = npm(
    ['pack', '--ignore-scripts', '--pack-destination', workdir],
    join(REPO, 'packages', 'tokens'),
    join(root, 'npmrc'),
  );
  expect(packed.status, packed.output).toBe(0);
  packageDir = prepareMirrorDir(workdir);
}, TIMEOUT);

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('miroir : registre cible de la publication, dans les conditions du job', () => {
  it(
    'témoin : --registry seul cède au registre de portée du .npmrc du dépôt (npmjs)',
    () => {
      const { target } = publishTarget(['publish', packageDir, '--registry', GITHUB_REGISTRY]);
      expect(target).toBe('https://registry.npmjs.org');
    },
    TIMEOUT,
  );

  it(
    'la commande du miroir publie sur GitHub Packages, avec le jeton de setup-node',
    () => {
      const { target, output } = publishTarget(publishArgs(packageDir, SCOPE));
      expect(target).toBe(GITHUB_REGISTRY);
      expect(output).not.toMatch(/requires you to be logged in/);
    },
    TIMEOUT,
  );
});
