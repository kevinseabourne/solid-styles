/**
 * Lightning CSS Integration Types
 *
 * Type definitions for the Lightning CSS zero-runtime integration
 * with styled-components library
 */

import type { Component, JSX } from "solid-js";

/**
 * Prop pattern types for build-time analysis
 */
export interface PropPattern {
  propName: string;
  values: Array<string | number | boolean>;
  defaultValue?: string | number | boolean;
}

/**
 * Static style extraction result
 */
export interface ExtractedStyle {
  className: string;
  css: string;
  propCombination: Record<string, any>;
  componentName?: string;
  hash?: string;
}

/**
 * Component metadata for Lightning CSS processing
 */
export interface ComponentMetadata {
  // Core properties
  componentName: string;
  tagName: keyof JSX.IntrinsicElements | Component<any>;
  styles: string;
  propPatterns: PropPattern[];
  hasAnimations: boolean;
  isAnimated: boolean;

  // Additional properties for Vinxi plugin
  name: string;
  tag: string;
  css: string;
  hash: string;
  props: PropPattern[];
}

/**
 * Lightning CSS build configuration
 */
export interface LightningCSSConfig {
  targets: string[];
  minify: boolean;
  cssModules?: boolean;
  analyzePropPatterns?: boolean;
  maxPropCombinations?: number;
  outputPath?: string;

  // File matching patterns
  include?: (string | RegExp)[];
  exclude?: (string | RegExp)[];
}

/**
 * Runtime resolver configuration
 */
export interface RuntimeResolverConfig {
  staticClassMap: Map<string, ExtractedStyle>;
  fallbackToRuntime: boolean;
  enableDevMode?: boolean;
}

/**
 * Transform result from Lightning CSS
 */
export interface TransformResult {
  code: string;
  map?: string;
  exports?: Record<string, string>;
}

/**
 * Build-time analyzer result
 */
export interface AnalysisResult {
  components: ComponentMetadata[];
  totalCombinations: number;
  estimatedSizeReduction: number;
  warnings: string[];
}

/**
 * Spring animation detection result
 */
export interface AnimationDetection {
  hasSpringAnimations: boolean;
  animatedProperties: string[];
  requiresRuntime: boolean;
}
