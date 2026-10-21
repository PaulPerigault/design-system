import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Focal, Ratio } from '../src/media/types';

const css = readFileSync(new URL('../src/media/frame.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');

// Listes complètes : `satisfies` refuse une valeur inconnue, le test d'exhaustivité ci-dessous
// échoue si `types.ts` gagne un membre absent ici.
const RATIOS = ['portrait', 'square', 'landscape', 'wide'] as const satisfies readonly Ratio[];
const FOCALS = [
  'center',
  'top',
  'bottom',
  'left',
  'right',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
] as const satisfies readonly Focal[];

type Missing<T, L extends readonly T[]> = Exclude<T, L[number]>;
const exhaustive: [Missing<Ratio, typeof RATIOS>, Missing<Focal, typeof FOCALS>] extends [
  never,
  never,
]
  ? true
  : false = true;

const rule = (selector: string): string => {
  const start = declarations.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`règle absente : ${selector}`);
  return declarations.slice(start, declarations.indexOf('}', start));
};

describe('frame.css', () => {
  it('listes exhaustives des Ratio et Focal de types.ts', () => {
    expect(exhaustive).toBe(true);
  });

  it.each(RATIOS)('ratio %s : aspect-ratio lu dans le token', (ratio) => {
    expect(rule(`.pp-media[data-ratio='${ratio}']`)).toContain(
      `aspect-ratio: var(--pp-ratio-${ratio});`,
    );
  });

  it.each(FOCALS)('focal %s : object-position par mots-clés', (focal) => {
    const value = /object-position: ([^;]+);/.exec(rule(`.pp-media[data-focal='${focal}'] img`));
    expect(value?.[1]).toMatch(/^(left|right|center|top|bottom)( (top|bottom|center))?$/);
  });

  it('cadre : rayon, fond d’attente et filet par tokens', () => {
    expect(rule('.pp-media')).toContain('border-radius: var(--pp-media-radius);');
    expect(rule('.pp-media')).toContain('background-color: var(--pp-color-media-placeholder);');
    expect(rule('.pp-media[data-rule]')).toContain(
      'border: var(--pp-media-rule) solid var(--pp-color-line);',
    );
  });

  it('aucune longueur ni couleur brute, aucune propriété physique', () => {
    expect(declarations).not.toMatch(/\d(px|rem|em)\b|#[0-9a-f]{3,8}\b|rgb|hsl|oklch/i);
    // Seul pourcentage admis : 100 % (l'image remplit le cadre).
    expect(declarations.match(/\d+%/g) ?? []).toSatisfy((list: string[]) =>
      list.every((value) => value === '100%'),
    );
    expect(declarations).not.toMatch(/\b(width|height|top|left|right|bottom)\s*:/);
  });
});
