import { defineConfig } from 'vitest/config';
import { sourceResolve } from '../../vitest.source.ts';

export default defineConfig({
  ...sourceResolve,
  test: { name: 'milestones-3d', include: ['test/**/*.test.ts'] },
});
