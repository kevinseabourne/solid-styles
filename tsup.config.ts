import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    animation: "animation/index.ts",
    "utils/spring": "utils/spring.ts",
    "utils/gradient": "utils/gradient-numerical.ts",
    "integrations/astro": "integrations/astro.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  external: ["solid-js", "solid-js/web", "lightningcss", "browserslist"],
  treeshake: true,
  minify: process.env.NODE_ENV === "production",
  target: "es2020",
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    };
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "import.meta.env.MODE": JSON.stringify("production"),
  },
});
