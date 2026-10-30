import { getViteConfig } from 'astro/config';
import { sourceResolve } from '../../vitest.source.ts';

// getViteConfig : Vitest compile les composants .astro comme le build.
export default getViteConfig({
  ...sourceResolve,
  test: {
    name: 'astro',
    include: ['test/**/*.test.ts'],
    passWithNoTests: true,
  },
});
