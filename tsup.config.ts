import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: {
    resolve: true,
  },
  splitting: true,
  sourcemap: true,
  clean: true,
  minify: true,
  treeshake: {
    preset: "recommended",
  },
  target: "es2023",
  outDir: "dist",
  keepNames: true,
  loader: {
    ".json": "json",
  },
  external: ["../data/**/*.json"],
});
