import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  minify: true,
  target: "es2022",
  splitting: true,
  treeshake: true,
  sourcemap: true,
  outDir: "dist",
  external: ["node:fs/promises", "node:path"],
  esbuildOptions(options) {
    options.chunkNames = 'chunks/[name]-[hash]';
    options.assetNames = 'assets/[name]-[hash]';
  }
});
