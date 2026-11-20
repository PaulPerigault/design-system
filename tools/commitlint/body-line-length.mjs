// Règle commitlint « longueur des lignes du corps » : 100 caractères au plus (valeur de
// `@commitlint/config-conventional`), sauf pour un message de montée de version générée par
// Dependabot (`chore(deps): bump …`), dont le corps recopie les notes de version du paquet, et pour
// la PR de release-please (`chore: release main`), dont le corps est le changelog généré.
// Les autres règles, dont l'absence de signature d'outil, restent appliquées à ces messages.

const MAX_LINE = 100;
const GENERATED_HEADER = /^(chore\(deps(-dev)?\): bump |chore: release main$)/;

/** Règle au format commitlint : `[valide, message]`. */
export const bodyLineLength = (parsed) => {
  if (GENERATED_HEADER.test(parsed.header ?? '')) return [true];
  const longest = (parsed.body ?? '').split('\n').findIndex((line) => [...line].length > MAX_LINE);
  return [longest === -1, `les lignes du corps ne dépassent pas ${MAX_LINE} caractères`];
};
