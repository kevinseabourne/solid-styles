/**
 * Lightning CSS Integration for Styled Components
 *
 * This module provides zero-runtime CSS-in-JS optimization
 * by extracting static styles at build time.
 */

export * from "./types";
export * from "./runtime/resolver";
export * from "./runtime/css-variables";
export * from "./runtime/enhanced-styled";
export * from "./transforms/vinxi-plugin";

// Re-export commonly used functions
export { parseStyledComponent } from "./extractor/parser";
export { generateStaticCSS } from "./extractor/generator";
export { optimizeExtractedStyles } from "./extractor/optimizer";

/**
 * Check if Lightning CSS is enabled
 */
export function isLightningCSSEnabled(): boolean {
  if (typeof window !== "undefined") {
    return (window as any).__LIGHTNING_CSS_ENABLED__ === true;
  }
  return false;
}

/**
 * Setup Lightning CSS with configuration
 */
export function setupLightningCSS(config?: Partial<import("./types").LightningCSSConfig>) {
  // This is a placeholder for future configuration
  console.log("[Lightning CSS] Setup with config:", config);
}
 