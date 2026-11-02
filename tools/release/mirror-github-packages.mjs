// Miroir GitHub Packages : à lancer par le job `mirror` de release.yml, APRÈS la publication npm.
// Jamais en local (le garde ci-dessous). Pour chaque paquet publié sur npmjs et absent du miroir :
// télécharge le tarball publié, réécrit son `publishConfig`, le republie sur GitHub Packages.
// NON EXÉCUTÉ : écrit avant la première publication (D-135) ; le plan pur est testé.
import { execFileSync } from 'node:child_process';
import { globSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { GITHUB_REGISTRY, mirrorManifest, mirrorPlan, scopeProblem } from './mirror-plan.mjs';

const NPMJS = 'https://registry.npmjs.org/';
const run = (args, options = {}) => execFileSync('npm', args, { encoding: 'utf8', ...options });
const exists = (registry) => (name, version) => {
  try {
    run(['view', `${name}@${version}`, 'version', '--registry', registry], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
};

function mirrorOne(spec, workdir) {
  run(['pack', spec, '--registry', NPMJS, '--pack-destination', workdir]);
  const tarball = globSync(join(workdir, '*.tgz')).at(0);
  execFileSync('tar', ['-xzf', tarball, '-C', workdir]);
  const file = join(workdir, 'package', 'package.json');
  const manifest = mirrorManifest(JSON.parse(readFileSync(file, 'utf8')));
  writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
  run(['publish', join(workdir, 'package'), '--registry', GITHUB_REGISTRY], { stdio: 'inherit' });
}

if (import.meta.main) {
  if (process.env.GITHUB_ACTIONS !== 'true')
    throw new Error('mirror : réservé au workflow release');
  const manifests = globSync('packages/*/package.json').map((file) => ({
    dir: dirname(file),
    ...JSON.parse(readFileSync(file, 'utf8')),
  }));
  const owner = process.env.GITHUB_REPOSITORY_OWNER ?? '';
  const problems = manifests.map(({ name }) => scopeProblem(name, owner)).filter(Boolean);
  if (problems.length > 0) throw new Error(problems.join('\n'));
  const state = { onNpm: exists(NPMJS), onGithub: exists(GITHUB_REGISTRY) };
  const { toMirror, skipped } = mirrorPlan(manifests, state);
  for (const { name, why } of skipped) console.log(`ignoré : ${name} (${why})`);
  for (const spec of toMirror) {
    console.log(`miroir : ${spec}`);
    mirrorOne(spec, mkdtempSync(join(tmpdir(), 'mirror-')));
  }
}
