import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.ts'],
    // There are no tests yet; the first ones arrive with the domain rules.
    passWithNoTests: true,
  },
});
