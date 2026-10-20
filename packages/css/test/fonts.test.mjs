import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { URL } from 'node:url';
import { describe, expect, it } from 'vitest';
import arial from '@capsizecss/metrics/arial';
import atkinsonHyperlegibleNext from '@capsizecss/metrics/atkinsonHyperlegibleNext';
import {
  END,
  START,
  computeFallback,
  percent,
  renderBlock,
  replaceBlock,
  run,
} from '../scripts/fallback-metrics.mjs';

const fontsUrl = new URL('../src/fonts.css', import.meta.url);
const fontsCss = readFileSync(fontsUrl, 'utf8');
const requireFromCss = createRequire(fontsUrl);
const imports = [...fontsCss.matchAll(/@import\s+'([^']+)'/g)].map((m) => m[1]);
const importedCss = imports.map((spec) => readFileSync(requireFromCss.resolve(spec), 'utf8'));

describe('fallback-metrics', () => {
  it('calcule size-adjust ≈ 99.59 % pour Next sur Arial', () => {
    const m = computeFallback(atkinsonHyperlegibleNext, arial);
    expect(Math.abs(m.sizeAdjust * 100 - 99.59)).toBeLessThanOrEqual(0.01);
    expect(m.ascentOverride).toBeCloseTo(0.984 / m.sizeAdjust, 10);
    expect(m.descentOverride).toBeCloseTo(0.316 / m.sizeAdjust, 10);
    expect(m.lineGapOverride).toBe(0);
  });

  it('formate en pourcentage à deux décimales, sans zéros finaux', () => {
    expect(percent(0.995959)).toBe('99.6%');
    expect(percent(0.317281)).toBe('31.73%');
    expect(percent(0)).toBe('0%');
  });

  it('fonts.css contient le bloc généré, à jour', () => {
    expect(replaceBlock(fontsCss)).toBe(fontsCss);
    expect(fontsCss).toContain(renderBlock());
  });

  it('déclare les deux replis locaux avec leurs quatre métriques', () => {
    const block = fontsCss.slice(fontsCss.indexOf(START), fontsCss.indexOf(END));
    expect(block).toContain("font-family: 'Atkinson Next Fallback';");
    expect(block).toContain("src: local('Arial');");
    expect(block).toContain("font-family: 'Atkinson Mono Fallback';");
    expect(block).toContain("src: local('Courier New');");
    for (const prop of [
      'size-adjust',
      'ascent-override',
      'descent-override',
      'line-gap-override',
    ]) {
      expect(block.match(new RegExp(`${prop}: [\\d.]+%;`, 'g'))).toHaveLength(2);
    }
  });

  it('replaceBlock échoue sans balises', () => {
    expect(() => replaceBlock('body {}')).toThrow(/introuvables/);
  });

  it('--check renvoie 1 sans écrire ; sans --check, réécrit le bloc obsolète', () => {
    const writes = [];
    const io = { read: () => fontsCss.replace('99.6%', '90%'), log: () => {} };
    const write = (_, text) => writes.push(text);
    expect(run({ ...io, argv: ['--check'], write })).toBe(1);
    expect(writes).toHaveLength(0);
    expect(run({ ...io, argv: [], write })).toBe(0);
    expect(writes).toEqual([fontsCss]);
  });
});

describe('fonts.css', () => {
  it('importe les deux familles fontsource variables', () => {
    const families = imports.map((spec) => spec.split('/').slice(0, 2).join('/'));
    expect(new Set(families)).toEqual(
      new Set([
        '@fontsource-variable/atkinson-hyperlegible-next',
        '@fontsource-variable/atkinson-hyperlegible-mono',
      ]),
    );
  });

  it('ne référence que les sous-ensembles latin et latin-ext', () => {
    const urls = importedCss.flatMap((css) =>
      [...css.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1]),
    );
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url).toMatch(/-latin(-ext)?-wght-(normal|italic)\.woff2$/);
    }
  });

  it('impose font-display: swap à chaque @font-face importée', () => {
    for (const css of importedCss) {
      const faces = css.match(/@font-face/g) ?? [];
      expect(css.match(/font-display: swap;/g)).toHaveLength(faces.length);
    }
  });

  it('ne contient aucune URL distante', () => {
    for (const css of [fontsCss, ...importedCss]) {
      expect(css).not.toMatch(/url\(\s*['"]?(https?:)?\/\//);
      expect(css).not.toMatch(/@import\s+(url\()?['"]?(https?:)?\/\//);
    }
  });
});
