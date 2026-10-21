import { readFileSync } from 'node:fs';
import { oklchToSrgb, parseOklch } from '@paulperigault/tokens/color';
import tokens from '@paulperigault/tokens/tokens.json';
import { describe, expect, it } from 'vitest';
import Scrim from '../src/media/Scrim.astro';
import { compositeOver, worstCaseContrast } from '../src/media/scrim';
import { renderComponent, renderDom } from './render';

const AA = 4.5;
const base: Record<string, string> = tokens.base;
const rgbOf = (name: string) => oklchToSrgb(parseOklch(base[name] ?? ''));

const veil = rgbOf('--pp-media-scrim-color');
const text = rgbOf('--pp-media-scrim-text');
const opacity = Number(base['--pp-media-scrim-opacity']);
const WHITE = { r: 1, g: 1, b: 1 };
const BLACK = { r: 0, g: 0, b: 0 };
const css = readFileSync(new URL('../src/media/Scrim.astro', import.meta.url), 'utf8');

describe('scrim.ts', () => {
  it('compositeOver aux bornes : opacité 0 = fond, opacité 1 = voile', () => {
    expect(compositeOver(veil, 0, WHITE)).toEqual(WHITE);
    expect(compositeOver(veil, 1, WHITE)).toEqual(veil);
    expect(() => compositeOver(veil, 1.2, WHITE)).toThrow(RangeError);
  });

  it('tokens : pire cas ≥ 4,5:1 sur toute image (WCAG 1.4.3)', () => {
    expect(opacity).toBeGreaterThan(0);
    expect(worstCaseContrast({ veil, opacity, text })).toBeGreaterThanOrEqual(AA);
  });

  it('tokens : contraste sur fond blanc pur ≥ 4,5:1', () => {
    expect(worstCaseContrast({ veil, opacity, text })).toBeLessThanOrEqual(
      worstCaseContrast({ veil, opacity: 1, text }),
    );
    const onWhite = worstCaseContrast({
      veil: compositeOver(veil, opacity, WHITE),
      opacity: 1,
      text,
    });
    expect(onWhite).toBeGreaterThanOrEqual(AA);
  });

  it('un voile trop léger échoue (le contrôle sait refuser)', () => {
    expect(worstCaseContrast({ veil, opacity: 0.2, text })).toBeLessThan(AA);
    expect(worstCaseContrast({ veil: WHITE, opacity: 0, text: BLACK })).toBe(1);
  });
});

describe('Scrim', () => {
  it('rend le média et le texte, data-place (end par défaut)', async () => {
    const dom = await renderDom(Scrim, { slot: '<p>Titre</p>' });
    const root = dom.querySelector('.pp-scrim');
    expect(root?.getAttribute('data-place')).toBe('end');
    expect(dom.querySelector('.pp-scrim__text')?.textContent).toContain('Titre');
    const start = await renderDom(Scrim, { props: { place: 'start' } });
    expect(start.querySelector('.pp-scrim')?.getAttribute('data-place')).toBe('start');
  });

  it('aucun attribut style', async () => {
    expect(await renderComponent(Scrim, { slot: '<p>x</p>' })).not.toMatch(/\sstyle=/);
  });

  it('CSS : voile color-mix sur les trois tokens, sans dégradé, flou ni ombre', () => {
    expect(css).toMatch(/color-mix\(\s*in srgb,\s*var\(--pp-media-scrim-color\)/);
    expect(css).toContain('calc(var(--pp-media-scrim-opacity) * 100%)');
    expect(css).toContain('color: var(--pp-media-scrim-text)');
    expect(css).not.toMatch(/gradient|blur|shadow/i);
  });
});
