// Miroir GitHub Packages : logique pure. npmjs reste la source ; le miroir republie, après la
// publication npm, le tarball publié avec un `publishConfig` pointant vers GitHub Packages.
export const GITHUB_REGISTRY = 'https://npm.pkg.github.com';

/**
 * Arguments de la commande de publication de la copie du miroir. npm choisit d'abord le registre
 * de la portée du paquet (`@scope:registry`), puis seulement `registry` ; le `.npmrc` du dépôt fixe
 * `@paulperigault:registry` sur npmjs. `--registry` seul ne suffit donc pas : la ligne de commande,
 * prioritaire sur tout `.npmrc`, fixe aussi le registre de la portée.
 */
export function publishArgs(packageDir, scope) {
  return [
    'publish',
    packageDir,
    '--registry',
    GITHUB_REGISTRY,
    `--${scope}:registry=${GITHUB_REGISTRY}`,
  ];
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
 * @returns {{ toMirror: string[], skipped: { name: string, why: string }[], missing: string[] }}
 *   `missing` : paquets publics absents de npmjs (après attente) ; le job doit échouer.
 */
export function mirrorPlan(manifests, { onNpm, onGithub }) {
  const plan = { toMirror: [], skipped: [], missing: [] };
  for (const { name, version, private: isPrivate } of manifests) {
    const spec = `${name}@${version}`;
    if (isPrivate) plan.skipped.push({ name, why: 'privé' });
    else if (!onNpm(name, version)) plan.missing.push(spec);
    else if (onGithub(name, version)) plan.skipped.push({ name, why: 'déjà sur GitHub Packages' });
    else plan.toMirror.push(spec);
  }
  return plan;
}
