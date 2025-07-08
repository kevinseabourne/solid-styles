/// <reference types="vitest" />
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import path from "path";

export default defineConfig({
  plugins: [solid({ ssr: true })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@animation": path.resolve(__dirname, "./animation"),
      "@utils": path.resolve(__dirname, "./utils"),
    },
  },
  // @ts-ignore - vitest extends vite config
  test: {
    // Use Node.js environment for SSR tests - disable browser mode
    browser: {
      enabled: false,
    },
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup-ssr.ts"],
    testTimeout: 30000,
    include: [
      "tests/**/*ssr*.test.{ts,tsx}", // Only include SSR tests
    ],
    exclude: [
      "node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
      "**/examples/**",
      "**/lightning/package.json",
      "**/2/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData.ts",
        "examples/",
        "**/2/**",
        "tests/setup*.ts",
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
    },
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    retry: 2,
    reporters: process.env.CI ? ["verbose", "github-actions"] : ["verbose"],
  },
  ssr: {
    noExternal: true,
    target: "node",
  },
});
