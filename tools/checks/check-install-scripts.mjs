// Chaîne d'approvisionnement : un paquet qui exécute un script à l'installation (`hasInstallScript`
// dans le lockfile) est une porte d'entrée connue des paquets compromis. Seuls ceux de la liste
// blanche sont admis ; l'installation reste de toute façon lancée avec `--ignore-scripts`.
import { readFileSync } from 'node:fs';

/** nom du paquet → raison de l'admission */
export const ALLOWED = Object.freeze({
  fsevents: 'optionnel, macOS seulement, binaire natif de surveillance de fichiers',
});
const PREFIX = 'node_modules/';

const nameOf = (path) => path.slice(path.lastIndexOf(PREFIX) + PREFIX.length);

/** @returns {string[]} paquets du lockfile avec script d'installation hors liste blanche */
export function installScriptProblems(lock, allowed = ALLOWED) {
  return Object.entries(lock.packages ?? {})
    .filter(([path, entry]) => path.includes(PREFIX) && entry.hasInstallScript === true)
    .map(([path, entry]) => ({ name: nameOf(path), version: entry.version }))
    .filter(({ name }) => !Object.hasOwn(allowed, name))
    .map(({ name, version }) => `${name}@${version} : script d'installation non admis`);
}

export function run(read = (file) => readFileSync(file, 'utf8')) {
  return installScriptProblems(JSON.parse(read('package-lock.json')));
}

if (import.meta.main) {
  const problems = run();
  for (const problem of problems) console.error(problem);
  if (problems.length > 0) process.exit(1);
  console.log('check-install-scripts: OK (liste blanche respectée)');
}
