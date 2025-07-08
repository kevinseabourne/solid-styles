/**
 * Vinxi Plugin for Lightning CSS Integration
 *
 * This plugin integrates Lightning CSS optimization with Vinxi/SolidStart
 * for zero-runtime CSS-in-JS with styled-components
 */

import type { ComponentMetadata, ExtractedStyle, LightningCSSConfig } from "../types";
import { parseStyledComponent } from "../extractor/parser";
import { generateStaticCSS } from "../extractor/generator";
import { optimizeExtractedStyles } from "../extractor/optimizer";
import * as path from "path";
import { promises as fs } from "fs";

// Vinxi plugin interface - simplified for compatibility
interface VinxiPlugin {
  name: string;
  transform?: (
    code: string,
    id: string
  ) => Promise<{ code: string; map?: any } | null> | { code: string; map?: any } | null;
  generateBundle?: () => Promise<void> | void;
  configureServer?: (server: any) => void;
}

/**
 * Create the Lightning CSS Vinxi plugin
 *
 * This plugin integrates Lightning CSS zero-runtime extraction with Vinxi's build system
 */
export function lightningCSSPlugin(config: Partial<LightningCSSConfig> = {}): VinxiPlugin {
  const pluginConfig: LightningCSSConfig = {
    targets: ["> 0.25%", "not dead"],
    include: [/\.[jt]sx?$/],
    exclude: [/node_modules/],
    minify: true,
    analyzePropPatterns: true,
    maxPropCombinations: 100,
    ...config,
  };

  const cache = new Map<string, ComponentMetadata[]>();
  const extractedStyles = new Map<string, ExtractedStyle[]>();

  return {
    name: "vinxi:lightning-css",

    async transform(code: string, id: string) {
      // Check if file should be processed
      const shouldProcess = pluginConfig.include?.some((pattern) =>
        pattern instanceof RegExp ? pattern.test(id) : id.includes(pattern)
      );

      const shouldExclude = pluginConfig.exclude?.some((pattern) =>
        pattern instanceof RegExp ? pattern.test(id) : id.includes(pattern)
      );

      if (!shouldProcess || shouldExclude) {
        return null;
      }

      try {
        // Extract styled components
        const components = await parseStyledComponent(code, id);

        if (components.length === 0) {
          return null;
        }

        cache.set(id, components);

        // Generate static CSS for each component
        const styles: ExtractedStyle[] = [];

        for (const component of components) {
          // Check if we should analyze this component
          if (!pluginConfig.analyzePropPatterns || component.hasAnimations) {
            continue;
          }

          // Generate CSS for all prop combinations
          const componentStyles = generateStaticCSS(component, pluginConfig.maxPropCombinations || 100);
          styles.push(...componentStyles);
        }

        // Store extracted styles
        extractedStyles.set(id, styles);

        // Transform the component code to use runtime resolver
        const transformedCode = transformComponentCode(code, components);

        return {
          code: transformedCode,
          map: null,
        };
      } catch (error) {
        console.error(`Error processing ${id}:`, error);
        return null;
      }
    },

    async generateBundle() {
      // Merge all extracted styles
      const allStyles = Array.from(extractedStyles.values()).flat();

      // Merge duplicate rules
      const mergedStyles = mergeDuplicateRules(allStyles);

      // Optimize the CSS
      const optimizedCSS = await optimizeExtractedStyles(mergedStyles, pluginConfig.targets, pluginConfig.minify);

      // Create CSS file
      if (pluginConfig.outputPath) {
        await createCSSFile(mergedStyles, pluginConfig.outputPath, {
          targets: pluginConfig.targets,
          minify: pluginConfig.minify,
          sourceMap: true,
        });
      } else {
        // Write to default location
        await fs.writeFile(".output/public/_build/lightning-styles.css", optimizedCSS);
      }
    },

    // Hook into Vinxi's dev server for HMR
    configureServer(server: any) {
      if (server?.ws) {
        server.ws.on("vinxi:lightning-css:update", async ({ id }: { id: string }) => {
          const module = server.moduleGraph?.getModuleById?.(id);
          if (module && server.reloadModule) {
            await server.reloadModule(module);
          }
        });
      }
    },
  };
}

/**
 * Transform component code to use runtime resolver
 */
function transformComponentCode(code: string, components: ComponentMetadata[]): string {
  let transformedCode = code;

  // Import the runtime resolver
  const importStatement = `import { resolvePropsToClass } from "../lightning/runtime/resolver";\n`;
  transformedCode = importStatement + transformedCode;

  // Replace each styled component with runtime resolver
  for (const component of components) {
    const regex = new RegExp(
      `const\\s+${component.componentName}\\s*=\\s*styled\\.${component.tagName}\\s*\`[^]*?\``,
      "g"
    );

    const replacement = `const ${component.componentName} = resolveStyledComponent("${component.componentName}", "${component.tagName}")`;

    transformedCode = transformedCode.replace(regex, replacement);
  }

  return transformedCode;
}

/**
 * Merge duplicate CSS rules
 */
function mergeDuplicateRules(styles: ExtractedStyle[]): ExtractedStyle[] {
  const cssMap = new Map<string, ExtractedStyle>();

  for (const style of styles) {
    const existingStyle = cssMap.get(style.css);

    if (existingStyle) {
      // Merge class names
      existingStyle.className += `, .${style.className}`;
    } else {
      cssMap.set(style.css, { ...style });
    }
  }

  return Array.from(cssMap.values());
}

/**
 * Create CSS file with optimizations
 */
async function createCSSFile(
  styles: ExtractedStyle[],
  outputPath: string,
  config: {
    targets?: string[];
    minify?: boolean;
    sourceMap?: boolean;
  } = {}
): Promise<void> {
  const optimizedCSS = await optimizeExtractedStyles(styles, config.targets, config.minify);
  await fs.writeFile(outputPath, optimizedCSS);
}

/**
 * Export a preset configuration for SolidStart projects
 */
export const solidStartPreset: Partial<LightningCSSConfig> = {
  targets: ["> 0.25%", "not dead"],
  include: [/\.[jt]sx?$/],
  exclude: [/node_modules/, /_build/, /\.vinxi/],
  minify: true,
  analyzePropPatterns: true,
  maxPropCombinations: 100,
};

/**
 * Export a preset for development mode with fast refresh
 */
export const devPreset: Partial<LightningCSSConfig> = {
  targets: ["last 1 Chrome version"], // Faster for dev
  include: [/\.[jt]sx?$/],
  exclude: [/node_modules/],
  minify: false,
  analyzePropPatterns: true,
  maxPropCombinations: 50, // Fewer combinations for faster builds
};
