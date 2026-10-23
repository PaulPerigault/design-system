// SBOM CycloneDX de chaque paquet publiable (`npm sbom`, intégré à npm 11) : un fichier JSON par
// paquet dans le dossier donné. Utilisé par le workflow `supply-chain` (artefact) et par la
// publication (SBOM de la version publiée).
import { execFileSync } from 'node:child_process';
import { globSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const SBOM_BUFFER = 64 * 1024 * 1024;

/** Nom de fichier d'un paquet : `@paulperigault/tokens` → `paulperigault-tokens.cdx.json`. */
export const fileNameOf = (name) => `${name.replace(/^@/, '').replace('/', '-')}.cdx.json`;

/** Arguments de `npm sbom` pour un paquet du monorepo. */
export const sbomArgs = (name) => [
  'sbom',
  '--sbom-format',
  'cyclonedx',
  '--sbom-type',
  'library',
  '--package-lock-only',
  '-w',
  name,
];

/**
 * Écrit un SBOM par paquet non privé.
 * @param {{ manifests: { name: string, private?: boolean }[], outDir: string,
 *   npm: (args: string[]) => string, write: (path: string, text: string) => void }} input
 * @returns {string[]} fichiers écrits
 */
export function writeSboms({ manifests, outDir, npm, write }) {
  return manifests
    .filter((manifest) => !manifest.private)
    .map((manifest) => {
      const path = `${outDir}/${fileNameOf(manifest.name)}`;
      write(path, npm(sbomArgs(manifest.name)));
      return path;
    });
}

if (import.meta.main) {
  const outDir = process.argv[2] ?? 'sbom';
  mkdirSync(outDir, { recursive: true });
  const manifests = globSync('packages/*/package.json').map((file) =>
    JSON.parse(readFileSync(file, 'utf8')),
  );
  const written = writeSboms({
    manifests,
    outDir,
    npm: (args) => execFileSync('npm', args, { encoding: 'utf8', maxBuffer: SBOM_BUFFER }),
    write: writeFileSync,
  });
  process.stdout.write(`sbom : ${written.length} fichier(s) dans ${outDir}\n`);
}
