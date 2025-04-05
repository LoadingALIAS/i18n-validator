import esbuild from "esbuild";

esbuild
  .build({
    entryPoints: ["src/index.ts"],
    outfile: "dist/index.js",
    bundle: true,
    platform: "node",
    format: "esm",
    target: "esnext",
    sourcemap: true,
    treeShaking: true,
  })
  .then(() => console.log("Build complete"));
