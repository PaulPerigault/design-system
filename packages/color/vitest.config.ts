import { defineConfig } from 'vitest/config';
import { sourceResolve } from '../../vitest.source.ts';

export default defineConfig({
  ...sourceResolve,
  test: { name: 'color', include: ['test/**/*.test.ts'] },
});
