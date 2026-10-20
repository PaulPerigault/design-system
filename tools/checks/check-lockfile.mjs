// Garde-fou de la chaîne d'approvisionnement : chaque paquet du lockfile vient du registre npmjs
// public, et aucune dépendance déclarée n'est `file:` ou `link:` (sauf les liens internes du
// monorepo, que npm écrit `"link": true` sans `resolved`).
import { readFileSync } from 'node:fs';

export const REGISTRY = 'https://registry.npmjs.org/';
const LOCAL_SPEC = /^(?:file|link):/;

/** @returns {string[]} problèmes du lockfile (objet `package-lock.json` v3) */
export function lockfileProblems(lock) {
  return Object.entries(lock.packages ?? {})
    .filter(([path]) => path.includes('node_modules/'))
    .flatMap(([path, entry]) => {
      if (entry.link) return [];
      if (!entry.resolved) return [`${path} : aucune source « resolved »`];
      return entry.resolved.startsWith(REGISTRY)
        ? []
        : [`${path} : source hors npmjs (${entry.resolved})`];
    });
}

/** @returns {string[]} dépendances `file:`/`link:` d'un package.json */
export function localSpecs(manifest, name = 'package.json') {
  const groups = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
  return groups.flatMap((group) =>
    Object.entries(manifest[group] ?? {})
      .filter(([, spec]) => LOCAL_SPEC.test(String(spec)))
      .map(([dep, spec]) => `${name} : ${group}.${dep} = ${spec}`),
  );
}

export function run({ read = (file) => readFileSync(file, 'utf8'), manifests = [] } = {}) {
  const lock = JSON.parse(read('package-lock.json'));
  const files = ['package.json', ...manifests];
  return [
    ...lockfileProblems(lock),
    ...files.flatMap((file) => localSpecs(JSON.parse(read(file)), file)),
  ];
}

if (import.meta.main) {
  const { globSync } = await import('node:fs');
  const problems = run({ manifests: globSync('{packages,apps}/*/package.json') });
  for (const problem of problems) console.error(problem);
  if (problems.length > 0) process.exit(1);
  console.log('check-lockfile: OK (npmjs uniquement, aucune dépendance file:/link:)');
}
