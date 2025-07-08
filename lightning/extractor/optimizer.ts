/**
 * Lightning CSS Optimizer Module
 *
 * Optimizes generated CSS using Lightning CSS
 */

import { transform, Features, browserslistToTargets } from "lightningcss";
import browserslist from "browserslist";
import type { ExtractedStyle, TransformResult } from "../types";

console.log("[OPTIMIZER-IMPORT-DEBUG] lightningcss transform function:", typeof transform);
console.log("[OPTIMIZER-IMPORT-DEBUG] transform toString:", transform.toString().substring(0, 200));
console.log("[OPTIMIZER-IMPORT-DEBUG] browserslist function:", typeof browserslist);

/**
 * Optimize CSS using Lightning CSS
 */
export async function optimizeCSS(css: string, targets?: string[], minify: boolean = true): Promise<TransformResult> {
  try {
    // Use static imports instead of dynamic imports to ensure alias works correctly
    // const { transform, browserslistToTargets, Features } = await import("lightningcss");
    // const browserslist = await import("browserslist");

    // Validate the CSS before optimization
    if (!isValidCSSForOptimization(css)) {
      console.warn("[Lightning CSS] Skipping optimization for invalid CSS");
      return {
        code: css,
        map: undefined,
      };
    }

    // Get browser targets
    const browserTargets = targets
      ? browserslistToTargets(browserslist(targets))
      : browserslistToTargets(browserslist("defaults"));

    // Transform CSS with Lightning CSS
    const transformOptions = {
      code: new TextEncoder().encode(css),
      filename: "styles.css",
      minify,
      sourceMap: false,
      targets: browserTargets,
      include: Features.VendorPrefixes | Features.Colors | Features.Nesting,
      exclude: Features.LogicalProperties, // Exclude features that might break compatibility
      errorRecovery: true,
    };

    const result = transform(transformOptions);

    // Convert Uint8Array to string properly - in browser stub it's always a string
    const codeString = typeof result.code === "string" ? result.code : new TextDecoder().decode(result.code);

    return {
      code: codeString,
      map: result.map?.toString(),
    };
  } catch (error) {
    console.error("[Lightning CSS] Optimization failed:", error);

    // If optimization fails, try basic minification
    if (minify) {
      // Remove comments and extra whitespace
      const minified = css
        .replace(/\/\*[\s\S]*?\*\//g, "") // Remove comments
        .replace(/\s+/g, " ") // Collapse whitespace
        .replace(/\s*([{}:;,])\s*/g, "$1") // Remove spaces around punctuation
        .trim();

      return {
        code: minified,
        map: undefined,
      };
    }

    // Return original CSS if all else fails
    return {
      code: css,
      map: undefined,
    };
  }
}

/**
 * Validate CSS before Lightning CSS processing
 */
function isValidCSSForOptimization(css: string): boolean {
  const trimmed = css.trim();

  // Must have content
  if (!trimmed) return false;

  // Check for obvious JavaScript patterns
  const invalidPatterns = [
    /^(const|let|var|function|class|import|export)\s+/,
    /}\s*(const|let|var)\s+/,
    /;\s*(const|let|var)\s+/,
    /^[A-Z][a-zA-Z]*\s*=/, // Component definitions
    /^\w+\s*\(/, // Function calls at start
  ];

  if (invalidPatterns.some((pattern) => pattern.test(trimmed))) {
    return false;
  }

  // Should contain some CSS-like content
  const cssPatterns = [
    /[a-zA-Z-]+\s*:\s*[^;]+[;}]/, // CSS property: value;
    /\.[a-zA-Z_-]+\s*\{/, // Class selector
    /#[a-zA-Z_-]+\s*\{/, // ID selector
    /&[:\s]/, // Nested selector
    /@[a-zA-Z-]+/, // At-rules
  ];

  return cssPatterns.some((pattern) => pattern.test(trimmed));
}

/**
 * Optimize multiple extracted styles
 */
export async function optimizeExtractedStyles(
  styles: ExtractedStyle[],
  targets?: string[],
  minify: boolean = true
): Promise<string> {
  // Combine all CSS
  const combinedCSS = styles.map((style) => style.css).join("\n");

  // Optimize with Lightning CSS
  const result = await optimizeCSS(combinedCSS, targets, minify);

  return result.code;
}

/**
 * Generate CSS module exports
 */
export function generateCSSModuleExports(styles: ExtractedStyle[]): Record<string, string> {
  const exports: Record<string, string> = {};

  for (const style of styles) {
    // Create export for each prop combination
    const key = JSON.stringify(style.propCombination);
    exports[key] = style.className;
  }

  return exports;
}

/**
 * Create a CSS file with source map
 */
export async function createCSSFile(
  styles: ExtractedStyle[],
  outputPath: string,
  config: {
    targets?: string[];
    minify?: boolean;
    sourceMap?: boolean;
  } = {}
): Promise<{
  cssPath: string;
  mapPath?: string;
  exports: Record<string, string>;
}> {
  const { targets, minify = true, sourceMap = true } = config;

  // Optimize CSS
  const optimizedCSS = await optimizeExtractedStyles(styles, targets, minify);

  // Generate exports
  const exports = generateCSSModuleExports(styles);

  // Write files
  const fs = await import("fs/promises");
  const path = await import("path");

  const cssPath = outputPath;
  await fs.writeFile(cssPath, optimizedCSS);

  let mapPath: string | undefined;
  if (sourceMap) {
    mapPath = `${outputPath}.map`;
    // Source map is included in optimizedCSS result
  }

  return {
    cssPath,
    mapPath,
    exports,
  };
}

/**
 * Analyze CSS size reduction
 */
export function analyzeSizeReduction(
  originalCSS: string,
  optimizedCSS: string
): {
  originalSize: number;
  optimizedSize: number;
  reduction: number;
  percentage: number;
} {
  // Use TextEncoder for browser-compatible byte length calculation
  const encoder = new TextEncoder();
  const originalSize = encoder.encode(originalCSS).length;
  const optimizedSize = encoder.encode(optimizedCSS).length;
  const reduction = originalSize - optimizedSize;
  const percentage = (reduction / originalSize) * 100;

  return {
    originalSize,
    optimizedSize,
    reduction,
    percentage: Math.round(percentage * 100) / 100,
  };
}
