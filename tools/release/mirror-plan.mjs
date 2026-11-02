// Miroir GitHub Packages (#130) : logique pure. npmjs reste la source ; le miroir republie, après la
// publication npm, le tarball publié avec un `publishConfig` pointant vers GitHub Packages.
export const GITHUB_REGISTRY = 'https://npm.pkg.github.com';

/** @returns {object} manifeste du miroir : registre GitHub, plus de provenance (non documentée là-bas) */
export function mirrorManifest(manifest) {
  const kept = { ...manifest.publishConfig };
  delete kept.provenance;
  return { ...manifest, publishConfig: { ...kept, registry: GITHUB_REGISTRY, access: 'public' } };
}

/** Un nom de paquet de miroir doit être dans le scope du propriétaire, en minuscules. */
export function scopeProblem(name, owner) {
  const scope = `@${owner.toLowerCase()}/`;
  if (name !== name.toLowerCase()) return `${name} : le nom doit être en minuscules`;
  return name.startsWith(scope) ? null : `${name} : hors du scope ${scope}`;
}

/**
 * @param {{ name: string, version: string, private?: boolean }[]} manifests paquets du dépôt
 * @param {{ onNpm: (name: string, version: string) => boolean, onGithub: (name: string, version: string) => boolean }} state
 * @returns {{ toMirror: string[], skipped: { name: string, why: string }[] }}
 */
export function mirrorPlan(manifests, { onNpm, onGithub }) {
  const toMirror = [];
  const skipped = [];
  for (const { name, version, private: isPrivate } of manifests) {
    const why = skipReason(name, version, { isPrivate, onNpm, onGithub });
    if (why) skipped.push({ name, why });
    else toMirror.push(`${name}@${version}`);
  }
  return { toMirror, skipped };
}

function skipReason(name, version, { isPrivate, onNpm, onGithub }) {
  if (isPrivate) return 'privé';
  if (!onNpm(name, version)) return 'pas encore publié sur npmjs (npmjs d’abord)';
  if (onGithub(name, version)) return 'déjà sur GitHub Packages';
  return null;
}
