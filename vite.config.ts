import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative base so the build works from any static host path (GitHub Pages, itch.io, file server).
  base: './',
  server: { host: true },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
