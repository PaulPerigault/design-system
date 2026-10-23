import { defineConfig } from 'vitest/config';

// Un projet par brique : chaque paquet garde sa propre config (Astro, environnement), la racine
// teste l'outillage (tools/).
export default defineConfig({
  test: {
    projects: [
      'packages/*',
      { test: { name: 'tools', include: ['tools/**/*.test.mjs'] } },
      // Logique pure de la documentation (aucun composant Astro) : apps/docs/src/**.
      {
        test: {
          name: 'docs',
          root: 'apps/docs',
          include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs'],
        },
      },
    ],
    passWithNoTests: true,
  },
});
