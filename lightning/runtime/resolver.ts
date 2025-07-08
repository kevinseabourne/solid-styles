/**
 * Lightning CSS Runtime Resolver
 *
 * Resolves props to pre-generated CSS classes at runtime
 */

import type { ExtractedStyle, RuntimeResolverConfig } from "../types";

/**
 * Runtime resolver class
 */
export class RuntimeResolver {
  private staticClassMap: Map<string, string>;
  private fallbackToRuntime: boolean;
  private enableDevMode: boolean;

  constructor(config: RuntimeResolverConfig) {
    this.staticClassMap = new Map();
    this.fallbackToRuntime = config.fallbackToRuntime ?? true;
    this.enableDevMode = config.enableDevMode ?? false;

    // Initialize with provided mappings
    if (config.staticClassMap) {
      Array.from(config.staticClassMap.entries()).forEach(([key, value]) => {
        this.staticClassMap.set(key, value.className);
      });
    }
  }

  /**
   * Resolve props to a CSS class name
   */
  resolveProps(props: Record<string, any>): string | null {
    const styleProps = this.filterStyleProps(props);
    const propsKey = this.createPropsKey(styleProps);

    if (this.enableDevMode) {
      console.log(`[Lightning CSS] Resolving props:`, props);
      console.log(`[Lightning CSS] Filtered style props:`, styleProps);
      console.log(`[Lightning CSS] Generated key:`, propsKey);
      console.log(`[Lightning CSS] Available keys in map:`, Array.from(this.staticClassMap.keys()));
    }

    // Try direct lookup first
    const directLookup = this.staticClassMap.get(propsKey);
    if (directLookup) {
      if (this.enableDevMode) {
        console.log(`[Lightning CSS] Direct match found: ${propsKey} -> ${directLookup}`);
      }
      return directLookup;
    }

    // Try alternative key formats for backward compatibility
    // Format 1: "variant:primary|size:large"
    const altKey1 = Object.entries(styleProps)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join("|");

    const altLookup1 = this.staticClassMap.get(altKey1);
    if (altLookup1) {
      if (this.enableDevMode) {
        console.log(`[Lightning CSS] Alternative match found: ${altKey1} -> ${altLookup1}`);
      }
      return altLookup1;
    }

    // Format 2: "primary-large" (for simple cases)
    const values = Object.values(styleProps);
    if (values.length > 0) {
      const simpleKey = values.join("-");
      const simpleLookup = this.staticClassMap.get(simpleKey);
      if (simpleLookup) {
        if (this.enableDevMode) {
          console.log(`[Lightning CSS] Simple match found: ${simpleKey} -> ${simpleLookup}`);
        }
        return simpleLookup;
      }
    }

    if (this.enableDevMode) {
      console.log(`[Lightning CSS] No match found for props:`, styleProps);
      console.log(`[Lightning CSS] Available keys:`, Array.from(this.staticClassMap.keys()));
    }

    return this.fallbackToRuntime ? null : null;
  }

  /**
   * Create a deterministic key from props
   */
  private createPropsKey(props: Record<string, any>): string {
    // Filter out non-style props
    const styleProps = this.filterStyleProps(props);

    // Sort keys for deterministic ordering
    const sortedKeys = Object.keys(styleProps).sort();

    // Create key
    const key = sortedKeys.map((k) => `${k}:${styleProps[k]}`).join("|");

    return key;
  }

  /**
   * Filter out non-style props
   */
  private filterStyleProps(props: Record<string, any>): Record<string, any> {
    const styleProps: Record<string, any> = {};

    // List of known style prop names
    const stylePropNames = [
      "variant",
      "size",
      "color",
      "disabled",
      "active",
      "theme",
      "rounded",
      // Add more as needed
    ];

    for (const key in props) {
      // Skip template literal props
      if (key === "0" || key === "length" || key === "raw") {
        continue;
      }

      // Skip non-style props like children, ref, etc.
      if (key === "children" || key === "ref" || key === "style") {
        continue;
      }

      // Include known style props
      if (stylePropNames.includes(key)) {
        styleProps[key] = props[key];
      }
    }

    return styleProps;
  }

  /**
   * Check if props should use runtime styles
   */
  shouldUseRuntime(props: Record<string, any>): boolean {
    // Always use runtime for animated components
    if (props._isAnimated) return true;

    // Check if we have a static class
    const hasStaticClass = this.resolveProps(props) !== null;

    // Use runtime if no static class and fallback is enabled
    return !hasStaticClass && this.fallbackToRuntime;
  }

  /**
   * Get statistics about the resolver
   */
  getStats(): {
    totalClasses: number;
    memoryUsage: number;
  } {
    return {
      totalClasses: this.staticClassMap.size,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Add class mappings to the resolver
   */
  addClassMappings(mappings: Record<string, string>): void {
    Array.from(Object.entries(mappings)).forEach(([key, className]) => {
      this.staticClassMap.set(key, className);
    });

    if (this.enableDevMode) {
      console.log(`[Lightning CSS] Added ${Object.keys(mappings).length} class mappings`);
    }
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;

    for (const [key, value] of Array.from(this.staticClassMap)) {
      totalSize += key.length + value.length;
    }

    // Rough estimate in bytes
    return totalSize * 2; // 2 bytes per character
  }
}

/**
 * Global resolver instance
 */
let globalResolver: RuntimeResolver | null = null;

/**
 * Initialize the global resolver
 */
export function initializeResolver(config: RuntimeResolverConfig): void {
  globalResolver = new RuntimeResolver(config);
}

/**
 * Get the global resolver
 */
export function getResolver(): RuntimeResolver {
  if (!globalResolver) {
    throw new Error("Runtime resolver not initialized. Call initializeResolver() first.");
  }

  return globalResolver;
}

/**
 * Resolve props using the global resolver
 */
export function resolvePropsToClass(props: Record<string, any>): string | null {
  return getResolver().resolveProps(props);
}

/**
 * Check if should use runtime styles
 */
export function shouldUseRuntimeStyles(props: Record<string, any>): boolean {
  return getResolver().shouldUseRuntime(props);
}
