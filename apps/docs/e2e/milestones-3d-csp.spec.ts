import { expect, test } from '@playwright/test';
import { PATH, SOFTWARE_GL_NOISE, enhanced, hasWasm } from './milestones-3d';

test.describe('politique de sécurité réelle (3D active)', () => {
  test.skip(!hasWasm(), 'Construction sans le .wasm : la 3D ne peut pas s’activer.');
  test.use({ bypassCSP: false });

  test('aucune violation de CSP, aucune erreur ni avertissement console, wasm servi en application/wasm', async ({
    page,
  }) => {
    const messages: string[] = [];
    const wasm: string[] = [];
    page.on('console', (message) => {
      const text = message.text();
      if (['error', 'warning'].includes(message.type()) && !SOFTWARE_GL_NOISE.test(text)) {
        messages.push(text);
      }
    });
    page.on('response', (response) => {
      if (response.url().endsWith('.wasm')) wasm.push(response.headers()['content-type'] ?? '');
    });
    await page.addInitScript(() => {
      const store: string[] = [];
      (window as unknown as Record<string, string[]>).__cspViolations = store;
      document.addEventListener('securitypolicyviolation', (event) => {
        store.push(event.violatedDirective + ' ' + event.blockedURI);
      });
    });
    await page.goto(PATH);
    await page.locator('[data-milestones-demo]').scrollIntoViewIfNeeded();
    await expect(async () => {
      await page.keyboard.press('Shift');
      await expect(enhanced(page)).toHaveCount(1, { timeout: 1000 });
    }).toPass({ timeout: 30_000 });
    const violations = await page.evaluate(
      () => (window as unknown as Record<string, string[]>).__cspViolations,
    );
    expect(violations).toEqual([]);
    expect(messages).toEqual([]);
    expect(wasm).toEqual(['application/wasm']);
  });
});
