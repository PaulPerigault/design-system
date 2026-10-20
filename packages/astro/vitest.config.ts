import { getViteConfig } from 'astro/config';

// getViteConfig : Vitest compile les composants .astro comme le build.
export default getViteConfig({
  test: {
    name: 'astro',
    include: ['test/**/*.test.ts'],
    passWithNoTests: true,
  },
});
