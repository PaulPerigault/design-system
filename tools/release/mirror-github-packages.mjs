// Miroir GitHub Packages : lancé par le job `mirror` de release.yml ou par mirror.yml (manuel).
// Jamais en local : `main` refuse de tourner hors de GitHub Actions. Ce refus tient lieu de garde
// `prepublishOnly`, retiré de la copie du miroir (le script du dépôt n'existe pas hors du dépôt).
// Pour chaque paquet public publié sur npmjs et absent du miroir : télécharge le tarball publié,
// réécrit sa copie (`publishConfig`, scripts de cycle de vie), la republie sur GitHub Packages, puis
// vérifie la présence de chaque version. Échec franc sinon.
import { execFileSync } from 'node:child_process';
import { globSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { publishArgs, scopeProblem } from './mirror-plan.mjs';
import { prepareMirrorDir } from './mirror-prepare.mjs';
import { githubHas, npmjsHas } from './mirror-registry.mjs';
import { runMirror } from './mirror-run.mjs';

const NPMJS = 'https://registry.npmjs.org/';
const MINUTE = 60_000;
const WAIT = {
  npm: { maxMs: 10 * MINUTE, intervalMs: 15_000 },
  github: { maxMs: 2 * MINUTE, intervalMs: 10_000 },
  clock: { now: () => Date.now(), sleep: (ms) => new Promise((done) => setTimeout(done, ms)) },
};
const run = (args, options = {}) => execFileSync('npm', args, { encoding: 'utf8', ...options });

/**
 * `--@scope:registry=` en ligne de commande l'emporte sur tout `@scope:registry` des `.npmrc`
 * (celui du dépôt : npmjs ; celui de setup-node : GitHub). `pack` lit npmjs, `publish` vise GitHub.
 */
function publishOne(spec) {
  const workdir = mkdtempSync(join(tmpdir(), 'mirror-'));
  const scope = spec.slice(0, spec.indexOf('/'));
  run(['pack', spec, `--${scope}:registry=${NPMJS}`, '--pack-destination', workdir]);
  const packageDir = prepareMirrorDir(workdir);
  run(publishArgs(packageDir, scope), { stdio: 'inherit' });
}

async function main(env) {
  if (env.GITHUB_ACTIONS !== 'true') throw new Error('mirror : réservé à GitHub Actions');
  const manifests = globSync('packages/*/package.json').map((file) => ({
    dir: dirname(file),
    ...JSON.parse(readFileSync(file, 'utf8')),
  }));
  const owner = env.GITHUB_REPOSITORY_OWNER ?? '';
  const problems = manifests.map(({ name }) => scopeProblem(name, owner)).filter(Boolean);
  if (problems.length > 0) throw new Error(problems.join('\n'));
  const probes = {
    onNpm: npmjsHas(fetch),
    onGithub: githubHas(fetch, { owner, token: env.NODE_AUTH_TOKEN }),
  };
  await runMirror({ manifests, probes, publish: publishOne, wait: WAIT, log: console.log });
}

if (import.meta.main) {
  main(process.env).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
