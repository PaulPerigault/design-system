// Miroir GitHub Packages : prépare un tarball publié à republier, partagé par le script du
// miroir et par son test d'intégration (le test exerce donc le code réel, pas une copie).
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { mirrorManifest } from './mirror-manifest.mjs';

/** Extrait le tarball (`package/`) dans `workdir`. `cwd` + nom relatif : tar GNU lit `C:` comme un hôte. */
export function extractTarball(workdir) {
  const tarball = readdirSync(workdir).find((name) => name.endsWith('.tgz'));
  if (!tarball) throw new Error(`aucun tarball .tgz dans ${workdir}`);
  execFileSync('tar', ['-xzf', tarball], { cwd: workdir });
  return join(workdir, 'package');
}

/** Réécrit le `package.json` de la copie extraite ; le tarball d'origine reste intact. */
export function rewriteExtracted(packageDir) {
  const file = join(packageDir, 'package.json');
  const manifest = mirrorManifest(JSON.parse(readFileSync(file, 'utf8')));
  writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
}

/** @returns {string} dossier prêt pour `npm publish` : extrait puis réécrit */
export function prepareMirrorDir(workdir) {
  const packageDir = extractTarball(workdir);
  rewriteExtracted(packageDir);
  return packageDir;
}
