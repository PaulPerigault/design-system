import { defineConfig } from 'vitest/config';

// Un projet par brique : chaque paquet garde sa propre config (Astro, environnement), la racine
// teste l'outillage (tools/).
export default defineConfig({
  test: {
    projects: ['packages/*', { test: { name: 'tools', include: ['tools/**/*.test.mjs'] } }],
    passWithNoTests: true,
  },
});
