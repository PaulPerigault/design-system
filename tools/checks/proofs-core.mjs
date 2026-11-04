// Mesure de apps/docs/src/data/proofs.json : analyseurs purs et fusion (les commandes sont injectées).
const FIRST_INT = /\d+/;

/** @returns {number} le premier entier capturé par `re` dans `text` ; lève une erreur sinon */
export function captureInt(text, re, what) {
  const m = re.exec(text);
  if (m === null) throw new Error(`mesure introuvable : ${what}`);
  return Number(FIRST_INT.exec(m[1] ?? m[0])?.[0]);
}

/** Vitest `--reporter=json` : du bruit peut précéder l'objet JSON. */
export function unitTests(stdout) {
  const start = stdout.indexOf('{');
  if (start < 0) throw new Error('mesure introuvable : sortie JSON de Vitest');
  return JSON.parse(stdout.slice(start)).numTotalTests;
}

/** `playwright test --list` : « Total: N tests in M files ». Des tests déclarés, pas exécutés. */
export const e2eDeclared = (stdout) => captureInt(stdout, /Total:\s*(\d+) tests/, 'e2e déclarés');

/** `npm audit signatures` : « N packages have verified attestations ». */
export const attestations = (stdout) =>
  captureInt(stdout, /(\d+) packages? have verified attestations/, 'attestations');

/** Pages HTML de `dist/` (hors Pagefind), chemins relatifs. */
export const pageCount = (files) =>
  files.filter((f) => f.endsWith('index.html') && !f.startsWith('pagefind/')).length;

/** Dossiers de `components/<nom>/index.html`. */
export const componentCount = (files) =>
  files.filter((f) => /^components\/[^/]+\/index\.html$/.test(f)).length;

/** Termes du glossaire : les `<dt` de `glossaire/index.html`. */
export const glossaryTerms = (html) => (html.match(/<dt[\s>]/g) ?? []).length;

/** Paires de `roles.json` : total et répartition par seuil minimal. */
export function contrast(pairs) {
  const minimums = {};
  for (const { min } of [...pairs].sort((a, b) => b.min - a.min)) {
    const key = `${min}:1`;
    minimums[key] = (minimums[key] ?? 0) + 1;
  }
  return { pairs: pairs.length, minimums };
}

/** Fusionne les mesures dans le fichier existant ; tout champ non mesuré reste tel quel. */
export function merge(current, m, date) {
  return {
    ...current,
    measuredOn: date,
    tests: {
      unit: m.unit,
      e2eDeclared: m.e2eDeclared,
      devices: current.tests.devices,
      themes: current.tests.themes,
    },
    content: {
      pages: m.pages,
      components: m.components,
      registryItems: m.registryItems,
      glossaryTerms: m.glossaryTerms,
    },
    accessibility: {
      ...current.accessibility,
      contrastPairs: m.contrast.pairs,
      contrastMinimums: m.contrast.minimums,
    },
    security: {
      ...current.security,
      auditSignatures: `${m.attestations} paquets avec attestations vérifiées`,
    },
  };
}
