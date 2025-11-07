/**
 * Example Vite Configuration for solid-styles with Lightning CSS
 * 
 * This configuration enables zero-runtime CSS-in-JS with solid-styles
 * in Vite + SolidJS projects.
 * 
 * Features:
 * - Zero-runtime CSS extraction via Lightning CSS
 * - Optimized bundle size
 * - SSR support
 * - Static CSS generation at build time
 */

import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { lightningCSSPlugin } from 'solid-styles/lightning';

export default defineConfig({
  plugins: [
    solid(),
    
    // Lightning CSS plugin for zero-runtime extraction
    lightningCSSPlugin({
      // Optional: Browser targets (defaults to "> 0.25%, not dead")
      targets: ["> 0.25%", "not dead"],
      
      // Optional: Minify output CSS (default: true in production)
      minify: process.env.NODE_ENV === 'production',
      
      // Optional: Analyze prop patterns for static extraction
      analyzePropPatterns: true,
      
      // Optional: Maximum prop combinations to generate
      maxPropCombinations: 100,
      
      // Optional: Files to include
      include: [/\.[jt]sx?$/],
      
      // Optional: Files to exclude
      exclude: [/node_modules/, /\.test\./],
      
      // Optional: Custom output path for generated CSS
      // outputPath: './dist/assets/lightning-styles.css'
    })
  ],
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['solid-styles', 'solid-styles/animation']
  },
  
  build: {
    target: 'es2020',
    minify: 'esbuild',
    
    // CSS code splitting
    cssCodeSplit: true,
    
    rollupOptions: {
      output: {
        // Optimize chunking
        manualChunks: {
          'solid-styles-core': ['solid-styles'],
          'solid-styles-animation': ['solid-styles/animation']
        }
      }
    }
  }
});
