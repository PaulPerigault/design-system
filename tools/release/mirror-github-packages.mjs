// Miroir GitHub Packages : lancé par le job `mirror` de release.yml ou par mirror.yml (manuel).
// Jamais en local (garde ci-dessous). Pour chaque paquet public publié sur npmjs et absent du miroir :
// télécharge le tarball publié, réécrit son `publishConfig`, le republie sur GitHub Packages.
// Le job échoue si un paquet public n'est ni sur GitHub Packages à la fin ni légitimement ignoré.
import { execFileSync } from 'node:child_process';
import { globSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { GITHUB_REGISTRY, mirrorManifest, mirrorPlan, scopeProblem } from './mirror-plan.mjs';
import { githubHas, npmjsHas, waitFor } from './mirror-registry.mjs';

const NPMJS = 'https://registry.npmjs.org/';
const MINUTE = 60_000;
const NPM_WAIT = { maxMs: 10 * MINUTE, intervalMs: 15_000 };
const GITHUB_WAIT = { maxMs: 2 * MINUTE, intervalMs: 10_000 };
const run = (args, options = {}) => execFileSync('npm', args, { encoding: 'utf8', ...options });
const clock = { now: () => Date.now(), sleep: (ms) => new Promise((done) => setTimeout(done, ms)) };

/** `--@scope:registry=` l'emporte sur le `@scope:registry` écrit par setup-node dans .npmrc. */
function mirrorOne(spec, workdir) {
  const scope = spec.slice(0, spec.indexOf('/'));
  run(['pack', spec, `--${scope}:registry=${NPMJS}`, '--pack-destination', workdir]);
  const tarball = globSync(join(workdir, '*.tgz')).at(0);
  execFileSync('tar', ['-xzf', tarball, '-C', workdir]);
  const file = join(workdir, 'package', 'package.json');
  const manifest = mirrorManifest(JSON.parse(readFileSync(file, 'utf8')));
  writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
  run(['publish', join(workdir, 'package'), '--registry', GITHUB_REGISTRY], { stdio: 'inherit' });
}

const split = (spec) => ({
  name: spec.slice(0, spec.lastIndexOf('@')),
  version: spec.slice(spec.lastIndexOf('@') + 1),
});
const toSpecs = (manifests) =>
  manifests.filter((m) => !m.private).map(({ name, version }) => ({ name, version }));

async function main(env) {
  if (env.GITHUB_ACTIONS !== 'true') throw new Error('mirror : réservé à GitHub Actions');
  const manifests = globSync('packages/*/package.json').map((file) => ({
    dir: dirname(file),
    ...JSON.parse(readFileSync(file, 'utf8')),
  }));
  const owner = env.GITHUB_REPOSITORY_OWNER ?? '';
  const problems = manifests.map(({ name }) => scopeProblem(name, owner)).filter(Boolean);
  if (problems.length > 0) throw new Error(problems.join('\n'));
  const onGithub = githubHas(fetch, { owner, token: env.NODE_AUTH_TOKEN });
  const specs = toSpecs(manifests);
  const npm = await waitFor(specs, npmjsHas(fetch), { ...NPM_WAIT, ...clock });
  const gh = await waitFor(specs, onGithub, { maxMs: 0, intervalMs: 0, ...clock });
  const state = {
    onNpm: (n, v) => npm.found.has(`${n}@${v}`),
    onGithub: (n, v) => gh.found.has(`${n}@${v}`),
  };
  const { toMirror, skipped, missing } = mirrorPlan(manifests, state);
  for (const { name, why } of skipped) console.log(`ignoré : ${name} (${why})`);
  for (const spec of toMirror) {
    console.log(`miroir : ${spec}`);
    mirrorOne(spec, mkdtempSync(join(tmpdir(), 'mirror-')));
  }
  const after = await waitFor(toMirror.map(split), onGithub, { ...GITHUB_WAIT, ...clock });
  const failures = [
    ...missing.map((s) => `${s} : absent de npmjs après attente`),
    ...after.missing.map((s) => `${s} : absent de GitHub Packages après publication`),
  ];
  if (failures.length > 0) throw new Error(`miroir incomplet :\n${failures.join('\n')}`);
}

if (import.meta.main) {
  main(process.env).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
