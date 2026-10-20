// Règle commitlint « aucune signature d'outil » : refuse toute ligne `Co-authored-by` et toute
// mention « Generated with », où qu'elles soient dans le message (sujet, corps, pied).
// Sans exemption : elle s'applique aussi aux sujets terminés par `(#n)`.

const SIGNATURES = [
  { pattern: /^\s*co-authored-by\s*:/im, label: 'ligne « Co-authored-by »' },
  { pattern: /generated\s+with/i, label: 'mention « Generated with »' },
];

/**
 * @param {string} message message de commit complet
 * @returns {string[]} signatures trouvées (vide si le message est propre)
 */
export function toolSignatures(message) {
  return SIGNATURES.filter(({ pattern }) => pattern.test(message)).map(({ label }) => label);
}

/** Règle au format commitlint : `[valide, message]`. */
export const noToolSignature = (parsed) => {
  const found = toolSignatures(parsed.raw ?? '');
  return [found.length === 0, `signature d'outil interdite : ${found.join(', ')}`];
};
