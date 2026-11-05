// Miroir GitHub Packages : déroulé complet, dépendances injectées (sondes, publication,
// horloge, journal). L'ordre est le contrat : sondes, publications, PUIS contrôle de présence final.
import { mirrorPlan } from './mirror-plan.mjs';
import { waitFor } from './mirror-registry.mjs';
import { verifyOnGithub } from './mirror-verify.mjs';

export class MirrorError extends Error {
  constructor(failures) {
    super(`miroir incomplet :\n${failures.join('\n')}`);
    this.name = 'MirrorError';
    this.failures = failures;
  }
}

const toSpecs = (manifests) =>
  manifests.filter((m) => !m.private).map(({ name, version }) => ({ name, version }));

/**
 * @param {object} deps
 * @param {{ name: string, version: string, private?: boolean }[]} deps.manifests
 * @param {{ onNpm: Function, onGithub: Function }} deps.probes sondes (name, version) => Promise<boolean>
 * @param {(spec: string) => void} deps.publish republie `nom@version` sur GitHub Packages
 * @param {{ npm: object, github: object, clock: object }} deps.wait attentes et horloge
 * @param {(line: string) => void} deps.log
 */
export async function runMirror({ manifests, probes, publish, wait, log }) {
  const specs = toSpecs(manifests);
  const npm = await waitFor(specs, probes.onNpm, { ...wait.npm, ...wait.clock });
  const now = { maxMs: 0, intervalMs: 0, ...wait.clock };
  const gh = await waitFor(specs, probes.onGithub, now);
  const state = {
    onNpm: (n, v) => npm.found.has(`${n}@${v}`),
    onGithub: (n, v) => gh.found.has(`${n}@${v}`),
  };
  const { toMirror, skipped, missing } = mirrorPlan(manifests, state);
  for (const { name, why } of skipped) log(`ignoré : ${name} (${why})`);
  for (const spec of toMirror) {
    log(`miroir : ${spec}`);
    publish(spec);
  }
  const absent = await verifyOnGithub(specs, probes.onGithub, { ...wait.github, ...wait.clock });
  const failures = [...missing.map((s) => `${s} : absent de npmjs après attente`), ...absent];
  if (failures.length > 0) throw new MirrorError(failures);
}
