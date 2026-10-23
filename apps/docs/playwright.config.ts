import { defineConfig, devices } from '@playwright/test';
import { MATRIX, contextOf } from './e2e/devices';

const PORT = 4321;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: 'list',
  outputDir: './test-results',
  // Références visuelles générées en CI, jamais versionnées (voir matrix/visual.spec.ts).
  snapshotPathTemplate: '.visual/{projectName}/{testFilePath}/{arg}{ext}',
  // Les tests qui injectent du CSS (espacement du texte) contournent la CSP ; csp.spec.ts la rétablit.
  use: { baseURL: BASE_URL, bypassCSP: true },
  projects: [
    { name: 'chromium', testIgnore: /matrix\//, use: { ...devices['Desktop Chrome'] } },
    ...MATRIX.map((device) => ({
      name: `matrice-${device.name}`,
      testMatch: /matrix\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], ...contextOf(device) },
    })),
  ],
  webServer: {
    // Serveur maison plutôt qu'`astro preview`, qui se détache sous un agent IA.
    command: 'node e2e/serve.mjs',
    url: `${BASE_URL}/`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
