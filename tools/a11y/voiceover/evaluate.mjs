// Évalue un texte prononcé (liste de phrases) contre des attentes à motifs. Pur, testé.
/** @returns {'conforme' | 'écart' | 'non testé'} */
export function verdict(phrases, { pattern, first = false }) {
  if (phrases.length === 0) return 'non testé';
  const scope = first ? phrases.slice(0, 1) : phrases;
  return scope.some((phrase) => pattern.test(phrase)) ? 'conforme' : 'écart';
}

/** Points communs d'une page : un verdict par point. */
export function evaluateCommon(phrases, common) {
  return common.map((point) => ({ ...point, result: verdict(phrases, point) }));
}

/** Composants : un verdict par attente, sur le texte prononcé de la page du composant. */
export function evaluateComponents(spokenByPage, components) {
  return components.flatMap((component) =>
    component.checks.map((check) => ({
      component: component.id,
      page: component.page,
      ...check,
      result: verdict(spokenByPage.get(component.page) ?? [], check),
    })),
  );
}
