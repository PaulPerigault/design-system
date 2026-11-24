import { describe, expect, it } from 'vitest';
import { read, strip } from './milestones-3d-css-helpers';

/** Règles `selecteur { déclarations }` d'un fichier, hors `@media`, dans l'ordre. */
function rules(css: string): Map<string, string[]> {
  const found = new Map<string, string[]>();
  for (const match of strip(css).matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
    const selector = (match[1] ?? '').replace(/\s+/g, ' ').trim();
    const declarations = (match[2] ?? '').split(';').map((d) => d.replace(/\s+/g, ' ').trim());
    found.set(
      selector,
      declarations.filter((d) => d !== ''),
    );
  }
  return found;
}

const mode = ['milestones-3d-enhanced.css', 'milestones-3d-badge.css', 'milestones-3d-steps.css']
  .map((name) => rules(read(name)))
  .reduce((all, next) => new Map([...all, ...next]));
const reserve = rules(read('milestones-3d-reserve.css'));
/** Équivalent d'une règle de réservation dans le mode amélioré (même sélecteur, autre attribut). */
const twin = (selector: string): string =>
  selector.replaceAll("[data-reserve='on']", '[data-state]');

describe('empreinte réservée : miroir du mode amélioré (ADR-0014)', () => {
  const mirrored = [...reserve].filter(([selector]) => mode.has(twin(selector)));

  it('recopie au moins le cadre, la scène, le lien, la liste et les entrées', () => {
    expect(mirrored.length).toBeGreaterThanOrEqual(6);
  });

  it.each(mirrored)('%s : mêmes déclarations que le mode amélioré', (selector, declarations) => {
    expect(declarations).toEqual(mode.get(twin(selector)));
  });

  it('la boîte du nom prend celle du bouton d’étape (mêmes dimensions)', () => {
    const name = reserve.get(
      '[data-pp-name]:not(:has(.pp-milestones__select))'.replace(
        /^/,
        ".pp-milestones[data-reserve='on'] ",
      ),
    );
    const button = rules(read('milestones-3d-steps.css')).get('.pp-milestones__select') ?? [];
    for (const declaration of name ?? []) {
      if (
        /^(box-sizing|inline-size|block-size|min-block-size|padding|border|font-size|text-align)/.test(
          declaration,
        )
      ) {
        expect(button, declaration).toContain(declaration);
      }
    }
  });
});

describe('fichiers sans jeton : aucune valeur brute ni propriété physique', () => {
  it.each(['milestones-3d-sprites.css', 'milestones-3d-reserve-track.css'])('%s', (name) => {
    const css = strip(read(name));
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(/i);
    expect(css).not.toMatch(/(?<![\w.-])[1-9]\d*(?:\.\d+)?(?:px|ms|s)\b/);
    expect(css).not.toMatch(/(?<![\w-])(?:left|right|top|bottom|width|height)\s*:/);
    expect(css).not.toMatch(/animation|transition|filter:|opacity:/);
  });

  it('couvre 1 à 25 étapes (24 jalons et l’objectif)', () => {
    const css = read('milestones-3d-reserve-track.css');
    for (let count = 1; count <= 25; count += 1) expect(css).toContain(`data-pp-count='${count}'`);
  });
});
