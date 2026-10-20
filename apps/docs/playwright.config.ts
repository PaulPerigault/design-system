import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: 'list',
  outputDir: './test-results',
  use: { baseURL: BASE_URL },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Serveur maison plutôt qu'`astro preview`, qui se détache sous un agent IA.
    command: 'node e2e/serve.mjs',
    url: `${BASE_URL}/`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
