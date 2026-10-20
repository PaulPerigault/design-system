// Publication CI uniquement (workflow release, OIDC) : chaque paquet de packages/* dont la version
// n'existe pas encore sur npmjs est publié avec provenance ; une préversion (`1.0.0-next.1`)
// part sous le dist-tag `next`, jamais `latest`. La garde prepublishOnly refuse tout poste local.
import { execFileSync } from 'node:child_process';
import { globSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

/** Dist-tag d'une version : `next` pour une préversion, sinon `latest`. */
export const distTag = (version) => (version.includes('-') ? 'next' : 'latest');

/** Paquets à publier : manifestes non privés dont la version est absente du registre. */
export function toPublish(manifests, published) {
  return manifests.filter(
    ({ manifest }) => !manifest.private && !published(manifest.name, manifest.version),
  );
}

const publishedOnNpm = (name, version) => {
  try {
    execFileSync('npm', ['view', `${name}@${version}`, 'version'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
};

if (import.meta.main) {
  const manifests = globSync('packages/*/package.json').map((file) => ({
    dir: dirname(file),
    manifest: JSON.parse(readFileSync(file, 'utf8')),
  }));
  for (const { dir, manifest } of toPublish(manifests, publishedOnNpm)) {
    const tag = distTag(manifest.version);
    console.log(`Publication de ${manifest.name}@${manifest.version} (tag ${tag})`);
    execFileSync('npm', ['publish', '--provenance', '--access', 'public', '--tag', tag], {
      cwd: dir,
      stdio: 'inherit',
    });
  }
}
