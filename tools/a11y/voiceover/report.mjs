// Rapport au format de la section 5 de la procédure manuelle (docs/a11y/manual-checklist.md).
const MARK = { conforme: 'non', écart: 'oui', 'non testé': 'non testé' };
const cell = (text) => String(text).replaceAll('|', '\\|');
const row = (cells) => `| ${cells.map(cell).join(' | ')} |`;

/** @returns {string} le texte Markdown du rapport */
export function renderReport({ date, environment, commit, components, common }) {
  const gaps = [...components, ...common.flatMap((p) => p.points)].filter(
    (e) => e.result === 'écart',
  );
  return [
    `# Résultats VoiceOver : ${date}`,
    '',
    'Produit par `npm run a11y:voiceover` (macOS, non testé sous Windows ni en CI). Les attentes sont',
    'évaluées par motifs sur le texte prononcé : un « conforme » n’est pas une écoute, un « écart » est à écouter.',
    '',
    'Version du système, du navigateur et du lecteur d’écran :',
    '',
    `- ${environment}`,
    '',
    `Commit ou version testée : ${commit}`,
    '',
    '## Résultats par page et par composant',
    '',
    row(['Page ou composant', 'Plateforme', 'Attendu', 'Constaté', 'Écart (oui ou non)']),
    row(['---', '---', '---', '---', '---']),
    ...components.map((c) =>
      row([`${c.component} (${c.element})`, 'VO macOS', c.expected, c.result, MARK[c.result]]),
    ),
    '',
    '## Points communs',
    '',
    row(['Point', 'Plateforme', 'Résultat', 'Commentaire']),
    row(['---', '---', '---', '---']),
    ...common.flatMap((p) =>
      p.points.map((pt) => row([`${pt.label}`, 'VO macOS', pt.result, p.page])),
    ),
    '',
    '## Écarts à traiter',
    '',
    ...(gaps.length === 0
      ? ['- Aucun écart relevé par les motifs.']
      : gaps.map((g) => `- ${g.label ?? `${g.component} : ${g.element}`} (écart à écouter)`)),
    '',
  ].join('\n');
}
