/**
 * Example Astro Configuration for solid-styles with Lightning CSS
 * 
 * This configuration enables zero-runtime CSS-in-JS with solid-styles
 * in Astro projects using SolidJS islands.
 * 
 * Features:
 * - Zero-runtime CSS extraction via Lightning CSS
 * - Optimized bundle size
 * - SSR support
 * - Static CSS generation at build time
 */

import { defineConfig } from 'astro/config';
import solid from '@astrojs/solid-js';
import { lightningCSSPlugin } from 'solid-styles/lightning';

export default defineConfig({
  integrations: [
    solid({
      // SolidJS configuration
      // Leave empty for defaults or customize as needed
    })
  ],
  
  vite: {
    plugins: [
      // Lightning CSS plugin for zero-runtime extraction
      lightningCSSPlugin({
        // Optional: Browser targets (defaults to "> 0.25%, not dead")
        targets: ["> 0.25%", "not dead"],
        
        // Optional: Minify output CSS (default: true in production)
        minify: true,
        
        // Optional: Analyze prop patterns for static extraction
        analyzePropPatterns: true,
        
        // Optional: Maximum prop combinations to generate
        maxPropCombinations: 100,
        
        // Optional: Custom output path for generated CSS
        // outputPath: './dist/lightning-styles.css'
      })
    ],
    
    // Optional: Optimize dependencies
    optimizeDeps: {
      include: ['solid-styles', 'solid-styles/animation']
    }
  }
});
