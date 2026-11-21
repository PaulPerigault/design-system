/** Texte de progression du comportement : `{current}` et `{total}` remplacés. */
export const progressText = (template: string, current: number, total: number): string =>
  template.replace('{current}', String(current)).replace('{total}', String(total));
