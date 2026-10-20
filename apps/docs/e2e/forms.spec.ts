import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { TARGET_MIN, THEMES, VIEWPORTS, open } from './helpers';

const NAMES = ['button', 'field', 'input', 'textarea', 'select', 'choice', 'switch'];
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];
const CONTROL_MIN = 44;
const MAX_TABS = 80;
const CONTROLS =
  'main :is(input, select, textarea, button):not([disabled], input[type="radio"]:not(:checked)), ' +
  'main a[href]:not([aria-disabled="true"])';
const SIZED = 'main input, main select, main textarea, main button, main a.pp-button';

const tagControls = (selector: string) =>
  [...document.querySelectorAll(selector)].map((el, i) => el.setAttribute('data-e2e', `${i}`))
    .length;

function focusState() {
  const el = document.activeElement as Element;
  const { outlineStyle, outlineWidth } = getComputedStyle(el);
  return { index: el.getAttribute('data-e2e'), outlineStyle, width: parseFloat(outlineWidth) };
}

function describedReport() {
  const described = [...document.querySelectorAll('[aria-describedby]')];
  const ids = described.flatMap((el) => (el.getAttribute('aria-describedby') ?? '').split(/\s+/));
  const bad = ids.filter((id) => !document.getElementById(id)?.textContent?.trim());
  const invalid = [...document.querySelectorAll('[aria-invalid="true"]')];
  const orphans = invalid.filter((el) => !el.hasAttribute('aria-describedby')).length;
  return { bad, described: described.length, invalid: invalid.length, orphans };
}

function measure(selector: string) {
  return [...document.querySelectorAll<HTMLInputElement>(selector)]
    .map((el) => {
      const box = el.getBoundingClientRect();
      const label = document.querySelector(`label[for="${el.id}"]`);
      const toggle = ['checkbox', 'radio'].includes(el.type);
      const labelHeight = label?.getBoundingClientRect().height ?? null;
      return { id: el.id || el.tagName, toggle, w: box.width, h: box.height, labelHeight };
    })
    .filter((t) => t.w > 0 && t.h > 0);
}

for (const name of NAMES) {
  const path = `/components/${name}/`;
  for (const theme of THEMES) {
    for (const viewport of VIEWPORTS) {
      test(`axe : ${path}, thème ${theme}, ${viewport.name}`, async ({ page }) => {
        await open(page, path, viewport, theme);
        const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
        expect(violations.map((v) => `${v.id} (${v.nodes.length}) : ${v.help}`)).toEqual([]);
      });
    }
  }

  test(`clavier : Tab atteint chaque contrôle dans l'ordre, ${path}`, async ({ page }) => {
    await open(page, path, VIEWPORTS[0]);
    const count = await page.evaluate(tagControls, CONTROLS);
    for (let index = 0; index < count; index++) {
      let state = await page.evaluate(focusState);
      for (let tabs = 0; state.index !== String(index) && tabs < MAX_TABS; tabs++) {
        await page.keyboard.press('Tab');
        state = await page.evaluate(focusState);
      }
      expect(state.index, `contrôle ${index}`).toBe(String(index));
      expect(state.outlineStyle).not.toBe('none');
      expect(state.width).toBeGreaterThan(0);
    }
  });

  test(`erreurs : aria-describedby cible un texte non vide, ${path}`, async ({ page }) => {
    await open(page, path, VIEWPORTS[0]);
    const report = await page.evaluate(describedReport);
    expect(report.bad).toEqual([]);
    expect(report.orphans).toBe(0);
    if (name !== 'button') expect(report.described).toBeGreaterThan(0);
    if (['input', 'textarea', 'select'].includes(name)) expect(report.invalid).toBeGreaterThan(0);
  });

  test(`cibles : tailles minimales, ${path}`, async ({ page }) => {
    for (const viewport of VIEWPORTS) {
      await open(page, path, viewport);
      for (const t of await page.evaluate(measure, SIZED)) {
        const where = `${t.id} (${viewport.name})`;
        expect(t.w, `${where} largeur`).toBeGreaterThanOrEqual(TARGET_MIN);
        expect(t.h, where).toBeGreaterThanOrEqual(t.toggle ? TARGET_MIN : CONTROL_MIN);
        if (t.toggle) expect(t.labelHeight ?? TARGET_MIN, where).toBeGreaterThanOrEqual(TARGET_MIN);
      }
    }
  });
}

test.describe('sans JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('Choice et Switch : le libellé change l’état', async ({ page }) => {
    for (const [name, label, id] of [
      ['choice', 'Recevoir les notes', '#choice-news'],
      ['switch', 'Recevoir les alertes', '#demo-default'],
    ]) {
      await page.goto(`/components/${name}/`);
      await page.getByText(label).click();
      await expect(page.locator(id)).toBeChecked();
    }
  });

  test('Select, Input et Textarea : choix et saisie', async ({ page }) => {
    for (const [name, id, value] of [
      ['select', '#select-pays', 'be'],
      ['input', '#exemple-defaut', 'Ada'],
      ['textarea', '#demo-defaut', 'Bonjour'],
    ]) {
      await page.goto(`/components/${name}/`);
      if (name === 'select') await page.selectOption(id, value);
      else await page.fill(id, value);
      await expect(page.locator(id)).toHaveValue(value);
    }
  });
});
