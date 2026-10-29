import { describe, expect, it } from 'vitest';
import { MAX_STACK_LENGTH, parseFontStack } from '../../src/customize/font-stack.ts';
import { parseAccentHue } from '../../src/customize/hue.ts';
import { parseBuildInput } from '../../src/customize/input.ts';

const codeOf = (result: { ok: boolean; error?: { code: string } }): string | undefined =>
  result.ok ? undefined : result.error?.code;

describe('parseAccentHue', () => {
  it.each([0, 25.5, 270.7, 360])('accepte %s', (hue) => {
    expect(parseAccentHue(hue)).toEqual({ ok: true, value: hue });
  });

  it('accepte l’écriture décimale d’un argument de ligne de commande', () => {
    expect(parseAccentHue(' 145 ')).toEqual({ ok: true, value: 145 });
  });

  it.each([undefined, null, '', '  '])('teinte absente : %s', (raw) => {
    expect(codeOf(parseAccentHue(raw))).toBe('build.hue-missing');
  });

  it.each([Number.NaN, Infinity, -Infinity, 'abc', '12deg', true, {}])(
    'teinte non finie : %s',
    (raw) => {
      expect(codeOf(parseAccentHue(raw))).toBe('build.hue-not-finite');
    },
  );

  it.each([-0.1, 360.1, 720])('hors de 0 à 360 : %s', (raw) => {
    expect(codeOf(parseAccentHue(raw))).toBe('build.hue-out-of-range');
  });
});

describe('parseFontStack', () => {
  it('rend la pile nettoyée des espaces de bord', () => {
    const stack = "'Inter Variable', system-ui, sans-serif";
    expect(parseFontStack(`  ${stack} `)).toEqual({ ok: true, value: stack });
  });

  it.each([undefined, null, 12, '', '   '])('pile vide : %s', (raw) => {
    expect(codeOf(parseFontStack(raw))).toBe('build.stack-empty');
  });

  it('pile trop longue', () => {
    expect(parseFontStack('a'.repeat(MAX_STACK_LENGTH)).ok).toBe(true);
    expect(codeOf(parseFontStack('a'.repeat(MAX_STACK_LENGTH + 1)))).toBe('build.stack-too-long');
  });

  it.each([
    ['fin de déclaration', 'Inter; color: red'],
    ['accolade ouvrante', 'Inter, :root {'],
    ['accolade fermante', 'Inter }'],
    ['url(', "Inter, URL('https://x.test/f.woff2')"],
    ['@import', 'Inter @IMPORT "x.css"'],
    ['retour à la ligne', 'Inter,\nsans-serif'],
    ['retour chariot', 'Inter,\rsans-serif'],
    ['séparateur de ligne Unicode', `Inter,${String.fromCodePoint(0x2028)}sans-serif`],
    ['ouverture de commentaire', 'Inter /* x'],
    ['fermeture de commentaire', 'Inter */'],
    ['guillemet non fermé', "'Inter, sans-serif"],
    ['parenthèse non fermée', 'Inter (, sans-serif'],
  ])('injection CSS refusée : %s', (_cas, raw) => {
    expect(codeOf(parseFontStack(raw))).toBe('build.stack-unsafe');
  });
});

describe('parseBuildInput', () => {
  it('sans entrée ou clé absente : défauts', () => {
    expect(parseBuildInput(undefined)).toEqual({ ok: true, value: {} });
    expect(parseBuildInput({})).toEqual({ ok: true, value: {} });
  });

  it('clé présente mais vide : erreur, pas défaut silencieux', () => {
    expect(codeOf(parseBuildInput({ accentHue: undefined }))).toBe('build.hue-missing');
    expect(codeOf(parseBuildInput({ fontStack: '' }))).toBe('build.stack-empty');
  });

  it('valide les deux entrées', () => {
    expect(parseBuildInput({ accentHue: '145', fontStack: 'Inter, sans-serif' })).toEqual({
      ok: true,
      value: { accentHue: 145, fontStack: 'Inter, sans-serif' },
    });
    expect(codeOf(parseBuildInput({ accentHue: 12, fontStack: 'a;b' }))).toBe('build.stack-unsafe');
  });
});
