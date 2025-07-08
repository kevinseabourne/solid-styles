/**
 * CSS Extraction Plugin
 *
 * Extracts and optimizes CSS from styled-components
 * Provides build-time optimization and code splitting for styles
 */

import type { Plugin } from "vite";
import { promises as fs } from "fs";
import { join, dirname, basename, extname } from "path";
import { createHash } from "crypto";
import path from "path";

interface ExtractedCSS {
  css: string;
  hash: string;
  components: string[];
  isAboveFold?: boolean;
  sourceFile?: string;
}

interface CSSExtractionOptions {
  /**
   * Output directory for extracted CSS files
   * @default 'dist/css'
   */
  outputDir?: string;

  /**
   * Whether to extract critical CSS
   * @default false
   */
  extractCritical?: boolean;

  /**
   * Whether to generate source maps
   * @default true
   */
  sourceMap?: boolean;

  /**
   * Whether to minify extracted CSS
   * @default true in production
   */
  minify?: boolean;

  /**
   * Patterns to include for extraction
   * @default ['**\/*.tsx', '**\/*.jsx', '**\/*.ts', '**\/*.js']
   */
  include?: string[];

  /**
   * Patterns to exclude from extraction
   * @default ['node_modules/**']
   */
  exclude?: string[];

  /**
   * Whether to purge unused CSS
   * @default false
   */
  purgeUnused?: boolean;

  /**
   * Content paths for PurgeCSS
   */
  purgePaths?: string[];
}

// Safe import helper for optional dependencies
function safeImport(moduleName: string) {
  try {
    return require(moduleName);
  } catch (e) {
    console.warn(`[CSS Extraction] Optional dependency ${moduleName} not found. Some features may be limited.`);
    return null;
  }
}

// Lazy load optimization libraries
function getCSSOptimizer() {
  return safeImport("csso");
}

function getPurgeCSS() {
  return safeImport("purgecss");
}

/**
 * CSS Extraction Plugin for Vite
 * Extracts all styled-components CSS into static files at build time
 */
export function cssExtractionPlugin(options: CSSExtractionOptions = {}): Plugin {
  const {
    outputDir = "dist/css",
    extractCritical = false,
    sourceMap = true,
    minify = process.env.NODE_ENV === "production",
    include = ["**/*.tsx", "**/*.jsx", "**/*.ts", "**/*.js"],
    exclude = ["node_modules/**"],
    purgeUnused = false,
    purgePaths = ["src/**/*.{tsx,jsx,ts,js,html}"],
  } = options;

  const extractedCSS = new Map<string, ExtractedCSS>();
  const criticalCSS = new Set<string>();
  const componentStyles = new Map<string, string>();

  return {
    name: "vite-plugin-css-extraction",
    enforce: "post",

    async transform(code: string, id: string) {
      // Skip if file doesn't match patterns
      if (!matchesPattern(id, include, exclude)) {
        return null;
      }

      // Extract styled component CSS
      const extracted = await extractStyledComponentsCSS(code, id);

      if (extracted.length > 0) {
        extracted.forEach((item) => {
          const hash = generateHash(item.css);
          extractedCSS.set(hash, {
            css: item.css,
            hash,
            components: item.components,
            isAboveFold: item.isAboveFold,
            sourceFile: id,
          });

          // Track component styles for purging
          item.components.forEach((comp) => {
            componentStyles.set(comp, item.css);
          });

          // Mark as critical if above the fold
          if (item.isAboveFold) {
            criticalCSS.add(hash);
          }
        });

        // Transform code to reference extracted CSS
        const transformedCode = transformCodeForExtraction(code, extracted);

        return {
          code: transformedCode,
          map: sourceMap ? generateSourceMap(code, transformedCode, id) : null,
        };
      }

      return null;
    },

    async generateBundle() {
      // Create output directory
      await fs.mkdir(outputDir, { recursive: true });

      // Combine all extracted CSS
      let allCSS = "";
      let criticalCSSContent = "";
      const cssChunks = new Map<string, string>();

      // Group CSS by route/chunk for code splitting
      for (const [hash, extracted] of extractedCSS) {
        const chunkName = getChunkName(extracted.sourceFile || "main");
        const existing = cssChunks.get(chunkName) || "";
        cssChunks.set(chunkName, existing + "\n" + extracted.css);

        allCSS += extracted.css + "\n";

        if (criticalCSS.has(hash)) {
          criticalCSSContent += extracted.css + "\n";
        }
      }

      // Apply CSS optimizations
      if (minify || purgeUnused) {
        allCSS = await optimizeCSS(allCSS, {
          minify,
          purge: purgeUnused,
          purgePaths,
          componentStyles,
        });

        criticalCSSContent = await optimizeCSS(criticalCSSContent, {
          minify,
          purge: false, // Don't purge critical CSS
        });
      }

      // Write main CSS file
      const mainCSSPath = path.join(outputDir, "styles.css");
      await fs.writeFile(mainCSSPath, allCSS);

      // Write source map if enabled
      if (sourceMap) {
        const mapPath = mainCSSPath + ".map";
        const map = generateCSSSourceMap(allCSS, extractedCSS);
        await fs.writeFile(mapPath, JSON.stringify(map));
      }

      // Write critical CSS if enabled
      if (extractCritical && criticalCSSContent) {
        const criticalPath = path.join(outputDir, "critical.css");
        await fs.writeFile(criticalPath, criticalCSSContent);
      }

      // Write chunk-specific CSS files
      for (const [chunkName, css] of cssChunks) {
        const chunkPath = path.join(outputDir, `${chunkName}.css`);
        const optimizedCSS = minify ? await optimizeCSS(css, { minify }) : css;
        await fs.writeFile(chunkPath, optimizedCSS);
      }

      // Generate manifest
      const manifest = {
        main: "styles.css",
        critical: extractCritical ? "critical.css" : null,
        chunks: Array.from(cssChunks.keys()).map((name) => `${name}.css`),
        totalSize: Buffer.byteLength(allCSS),
        componentCount: componentStyles.size,
        extracted: new Date().toISOString(),
      };

      await fs.writeFile(path.join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2));

      console.log(`[CSS Extraction] Extracted ${extractedCSS.size} styles to ${outputDir}`);
      console.log(`[CSS Extraction] Total size: ${(manifest.totalSize / 1024).toFixed(2)}KB`);
    },
  };
}

/**
 * Extract styled components CSS from code
 */
async function extractStyledComponentsCSS(
  code: string,
  filename: string
): Promise<
  Array<{
    css: string;
    components: string[];
    isAboveFold: boolean;
  }>
> {
  const extracted: Array<{
    css: string;
    components: string[];
    isAboveFold: boolean;
  }> = [];

  // Regular expression to match styled components
  const styledRegex = /(?:const|let|var)\s+(\w+)\s*=\s*styled(?:\.\w+|\(['"`]\w+['"`]\))?\s*`([^`]+)`/g;

  let match;
  while ((match = styledRegex.exec(code)) !== null) {
    const componentName = match[1];
    const cssContent = match[2];

    // Check if component is marked as critical/above-fold
    const isAboveFold =
      code.includes(`${componentName}.critical = true`) ||
      (code.includes(`// @critical`) &&
        code.lastIndexOf("// @critical", match.index) > code.lastIndexOf("\n", match.index));

    extracted.push({
      css: processCSS(cssContent, componentName),
      components: [componentName],
      isAboveFold,
    });
  }

  return extracted;
}

/**
 * Process CSS content and scope it to component
 */
function processCSS(css: string, componentName: string): string {
  // Generate unique class name
  const className = `sc-${componentName}-${generateHash(css).slice(0, 8)}`;

  // Add scoping class
  const scopedCSS = `.${className} {\n${css}\n}`;

  // Process nested selectors
  return processNestedSelectors(scopedCSS, className);
}

/**
 * Process nested selectors in CSS
 */
function processNestedSelectors(css: string, parentClass: string): string {
  // Handle & references
  css = css.replace(/&/g, `.${parentClass}`);

  // Handle nested rules (simplified - in production use a proper CSS parser)
  css = css.replace(/\s+(\w+)\s*{/g, ` .${parentClass} $1 {`);

  return css;
}

/**
 * Transform code to reference extracted CSS
 */
function transformCodeForExtraction(code: string, extracted: Array<{ css: string; components: string[] }>): string {
  let transformed = code;

  extracted.forEach(({ components }) => {
    components.forEach((component) => {
      // Add import for extracted CSS
      const importStatement = `import './${component}.extracted.css';\n`;

      // Add at the top of the file
      if (!transformed.includes(importStatement)) {
        transformed = importStatement + transformed;
      }

      // Transform styled component to use className
      const styledRegex = new RegExp(
        `(const|let|var)\\s+${component}\\s*=\\s*styled[^\\` + "`" + `]+\\` + "`" + `[^\\` + "`" + `]+\\` + "`"
      );

      transformed = transformed.replace(styledRegex, (match) => {
        return `${match}\n${component}.className = 'sc-${component}-${generateHash(match).slice(0, 8)}';`;
      });
    });
  });

  return transformed;
}

/**
 * Optimize CSS with minification and purging
 */
async function optimizeCSS(
  css: string,
  options: {
    minify?: boolean;
    purge?: boolean;
    purgePaths?: string[];
    componentStyles?: Map<string, string>;
  }
): Promise<string> {
  let optimized = css;

  // Minify CSS
  if (options.minify) {
    const { minify } = await getCSSOptimizer();
    optimized = minify(optimized).css;
  }

  // Purge unused CSS
  if (options.purge && options.purgePaths) {
    const PurgeCSS = await getPurgeCSS();
    const purgecss = new PurgeCSS();
    const result = await purgecss.purge({
      content: options.purgePaths,
      css: [{ raw: optimized }],
      safelist: ["html", "body", /^sc-/], // Keep styled-component classes
    });

    optimized = result[0]?.css || optimized;
  }

  return optimized;
}

/**
 * Generate source map for CSS
 */
function generateCSSSourceMap(css: string, sources: Map<string, ExtractedCSS>): any {
  return {
    version: 3,
    sources: Array.from(sources.values()).map((s) => s.sourceFile || "unknown"),
    names: [],
    mappings: "", // Simplified - implement proper source mapping
    sourcesContent: Array.from(sources.values()).map((s) => s.css),
  };
}

/**
 * Generate source map for transformed code
 */
function generateSourceMap(original: string, transformed: string, filename: string): any {
  // Simplified source map generation
  return {
    version: 3,
    file: filename,
    sources: [filename],
    sourcesContent: [original],
    names: [],
    mappings: "", // Implement proper mapping
  };
}

/**
 * Check if file matches patterns
 */
function matchesPattern(file: string, include: string[], exclude: string[]): boolean {
  const micromatch = require("micromatch");

  if (exclude.some((pattern) => micromatch.isMatch(file, pattern))) {
    return false;
  }

  return include.some((pattern) => micromatch.isMatch(file, pattern));
}

/**
 * Generate hash for content
 */
function generateHash(content: string): string {
  return createHash("md5").update(content).digest("hex");
}

/**
 * Get chunk name from file path
 */
function getChunkName(filePath: string): string {
  const parts = filePath.split("/");
  const fileName = parts[parts.length - 1];

  // Extract route/page name
  if (filePath.includes("/pages/") || filePath.includes("/routes/")) {
    const routeMatch = filePath.match(/(?:pages|routes)\/(.+?)\./);
    if (routeMatch) {
      return routeMatch[1].replace(/\//g, "-");
    }
  }

  // Use component name
  const componentMatch = fileName.match(/^(.+?)\./);
  return componentMatch ? componentMatch[1] : "main";
}
