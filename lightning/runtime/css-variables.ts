/**
 * CSS Variable Manager
 *
 * Manages CSS custom properties for dynamic values like themes
 */

import type { AnimationDetection } from "../types";

export interface CSSVariableConfig {
  prefix?: string;
  scope?: HTMLElement | string;
  cache?: boolean;
}

export interface ThemeVariables {
  [key: string]: string | ThemeVariables;
}

/**
 * CSS Variable Manager class
 */
export class CSSVariableManager {
  private prefix: string;
  private scope: HTMLElement | null;
  private cache: Map<string, string>;
  private enableCache: boolean;

  constructor(config: CSSVariableConfig = {}) {
    this.prefix = config.prefix || "--styled";
    this.enableCache = config.cache ?? true;
    this.cache = new Map();

    // Set scope element
    if (typeof config.scope === "string") {
      this.scope = document.querySelector(config.scope);
    } else if (config.scope instanceof HTMLElement) {
      this.scope = config.scope;
    } else {
      this.scope = document.documentElement;
    }
  }

  /**
   * Apply CSS variables to an element
   */
  applyCSSVariables(element: HTMLElement, variables: Record<string, string>): void {
    const cacheKey = this.getCacheKey(variables);

    // Check cache first
    if (this.enableCache && this.cache.has(cacheKey)) {
      const cachedVars = this.cache.get(cacheKey)!;
      element.setAttribute("data-css-vars", cachedVars);
      return;
    }

    // Apply variables
    Object.entries(variables).forEach(([name, value]) => {
      // Check if the variable name already starts with --
      const varName = name.startsWith("--") ? name : `${this.prefix}-${name}`;

      // Only apply valid values
      if (this.isValidCSSValue(value)) {
        element.style.setProperty(varName, value);
      }
    });

    // Cache result
    if (this.enableCache) {
      this.cache.set(cacheKey, element.getAttribute("data-css-vars") || "");
    }
  }

  /**
   * Apply theme variables globally
   */
  applyThemeVariables(theme: ThemeVariables, element?: HTMLElement): void {
    const target = element || this.scope;
    if (!target) return;

    const flatVariables = this.flattenTheme(theme);

    Object.entries(flatVariables).forEach(([name, value]) => {
      const varName = `--${this.prefix}-${name}`;
      target.style.setProperty(varName, value);
    });
  }

  /**
   * Flatten nested theme object
   */
  private flattenTheme(theme: ThemeVariables, prefix = "", separator = "-"): Record<string, string> {
    const result: Record<string, string> = {};

    Object.entries(theme).forEach(([key, value]) => {
      const newKey = prefix ? `${prefix}${separator}${key}` : key;

      if (typeof value === "object" && value !== null) {
        Object.assign(result, this.flattenTheme(value as ThemeVariables, newKey, separator));
      } else {
        result[newKey] = String(value);
      }
    });

    return result;
  }

  /**
   * Generate CSS variables for a component
   */
  generateComponentVariables(componentName: string, props: Record<string, any>): Record<string, string> {
    const variables: Record<string, string> = {};

    // Filter numeric and string props that could be CSS values
    Object.entries(props).forEach(([key, value]) => {
      // Skip invalid CSS variable names (numeric keys, template literal props)
      if (!this.isValidCSSVariableName(key)) {
        return;
      }

      if (this.isValidCSSValue(value)) {
        variables[`--${componentName}-${key}`] = String(value);
      }
    });

    return variables;
  }

  /**
   * Check if a property name is valid for CSS variables
   */
  private isValidCSSVariableName(name: string): boolean {
    // CSS variable names cannot start with a number
    if (/^\d/.test(name)) {
      return false;
    }

    // Skip template literal props
    if (name === "length" || name === "raw") {
      return false;
    }

    // Skip SolidJS internal props
    if (name === "ref" || name === "children") {
      return false;
    }

    return true;
  }

  /**
   * Check if a value can be used as CSS variable
   */
  private isValidCSSValue(value: any): boolean {
    if (value == null) return false;

    const type = typeof value;

    // Allow strings and numbers
    if (type === "string" || type === "number") {
      return true;
    }

    // Allow specific objects (colors, etc.)
    if (type === "object" && value.toString && value.toString() !== "[object Object]") {
      return true;
    }

    return false;
  }

  /**
   * Create cache key from variables
   */
  private getCacheKey(variables: Record<string, any>): string {
    return JSON.stringify(variables);
  }

  /**
   * Clear variable cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Remove CSS variables from element
   */
  removeCSSVariables(element: HTMLElement, names: string[]): void {
    names.forEach((name) => {
      const varName = `${this.prefix}-${name}`;
      element.style.removeProperty(varName);
    });
  }

  /**
   * Get all CSS variables from element
   */
  getCSSVariables(element: HTMLElement): Record<string, string> {
    const computedStyle = window.getComputedStyle(element);
    const variables: Record<string, string> = {};

    // Get all CSS properties
    for (let i = 0; i < computedStyle.length; i++) {
      const prop = computedStyle[i];
      if (prop.startsWith(this.prefix)) {
        const value = computedStyle.getPropertyValue(prop);
        variables[prop.substring(this.prefix.length + 1)] = value;
      }
    }

    return variables;
  }
}

/**
 * Global CSS variable manager instance
 */
let globalManager: CSSVariableManager | null = null;

/**
 * Initialize global CSS variable manager
 */
export function initializeCSSVariables(config?: CSSVariableConfig): CSSVariableManager {
  globalManager = new CSSVariableManager(config);
  return globalManager;
}

/**
 * Get global CSS variable manager
 */
export function getCSSVariableManager(): CSSVariableManager {
  if (!globalManager) {
    globalManager = new CSSVariableManager();
  }
  return globalManager;
}

/**
 * Analyze if component should use CSS variables
 */
export function shouldUseCSSVariables(props: Record<string, any>, animationDetection?: AnimationDetection): boolean {
  // Never use CSS variables for animations
  if (animationDetection?.hasSpringAnimations) {
    return false;
  }

  // Use CSS variables for theme props
  if (props.theme) {
    return true;
  }

  // Use CSS variables for dynamic numeric props
  const dynamicProps = ["width", "height", "margin", "padding", "fontSize"];
  return dynamicProps.some((prop) => prop in props && typeof props[prop] === "number");
}
