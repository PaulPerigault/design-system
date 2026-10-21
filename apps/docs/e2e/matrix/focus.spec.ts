import { expect, test, type Page } from '@playwright/test';
import { PAGES, visit } from '../helpers';

/** Tabulations au plus par page (garde-fou contre une boucle). */
const MAX_TABS = 120;

interface Focused {
  id: string;
  width: number;
  contrast: number;
  covered: boolean;
}

/** Indicateur de focus de l'élément actif : épaisseur, contraste avec le fond, recouvrement. */
function inspect(): Focused | null {
  const WEIGHTS = [0.2126, 0.7152, 0.0722];
  const rgb = (color: string): number[] => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');
    if (!context) return [0, 0, 0];
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)];
  };
  const linear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const luminance = (c: number[]) =>
    c.reduce((sum, v, i) => sum + linear(v / 255) * (WEIGHTS[i] ?? 0), 0);
  const backgroundOf = (from: Element | null): string => {
    let host = from;
    while (host && getComputedStyle(host).backgroundColor === 'rgba(0, 0, 0, 0)') {
      host = host.parentElement;
    }
    return host ? getComputedStyle(host).backgroundColor : 'white';
  };
  const coveredAt = (el: Element) => {
    const box = el.getBoundingClientRect();
    const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return top !== null && top !== el && !el.contains(top) && !top.contains(el);
  };
  const el = document.activeElement;
  if (!(el instanceof HTMLElement) || el === document.body) return null;
  const style = getComputedStyle(el);
  const [a, b] = [
    luminance(rgb(style.outlineColor)),
    luminance(rgb(backgroundOf(el.parentElement))),
  ];
  const name = el.textContent?.trim() || el.getAttribute('aria-label') || '';
  return {
    id: `${el.tagName} « ${name.slice(0, 25)} »`,
    width: style.outlineStyle === 'none' ? 0 : parseFloat(style.outlineWidth),
    contrast: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
    covered: coveredAt(el),
  };
}

/** Problèmes de focus rencontrés en tabulant dans toute la page. */
async function tabThrough(page: Page): Promise<{ seen: number; problems: string[] }> {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (let tabs = 0; tabs < MAX_TABS; tabs++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(inspect);
    if (focused === null || seen.has(focused.id)) break;
    seen.add(focused.id);
    if (focused.width < 2) problems.push(`${focused.id} : contour ${focused.width} px`);
    if (focused.contrast < 3)
      problems.push(`${focused.id} : contraste ${focused.contrast.toFixed(2)}`);
    if (focused.covered) problems.push(`${focused.id} : masqué`);
  }
  return { seen: seen.size, problems };
}

test('canari : un focus sans contour est détecté', async ({ page }, testInfo) => {
  test.skip(Boolean(testInfo.project.use.hasTouch), 'parcours clavier : ordinateurs seulement');
  await visit(page, '/components/stack/');
  await page.addStyleTag({ content: '*:focus, *:focus-visible { outline: none !important; }' });
  expect((await tabThrough(page)).problems.length).toBeGreaterThan(0);
});

for (const path of PAGES) {
  test(`focus visible, épais, contrasté, jamais masqué (2.4.7, 2.4.11, 2.4.13) : ${path}`, async ({
    page,
  }, testInfo) => {
    test.skip(Boolean(testInfo.project.use.hasTouch), 'parcours clavier : ordinateurs seulement');
    await visit(page, path);
    const { seen, problems } = await tabThrough(page);
    expect(seen).toBeGreaterThan(0);
    expect(problems).toEqual([]);
  });
}
