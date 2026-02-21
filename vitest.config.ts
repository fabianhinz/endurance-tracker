import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.integration.test.ts', 'tests/**/*.spec.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/engine/**', 'src/store/**', 'src/lib/**'],
    },
  },
});
