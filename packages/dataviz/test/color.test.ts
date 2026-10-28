import { describe, expect, it } from 'vitest';
import { CVD_KINDS, CVD_MATRICES, simulateCvd } from '../src/domain/color/cvd.ts';
import { deltaE2000 } from '../src/domain/color/delta-e.ts';
import { fitToGamut, toLinear } from '../src/domain/color/gamut.ts';
import { linearSrgbToLab } from '../src/domain/color/lab.ts';

const lab = (l: number, a: number, b: number) => ({ l, a, b });

describe('deltaE2000 : données d’essai de Sharma, Wu et Dalal (2005)', () => {
  const cases: [ReturnType<typeof lab>, ReturnType<typeof lab>, number][] = [
    [lab(50, 2.6772, -79.7751), lab(50, 0, -82.7485), 2.0425],
    [lab(50, 0, 0), lab(50, -1, 2), 2.3669],
    [lab(50, 2.5, 0), lab(50, 0, -2.5), 4.3065],
    [lab(50, 2.5, 0), lab(73, 25, -18), 27.1492],
    [lab(50, 2.5, 0), lab(61, -5, 29), 22.8977],
  ];
  it.each(cases)('%j / %j', (first, second, expected) => {
    expect(deltaE2000(first, second)).toBeCloseTo(expected, 3);
    expect(deltaE2000(second, first)).toBeCloseTo(expected, 3);
  });

  it('vaut 0 entre deux couleurs identiques', () => {
    expect(deltaE2000(lab(60, 20, -30), lab(60, 20, -30))).toBe(0);
  });
});

describe('simulateCvd : Machado, Oliveira et Fernandes (2009), gravité 1,0', () => {
  it.each(CVD_KINDS)('%s : chaque ligne somme à 1, le gris reste neutre', (kind) => {
    for (const row of CVD_MATRICES[kind]) expect(row.r + row.g + row.b).toBeCloseTo(1, 5);
    const gray = simulateCvd({ r: 0.2, g: 0.2, b: 0.2 }, kind);
    expect(gray.r).toBeCloseTo(0.2, 5);
    expect(gray.b).toBeCloseTo(0.2, 5);
  });

  it('rapproche le rouge et le vert pour la protanopie', () => {
    const red = { r: 1, g: 0, b: 0 };
    const green = { r: 0, g: 1, b: 0 };
    const plain = deltaE2000(linearSrgbToLab(red), linearSrgbToLab(green));
    const seen = deltaE2000(
      linearSrgbToLab(simulateCvd(red, 'protanopia')),
      linearSrgbToLab(simulateCvd(green, 'protanopia')),
    );
    expect(seen).toBeLessThan(plain);
  });

  it('borne le résultat à [0, 1]', () => {
    const out = simulateCvd({ r: 0, g: 0, b: 1 }, 'tritanopia');
    for (const channel of [out.r, out.g, out.b]) expect(channel).toBeGreaterThanOrEqual(0);
  });
});

describe('lab et gamut', () => {
  it('convertit le blanc en L* 100 et le noir en L* 0', () => {
    expect(linearSrgbToLab({ r: 1, g: 1, b: 1 }).l).toBeCloseTo(100, 1);
    expect(linearSrgbToLab({ r: 0, g: 0, b: 0 }).l).toBeCloseTo(0, 5);
  });

  it('réduit le chroma hors gamut sans toucher clarté ni teinte', () => {
    const fitted = fitToGamut({ l: 0.47, c: 0.19, h: 30 });
    expect(fitted.c).toBeLessThan(0.19);
    expect([fitted.l, fitted.h]).toEqual([0.47, 30]);
  });

  it('laisse intacte une couleur déjà dans sRGB', () => {
    const inside = { l: 0.5, c: 0.05, h: 100 };
    expect(fitToGamut(inside)).toBe(inside);
    expect(toLinear(inside).r).toBeGreaterThanOrEqual(0);
  });
});
