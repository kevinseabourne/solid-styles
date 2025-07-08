/**
 * Lightning CSS Integration Setup
 *
 * This file provides complete setup for Lightning CSS integration with the Solid Styles library.
 * Import this file early in your application to enable Lightning CSS optimizations.
 */

import { initializeLightningCSS } from "./lightning/runtime/enhanced-styled";
import { setupLightningCSS } from "./lightning";
import type { RuntimeResolver } from "./lightning/runtime/resolver";
import type { CSSVariableManager } from "./lightning/runtime/css-variables";

// Default configuration for Lightning CSS
const DEFAULT_CONFIG = {
  targets: ["> 0.25%", "not dead"],
  minify: true,
  analyzePropPatterns: true,
  maxPropCombinations: 100,
};

/**
 * Initialize Lightning CSS integration
 * Call this early in your application, preferably in your app.config.ts or main entry file
 */
export function initializeLightningIntegration(config = DEFAULT_CONFIG) {
  console.log("[LIGHTNING-CSS] Initializing Lightning CSS integration...");

  // Check if we're in a browser environment
  if (typeof window !== "undefined") {
    // Enable Lightning CSS runtime
    window.__LIGHTNING_CSS_ENABLED__ = true;

    // Initialize with empty class map (will be populated by build process)
    const staticClassMap = new Map<string, string>();

    // Try to load generated class mappings
    try {
      // This will be populated by the build plugin
      const mappings = window.__LIGHTNING_CSS_MAPPINGS__;
      if (mappings) {
        Object.entries(mappings).forEach(([key, className]) => {
          staticClassMap.set(key, className as string);
        });
        console.log(`[LIGHTNING-CSS] Loaded ${staticClassMap.size} static class mappings`);
      }
    } catch (error) {
      console.warn("[LIGHTNING-CSS] No static class mappings found, will use runtime fallback");
    }

    // Initialize the runtime
    initializeLightningCSS({
      staticClassMap,
      enableDevMode: process.env.NODE_ENV === "development",
    });

    console.log("[LIGHTNING-CSS] Runtime initialization complete");
  }

  return config;
}

/**
 * Get the Vite/Vinxi plugin configuration
 * Use this in your app.config.ts or vite.config.ts
 */
export function getLightningCSSPlugin(config = DEFAULT_CONFIG) {
  return setupLightningCSS(config);
}

/**
 * Type augmentation for the Lightning CSS mappings
 */
declare global {
  interface Window {
    __LIGHTNING_CSS_ENABLED__?: boolean;
    __LIGHTNING_CSS_MAPPINGS__?: Record<string, string>;
    __LIGHTNING_CSS_CONFIG__?: {
      resolver?: RuntimeResolver;
      cssVariableManager?: CSSVariableManager;
    };
  }
}

// Auto-initialize if in browser
if (typeof window !== "undefined" && !window.__LIGHTNING_CSS_ENABLED__) {
  initializeLightningIntegration();
}

export { DEFAULT_CONFIG };
