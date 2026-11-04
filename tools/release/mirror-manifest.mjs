// Miroir GitHub Packages (#130, #308) : réécriture pure du manifeste de la COPIE à republier.
// Le tarball publié sur npmjs n'est jamais touché. La copie vit hors du dépôt : un script de cycle
// de vie qui vise un fichier du dépôt (`prepublishOnly` : ../../tools/checks/...) n'y résout plus.
import { GITHUB_REGISTRY } from './mirror-plan.mjs';

/** Scripts que `npm publish` (ou `npm pack`) exécute tout seul sur un dossier. Rien d'autre n'est retiré. */
export const LIFECYCLE_SCRIPTS = [
  'prepublish',
  'prepublishOnly',
  'prepare',
  'prepack',
  'postpack',
  'publish',
  'postpublish',
];

export class ManifestError extends Error {
  constructor(detail) {
    super(`manifeste du miroir invalide : ${detail}`);
    this.name = 'ManifestError';
  }
}

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

function withoutLifecycle(scripts) {
  if (!isObject(scripts)) throw new ManifestError('`scripts` doit être un objet');
  return Object.fromEntries(
    Object.entries(scripts).filter(([id]) => !LIFECYCLE_SCRIPTS.includes(id)),
  );
}

/**
 * @param {Record<string, unknown>} manifest manifeste du tarball publié (non modifié)
 * @returns {Record<string, unknown>} copie : registre GitHub, sans provenance, sans script de cycle de vie
 */
export function mirrorManifest(manifest) {
  if (!isObject(manifest)) throw new ManifestError('le manifeste doit être un objet');
  if (manifest.publishConfig !== undefined && !isObject(manifest.publishConfig)) {
    throw new ManifestError('`publishConfig` doit être un objet');
  }
  const kept = { ...manifest.publishConfig };
  delete kept.provenance;
  const mirrored = {
    ...manifest,
    publishConfig: { ...kept, registry: GITHUB_REGISTRY, access: 'public' },
  };
  if (manifest.scripts !== undefined) mirrored.scripts = withoutLifecycle(manifest.scripts);
  return mirrored;
}
