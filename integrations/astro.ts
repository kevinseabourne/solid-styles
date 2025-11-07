/**
 * Astro Integration for solid-styles
 * 
 * Simplifies setup of solid-styles with Lightning CSS in Astro projects
 */

export interface SolidStylesOptions {
  /**
   * Browser targets for Lightning CSS autoprefixing
   * @default ["> 0.25%", "not dead"]
   */
  targets?: string[];
  
  /**
   * Enable CSS minification
   * @default true
   */
  minify?: boolean;
  
  /**
   * Analyze component props for static extraction
   * @default true
   */
  analyzePropPatterns?: boolean;
  
  /**
   * Maximum prop combinations to generate
   * @default 100
   */
  maxPropCombinations?: number;
  
  /**
   * Enable development mode with verbose logging
   * @default false
   */
  devMode?: boolean;
}

/**
 * Astro integration for solid-styles with Lightning CSS
 * 
 * @example
 * ```js
 * // astro.config.mjs
 * import { defineConfig } from 'astro/config';
 * import solid from '@astrojs/solid-js';
 * import solidStyles from 'solid-styles/integrations/astro';
 * 
 * export default defineConfig({
 *   integrations: [
 *     solid(),
 *     solidStyles()
 *   ]
 * });
 * ```
 */
export default function solidStyles(options: SolidStylesOptions = {}): any {
  const {
    targets = ["> 0.25%", "not dead"],
    minify = true,
    analyzePropPatterns = true,
    maxPropCombinations = 100,
    devMode = false,
  } = options;

  return {
    name: 'solid-styles',
    hooks: {
      'astro:config:setup': async ({ updateConfig, config }: any) => {
        // Dynamically import the Lightning CSS plugin
        const { lightningCSSPlugin } = await import('../lightning/index.js');

        // Add Lightning CSS plugin to Vite config
        updateConfig({
          vite: {
            plugins: [
              lightningCSSPlugin({
                targets,
                minify,
                analyzePropPatterns,
                maxPropCombinations,
                include: [/\.[jt]sx?$/],
                exclude: [/node_modules/],
              })
            ]
          }
        });

        if (devMode) {
          console.log('[solid-styles] Lightning CSS plugin configured with options:', {
            targets,
            minify,
            analyzePropPatterns,
            maxPropCombinations,
          });
        }
      },
      'astro:config:done': ({ config }: any) => {
        if (options.devMode) {
          console.log('[solid-styles] Integration complete');
          console.log('[solid-styles] Vite plugins:', config.vite?.plugins?.length || 0);
        }
      }
    }
  };
}

