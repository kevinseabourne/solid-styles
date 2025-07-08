/**
 * Enhanced Styled Function with Lightning CSS Integration
 *
 * This is the main integration point that enhances the styled function
 * with Lightning CSS optimizations while preserving animations
 */

import { Component, JSX, splitProps, mergeProps, createComponent } from "solid-js";
import { Dynamic } from "solid-js/web";
import { RuntimeResolver, resolvePropsToClass, shouldUseRuntimeStyles, initializeResolver } from "./resolver";
import { CSSVariableManager, getCSSVariableManager, shouldUseCSSVariables } from "./css-variables";
import type { AnimationDetection, ExtractedStyle } from "../types";

// Import the original styled function and utilities from the main package
import { css } from "../../src";

// Helper function to check if tag is HTML element
const isHTMLTag = (tag: any): boolean => typeof tag === "string";

interface EnhancedStyledOptions {
  resolver?: RuntimeResolver;
  cssVariableManager?: CSSVariableManager;
  enableDevMode?: boolean;
}

/**
 * Check if component has animation props
 */
function hasAnimationProps(props: any): boolean {
  return !!(
    props?.animate ||
    props?.animation ||
    props?.motion ||
    props?.transition ||
    props?.initial ||
    props?.exit ||
    props?.variants ||
    props?.whileHover ||
    props?.whileTap ||
    props?.whileFocus ||
    props?.whileInView
  );
}

/**
 * Detect animations in style template
 */
function detectAnimationsInTemplate(strings: TemplateStringsArray): AnimationDetection {
  const template = strings.join("");

  // Check for animation properties
  const hasSpringAnimations =
    template.includes("spring") ||
    template.includes("animate") ||
    template.includes("transition") ||
    template.includes("transform");

  const animatedProperties: string[] = [];

  // Extract animated properties
  const transformProps = template.match(/transform|translate|scale|rotate|skew/gi);
  if (transformProps) {
    animatedProperties.push(...transformProps);
  }

  return {
    hasSpringAnimations,
    animatedProperties,
    requiresRuntime: hasSpringAnimations,
  };
}

/**
 * Create minimal component for animations (unchanged from current system)
 */
function createMinimalComponent(tag: any, strings: TemplateStringsArray, args: any[]) {
  return (props: any) => {
    // Use current BauCSS system for animations
    const className = css(strings, ...args.map((arg) => (typeof arg === "function" ? arg(props) : arg)));

    const [localProps, otherProps] = splitProps(props, ["className", "style"]);

    const mergedProps = mergeProps(otherProps, {
      className: `${className} ${localProps.className || ""}`.trim(),
      style: localProps.style,
    });

    if (isHTMLTag(tag)) {
      return createComponent(Dynamic as any, {
        component: tag,
        ...mergedProps,
      });
    } else {
      return createComponent(tag as any, mergedProps);
    }
  };
}

/**
 * Create static optimized component
 */
function createStaticComponent(tag: any, staticClass: string, props: any, cssVariables?: Record<string, string>) {
  const [localProps, otherProps] = splitProps(props, ["className", "style", "ref"]);

  // Merge class names
  const className = `${staticClass} ${localProps.className || ""}`.trim();

  // Handle ref with CSS variables
  const handleRef = (el: HTMLElement) => {
    if (cssVariables && Object.keys(cssVariables).length > 0) {
      const cssVarManager = getCSSVariableManager();
      cssVarManager.applyCSSVariables(el, cssVariables);
    }

    // Call original ref if provided
    if (typeof localProps.ref === "function") {
      localProps.ref(el);
    }
  };

  const mergedProps = mergeProps(otherProps, {
    className,
    style: localProps.style,
    ref: handleRef,
  });

  if (isHTMLTag(tag)) {
    return createComponent(Dynamic as any, {
      component: tag,
      ...mergedProps,
    });
  } else {
    return createComponent(tag as any, mergedProps);
  }
}

/**
 * Enhanced styled function with Lightning CSS integration
 *
 * This function provides the main API that developers use.
 * It automatically detects whether to use static optimization or runtime styles.
 */
export function enhancedStyled(tag: any, options: EnhancedStyledOptions = {}) {
  return (strings: TemplateStringsArray, ...args: any[]) => {
    // Detect animations in template
    const animationDetection = detectAnimationsInTemplate(strings);

    // Component ID for tracking
    const componentId = tag.toString();

    return (props: any) => {
      // CRITICAL: Animation detection stays identical to preserve spring system
      if (hasAnimationProps(props) || animationDetection.hasSpringAnimations) {
        console.log("[LIGHTNING] Animation props detected - using current system");

        // Use EXISTING animation system - zero changes!
        const MinimalStyledComp = createMinimalComponent(tag, strings, args);

        // Import animated HOC dynamically to avoid circular dependencies
        return import("../../animation/animatedStyled").then(({ animated }) => {
          const AnimatedComp = animated(MinimalStyledComp);
          return createComponent(AnimatedComp, props);
        });
      }

      // Try static class resolution
      const staticClass = resolvePropsToClass(props);

      if (staticClass) {
        console.log("[LIGHTNING] Using static class:", staticClass);

        // Check if we need CSS variables
        if (shouldUseCSSVariables(props, animationDetection)) {
          const cssVarManager = getCSSVariableManager();
          const cssVariables = cssVarManager.generateComponentVariables(componentId, props);

          return createStaticComponent(tag, staticClass, props, cssVariables);
        }

        return createStaticComponent(tag, staticClass, props);
      }

      // Check if we should use CSS variables for theme
      if (shouldUseCSSVariables(props, animationDetection)) {
        console.log("[LIGHTNING] Using CSS variables for theme");

        // Generate base class with CSS variables
        const baseClass = css(
          strings,
          ...args.map((arg) => (typeof arg === "function" ? `var(--styled-${componentId})` : arg))
        );

        const cssVarManager = getCSSVariableManager();
        const cssVariables = cssVarManager.generateComponentVariables(componentId, props);

        return createStaticComponent(tag, baseClass, props, cssVariables);
      }

      // Fallback: Use current BauCSS system
      console.log("[LIGHTNING] Using current BauCSS system");
      return createMinimalComponent(tag, strings, args)(props);
    };
  };
}

/**
 * Export a function to enhance the existing makeStyled
 * This is what gets integrated into the main styling system
 */
export function enhanceMakeStyled(originalMakeStyled: any) {
  return function (...args: any[]) {
    const styled = originalMakeStyled(...args);

    return function enhancedStyledWrapper(tag: any, ...styleArgs: any[]) {
      // Get the original styled component
      const OriginalStyledComponent = styled(tag, ...styleArgs);

      // Return enhanced version that checks for optimizations
      return function OptimizedStyledComponent(strings: TemplateStringsArray, ...args: any[]) {
        // First check if Lightning CSS optimization is available
        if (typeof window !== "undefined" && window.__LIGHTNING_CSS_ENABLED__) {
          return enhancedStyled(tag)(strings, ...args);
        }

        // Fallback to original implementation
        return OriginalStyledComponent(strings, ...args);
      };
    };
  };
}

/**
 * Type augmentation for window object
 */
declare global {
  interface Window {
    __LIGHTNING_CSS_ENABLED__?: boolean;
    __LIGHTNING_CSS_CONFIG__?: {
      resolver?: RuntimeResolver;
      cssVariableManager?: CSSVariableManager;
    };
  }
}

/**
 * Initialize Lightning CSS runtime
 */
export function initializeLightningCSS(config: { staticClassMap: Map<string, string>; enableDevMode?: boolean }) {
  if (typeof window !== "undefined") {
    window.__LIGHTNING_CSS_ENABLED__ = true;

    // Convert Map<string, string> to Map<string, ExtractedStyle>
    const extractedStyleMap = new Map<string, ExtractedStyle>();
    config.staticClassMap.forEach((className, propKey) => {
      // Parse the prop combination from the key
      let propCombination: Record<string, any> = {};

      try {
        // Try to parse as JSON first
        propCombination = JSON.parse(propKey);
      } catch {
        // If not JSON, parse the key format like "variant:primary|size:large"
        const pairs = propKey.split("|");
        pairs.forEach((pair) => {
          const [key, value] = pair.split(":");
          if (key && value !== undefined) {
            // Try to parse value as JSON (for booleans/numbers), otherwise use as string
            try {
              propCombination[key] = JSON.parse(value);
            } catch {
              propCombination[key] = value;
            }
          }
        });
      }

      // Create ExtractedStyle object from className mapping
      extractedStyleMap.set(propKey, {
        className,
        css: "", // CSS is already in the static file
        propCombination,
      });
    });

    // Initialize resolver with converted map
    const resolver = new RuntimeResolver({
      staticClassMap: extractedStyleMap,
      fallbackToRuntime: true,
      enableDevMode: config.enableDevMode,
    });

    // Initialize CSS variable manager
    const cssVariableManager = getCSSVariableManager();

    // IMPORTANT: Initialize the global resolver
    initializeResolver({
      staticClassMap: extractedStyleMap,
      fallbackToRuntime: true,
      enableDevMode: config.enableDevMode,
    });

    window.__LIGHTNING_CSS_CONFIG__ = {
      resolver,
      cssVariableManager,
    };
  }
}
