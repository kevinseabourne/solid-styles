/// <reference types="vitest" />
import { defineConfig } from "vite";
import path from "path";
import solid from "vite-plugin-solid";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@animation": path.resolve(__dirname, "./animation"),
      "@utils": path.resolve(__dirname, "./utils"),
      lightningcss: path.resolve(__dirname, "./tests/lightningcss-browser-stub.ts"),
    },
  },
  test: {
    // Use browser environment by default - realistic testing
    browser: {
      enabled: true,
      provider: playwright({ browser: "chromium" }),
      name: "chromium",
      headless: process.env.CI !== "false",
      instances: [
        {
          browser: "chromium",
        },
      ],
      // Browser configuration optimized for testing
      api: {
        port: 9080,
        strictPort: false,
      },
      viewport: {
        width: 1280,
        height: 720,
      },
      isolate: true,
      fileParallelism: false, // Better for Solid Styles tests
      // Playwright configuration
      launch: {
        args: ['--disable-web-security', '--disable-features=VizDisplayCompositor'],
      },
      context: {
        ignoreHTTPSErrors: true,
      },
    },
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 30000, // Realistic timeout for browser tests
    include: [
      "tests/**/*.{test,spec}.{ts,tsx}",
      "src/**/*.{test,spec}.{ts,tsx}",
      "animation/**/*.{test,spec}.{ts,tsx}",
      "utils/**/*.{test,spec}.{ts,tsx}",
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
      "**/*ssr*.test.{ts,tsx}", // Exclude SSR tests from browser environment
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
        "tests/**/lightningcss-browser-stub.ts",
        "tests/browser-test-utils.ts",
        // Exclude non-library files from coverage
        "**/.eslintrc.*",
        "**/setup.js",
        "**/lightning-setup.ts",
        "**/animation-fix.js",
        "**/plugins/**",
        "**/scripts/**",
        "**/transforms/**",
        "**/types/index.ts", // Type-only files
      ],
      thresholds: {
        lines: 40,     // Current: 42.7% - Set slightly below current
        functions: 50, // Current: 51.67% - Set slightly below current
        branches: 55,  // Current: 59.7% - Set slightly below current
        statements: 40, // Current: 42.7% - Set slightly below current
      },
    },
    // Optimized for browser testing
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    retry: 2, // Retry twice for browser flakiness
    reporters: process.env.CI ? ["verbose", "github-actions"] : ["verbose"],
  },
});
