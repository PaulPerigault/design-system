import { describe, expect, it } from 'vitest';
import { analyze, RULE_IDS } from '@paulperigault/guards/design';
import {
  FIXES,
  imagesWithoutSize,
  inlineStyles,
  unknownTokens,
  validateSnippet,
} from '../src/tools-snippet.mjs';

const deps = {
  analyze,
  ruleIds: RULE_IDS,
  tokenNames: ['--pp-color-fg', '--pp-color-bg', '--pp-space-s'],
};
const validate = (language, code) => validateSnippet({ language, code }, deps);
const rules = (result) => result.violations.map((v) => v.rule);

describe('validate_snippet', () => {
  it('extrait conforme : aucune violation', () => {
    const result = validate(
      'css',
      '.carte { color: var(--pp-color-fg); padding-inline: var(--pp-space-s); }',
    );
    expect(result).toMatchObject({ valid: true, count: 0, violations: [] });
  });

  it('CSS : couleur brute, propriété physique, ombre, avec ligne et correction', () => {
    const code = '.a {\n  color: #ff0000;\n  margin-left: 1rem;\n  box-shadow: 0 1px 2px black;\n}';
    const result = validate('css', code);
    expect(rules(result)).toEqual(
      expect.arrayContaining(['color-literal', 'physical-property', 'shadow']),
    );
    const literal = result.violations.find((v) => v.rule === 'color-literal');
    expect(literal.line).toBe(2);
    expect(literal.fix).toBe(FIXES['color-literal']);
    const physical = result.violations.find((v) => v.rule === 'physical-property');
    expect(physical.message).toMatch(/margin\|padding-block\|inline-start\|end/);
  });

  it('Astro : style en ligne, image sans dimensions, règles du bloc <style>', () => {
    const code = [
      '<div style="color: red">',
      '  <img src="/a.png" alt="">',
      '</div>',
      '<style>.a { background: linear-gradient(red, blue); }</style>',
    ].join('\n');
    const result = validate('astro', code);
    expect(rules(result)).toEqual(
      expect.arrayContaining(['inline-style', 'image-dimensions', 'gradient']),
    );
    expect(result.violations.find((v) => v.rule === 'image-dimensions').line).toBe(2);
  });

  it('jeton inconnu : proposition du jeton proche ; déclaration locale acceptée', () => {
    const result = validate(
      'css',
      '.a { --pp-local: 1px; color: var(--pp-color-fgg); gap: var(--pp-local); }',
    );
    expect(rules(result)).toEqual(['unknown-token']);
    expect(result.violations[0].fix).toMatch(/--pp-color-fg/);
  });

  it('CSS : pas de contrôle de balisage (style, img)', () => {
    expect(validate('css', '/* <img src="a"> */ .a { gap: var(--pp-space-s); }').valid).toBe(true);
  });

  it('Markdown : emoji et phrase générique', () => {
    const result = validate('md', 'Passionné par les solutions innovantes 🚀');
    expect(rules(result).length).toBeGreaterThan(0);
    expect(result.violations.every((v) => typeof v.fix === 'string' && v.fix.length > 0)).toBe(
      true,
    );
  });

  it('chaque règle des garde-fous a une correction proposée', () => {
    for (const id of RULE_IDS) expect(FIXES[id], id).toBeTypeOf('string');
  });

  it('n’expose aucun nom de fichier', () => {
    const result = validate('css', '.a { color: red; }');
    expect(JSON.stringify(result)).not.toMatch(/extrait/);
  });
});

describe('contrôles de balisage', () => {
  it('img avec width et height : accepté', () => {
    expect(imagesWithoutSize('<img src="a" width="10" height="10" alt="">')).toEqual([]);
    expect(imagesWithoutSize('<img src="a" width="10" alt="">')).toHaveLength(1);
  });

  it('style en ligne : attribut seulement, pas l’élément <style>', () => {
    expect(inlineStyles('<style>.a{}</style>')).toEqual([]);
    expect(inlineStyles('<p\n  class="x"\n  style={s}>')).toHaveLength(1);
  });

  it('jetons inconnus : numéro de ligne', () => {
    expect(unknownTokens('a\nb { gap: var(--pp-nope) }', ['--pp-space-s'])[0].line).toBe(2);
  });
});
