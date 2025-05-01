import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  // Handle Node.js built-in modules
  external: ['puppeteer', 'fs/promises', 'path', 'node:timers/promises', 'events'],
  // Add this to properly handle Node.js modules
  noExternal: ['@wc-toolkit/cem-utilities']
});