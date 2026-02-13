import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  // These are dynamically imported at runtime, not bundled
  external: [
    '@railgun-community/wallet',
    '@railgun-community/shared-models',
    'ethers',
  ],
});
