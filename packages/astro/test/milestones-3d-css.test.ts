import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { dataBlock, formatDate } from '../src/content/milestones-3d-model';

const read = (name: string): string =>
  readFileSync(new URL(`../../css/src/${name}`, import.meta.url), 'utf8');
const tokens = JSON.parse(
  readFileSync(new URL('../../tokens/generated/tokens.json', import.meta.url), 'utf8'),
) as { base: object; themes: Record<string, object> };
const known = new Set([
  ...Object.keys(tokens.base),
  ...Object.values(tokens.themes).flatMap((theme) => Object.keys(theme)),
]);
const strip = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');

describe.each(['milestones-3d.css', 'milestones-3d-enhanced.css'])('%s', (name) => {
  const css = strip(read(name));

  it('ne référence que des jetons --pp-* existants', () => {
    const used = [...css.matchAll(/var\(\s*(--pp-[\w-]+)/g)].map((match) => match[1] ?? '');
    expect(used.length).toBeGreaterThan(0);
    for (const token of used) expect(known.has(token), token).toBe(true);
  });

  it('ne contient aucune couleur, taille en px ni durée en dur', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/i);
    expect(css).not.toMatch(/(?<![\w.-])[1-9]\d*(?:\.\d+)?(?:px|ms|s)\b/);
  });

  it('n’utilise que des propriétés logiques', () => {
    expect(css).not.toMatch(
      /(?:margin|padding|border)-(?:left|right|top|bottom)\b|(?<![\w-])(?:left|right|top|bottom|width|height)\s*:/,
    );
  });

  it('ne pose ni ombre, ni dégradé, ni flou, ni animation', () => {
    expect(css).not.toMatch(
      /box-shadow|text-shadow|gradient|backdrop-filter|filter:|animation|transition/,
    );
  });
});

describe('états du composant', () => {
  const base = strip(read('milestones-3d.css'));
  const enhanced = strip(read('milestones-3d-enhanced.css'));

  it('importe la feuille du mode amélioré depuis la feuille principale', () => {
    expect(base).toMatch(/@import '\.\/milestones-3d-enhanced\.css';/);
  });

  it('masque l’emplacement de la scène sans état, et ne masque jamais la liste', () => {
    expect(enhanced).toMatch(/\.pp-milestones__stage\s*\{\s*display:\s*none/);
    expect(enhanced).toMatch(/\.pp-milestones\[data-state\] \.pp-milestones__stage\s*\{/);
    expect(`${base}${enhanced}`).not.toMatch(/__list[^{]*\{[^}]*display:\s*none/);
  });

  it('laisse le défilement vertical au navigateur sur le canvas', () => {
    expect(enhanced).toMatch(/\.pp-milestones__canvas\s*\{[^}]*touch-action:\s*pan-y/);
  });

  it('garantit des cibles tactiles minimales aux liens et aux boutons', () => {
    expect(base).toMatch(
      /\.pp-milestones__link,\s*\.pp-milestones__select\s*\{[^}]*min-block-size:\s*var\(--pp-size-target-min\)/,
    );
  });

  it('marque le jalon actif par plus que la couleur', () => {
    const active = /\[aria-pressed='true'\]\s*\{([^}]*)\}/.exec(enhanced)?.[1] ?? '';
    expect(active).toContain('border-color');
    expect(active).toContain('font-weight');
  });

  it('distingue les jalons prévus par le trait, en plus du mot « Prévu »', () => {
    expect(base).toMatch(/\[data-status='planned'\]\s*\{[^}]*border-inline-start-style:\s*dashed/);
  });
});

describe('formatDate et dataBlock', () => {
  it('formate un mois et un jour dans la langue demandée', () => {
    expect(formatDate('2025-03', 'fr')).toEqual({ text: 'mars 2025', datetime: '2025-03' });
    expect(formatDate('2025-03-05', 'en').text).toBe('March 5, 2025');
  });

  it('rend le texte brut sans datetime pour une date inexistante ou mal formée', () => {
    for (const bad of ['2025-13', '2025-00', '2025-04-31', '2025-4', 'hier'])
      expect(formatDate(bad, 'fr')).toEqual({ text: bad });
  });

  it('ne dérive pas d’un jour au changement d’année (fuseau UTC)', () => {
    expect(formatDate('2025-01-01', 'fr').text).toBe('1 janvier 2025');
    expect(formatDate('2024-12-31', 'fr').text).toBe('31 décembre 2024');
  });

  it('sérialise sans cible quand elle est absente', () => {
    expect(JSON.parse(dataBlock([]))).toEqual({ milestones: [] });
  });
});
