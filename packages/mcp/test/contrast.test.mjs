import { describe, expect, it } from 'vitest';
import { apcaLc as tokensApcaLc } from '@paulperigault/tokens/contrast';
import { apcaContrast, apcaLc, hexToRgb, srgbToY } from '../src/domain/apca.ts';
import { contrastReport, pairReport, resolveColor } from '../src/domain/contrast-pair.ts';
import { ToolError } from '../src/errors.ts';

// Valeurs de référence publiées avec apca-w3 0.1.9 (README de Myndex/apca-w3) : texte, fond, Lc.
const REFERENCE = [
  ['#000000', '#ffffff', 106.04067321268862],
  ['#ffffff', '#000000', -107.88473318309848],
  ['#888888', '#ffffff', 63.056469930209424],
  ['#ffffff', '#888888', -68.54146436644962],
  ['#000000', '#aaaaaa', 58.146262578561334],
  ['#aaaaaa', '#000000', -56.24113336839742],
  ['#112233', '#ddeeff', 91.66830811481631],
  ['#ddeeff', '#112233', -93.06770049484275],
];
const color = (oklch, hex) => ({ oklch, hex });
const tokens = {
  themes: {
    light: {
      '--pp-color-fg': color('oklch(21.5% 0.016 270.7)', '#171921'),
      '--pp-color-bg': color('oklch(98.5% 0.004 270.7)', '#f9fafd'),
    },
    dark: { '--pp-color-fg': color('oklch(94.5% 0.008 270.7)', '#ebedf2') },
  },
  base: { '--pp-media-scrim-color': 'oklch(20.1% 0.0124 270.7)', '--pp-space-s': '1rem' },
  pairs: [],
};
const light = { tokens, theme: 'light' };
const report = (fg, bg) => contrastReport(resolveColor(fg, light), resolveColor(bg, light));

describe('APCA-W3 0.1.9', () => {
  it.each(REFERENCE)('%s sur %s : Lc %d', (text, background, expected) => {
    expect(apcaLc(text, background)).toBeCloseTo(expected, 6);
  });

  it('noir sur blanc ≈ 106, blanc sur noir ≈ -108 : le signe donne la polarité', () => {
    expect([apcaLc('#000000', '#ffffff'), apcaLc('#ffffff', '#000000')].map(Math.round)).toEqual([
      106, -108,
    ]);
  });

  it('couleurs identiques ou luminance hors plage : Lc 0', () => {
    expect(apcaLc('#777777', '#777777')).toBe(0);
    expect([apcaContrast(-1, 1), apcaContrast(Number.NaN, 1), apcaContrast(0, 2)]).toEqual([
      0, 0, 0,
    ]);
  });

  it('Y du blanc = 1 ; lecture hexadécimale stricte', () => {
    expect(srgbToY([255, 255, 255])).toBeCloseTo(1, 6);
    expect(hexToRgb('#ff8000')).toEqual([255, 128, 0]);
    expect(() => hexToRgb('#fff')).toThrow(TypeError);
  });

  it.each([
    ['#171921', '#f9fafd'],
    ['#3749c3', '#eff1f6'],
    ['#9fb4f8', '#14161c'],
  ])('%s sur %s : concorde avec @paulperigault/tokens', (a, b) => {
    expect(apcaLc(a, b)).toBeCloseTo(tokensApcaLc(a, b), 9);
  });
});

describe('contrastReport (WCAG 2)', () => {
  it('#000 sur #fff : ratio 21, tous les niveaux, APCA marqué informatif', () => {
    const result = report('#000', '#fff');
    expect(result.wcag).toMatchObject({ ratio: 21, normalText: { aa: true, aaa: true } });
    expect(result.wcag.largeText).toEqual({ aa: true, aaa: true });
    expect(Math.round(result.apca.lc)).toBe(106);
    expect(result.apca.note).toMatch(/informatif.*WCAG 2\.2/);
  });

  it('seuils sur le ratio brut : #777 sur #fff (4,48) échoue AA normal, passe AA grand', () => {
    const { wcag } = report('#777777', '#ffffff');
    expect(wcag.ratio).toBe(4.48);
    expect([wcag.normalText.aa, wcag.largeText.aa, wcag.largeText.aaa]).toEqual([
      false,
      true,
      false,
    ]);
  });
});

describe('resolveColor', () => {
  it('développe #rgb, résout un jeton par thème et un jeton de base OKLCH', () => {
    expect(resolveColor('#ABC', light).hex).toBe('#aabbcc');
    expect(resolveColor('--pp-color-fg', light).hex).toBe('#171921');
    expect(resolveColor('--pp-color-fg', { tokens, theme: 'dark' }).hex).toBe('#ebedf2');
    expect(resolveColor('--pp-media-scrim-color', light).hex).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('erreurs claires : jeton inconnu, non coloré, hors gamut, illisible', () => {
    expect(() => resolveColor('--pp-color-nope', light)).toThrow(/jeton inconnu/);
    expect(() => resolveColor('--pp-space-s', light)).toThrow(/n’est pas une couleur/);
    expect(() => resolveColor('oklch(70% 0.4 30)', light)).toThrow(/hors du gamut/);
    expect(() => resolveColor('oklch(abc)', light)).toThrow(ToolError);
  });
});

describe('pairReport', () => {
  it('ratio et verdict d’une paire connue ; paire incomplète ignorée', () => {
    const known = { fg: '--pp-color-fg', bg: '--pp-color-bg', min: 7, norm: 'WCAG 1.4.6' };
    expect(pairReport(known, tokens.themes.light)).toMatchObject({ min: 7, passes: true });
    expect(pairReport({ ...known, fg: '--pp-x' }, tokens.themes.light)).toBe(undefined);
  });
});
