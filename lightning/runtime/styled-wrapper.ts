/**
 * Styled Wrapper with Lightning CSS Integration
 *
 * This module provides a wrapped version of the styled function
 * that automatically uses Lightning CSS optimizations when available
 */

import { styled as originalStyled } from "../../src";
import { Component, JSX, splitProps, mergeProps, createComponent } from "solid-js";
import { Dynamic } from "solid-js/web";
import { resolvePropsToClass } from "./resolver";
import { getCSSVariableManager } from "./css-variables";

// Log when module loads
if (typeof window !== "undefined") {
  console.log("[LIGHTNING-CSS] Styled wrapper loaded");
}

// Helper to check if component has animations
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

// Create the wrapped styled function
export const styled = new Proxy(originalStyled, {
  get(target, prop) {
    // Get the original property
    const originalValue = Reflect.get(target, prop);

    // If it's not a function, return as-is
    if (typeof originalValue !== "function") {
      return originalValue;
    }

    // Return wrapped function
    return function wrappedStyled(...args: any[]) {
      // Get the original styled component
      const OriginalComponent = originalValue.apply(target, args);

      // Return wrapped component
      return function LightningCSSComponent(props: any) {
        // Check if Lightning CSS is enabled
        if (typeof window !== "undefined" && window.__LIGHTNING_CSS_ENABLED__) {
          console.log("[LIGHTNING-CSS] Styled component rendering with props:", Object.keys(props));

          // Check for animations
          if (hasAnimationProps(props)) {
            console.log("[LIGHTNING-CSS] Animation props detected, using original system");
            return OriginalComponent(props);
          }

          // Try to resolve static class
          console.log("[LIGHTNING-CSS] Calling resolvePropsToClass with:", props);
          const staticClass = resolvePropsToClass(props);
          console.log("[LIGHTNING-CSS] Resolver returned:", staticClass);

          if (staticClass) {
            console.log("[LIGHTNING-CSS] Static class resolved:", staticClass);

            // Create optimized component
            const [localProps, otherProps] = splitProps(props, ["className", "style", "ref"]);
            const className = `${staticClass} ${localProps.className || ""}`.trim();

            // Handle CSS variables
            const handleRef = (el: HTMLElement) => {
              const cssVarManager = getCSSVariableManager();
              // Create a clean component name from the tag
              const componentName = typeof prop === "string" ? prop : "component";
              const cssVariables = cssVarManager.generateComponentVariables(componentName, props);

              if (Object.keys(cssVariables).length > 0) {
                console.log("[LIGHTNING-CSS] Generated CSS variables:", cssVariables);
                cssVarManager.applyCSSVariables(el, cssVariables);
                console.log("[LIGHTNING-CSS] Applied CSS variables to element");
              }

              // Call original ref
              if (typeof localProps.ref === "function") {
                localProps.ref(el);
              }
            };

            const mergedProps = mergeProps(otherProps, {
              className,
              style: localProps.style,
              ref: handleRef,
            });

            // Use Dynamic for HTML elements
            if (typeof prop === "string") {
              return createComponent(Dynamic as any, {
                component: prop,
                ...mergedProps,
              });
            } else {
              return createComponent(prop as any, mergedProps);
            }
          } else {
            console.log("[LIGHTNING-CSS] Static class resolved:", staticClass);
          }

          // Fallback to runtime
          const runtimeComponent = OriginalComponent(props);
          console.log("[LIGHTNING-CSS] Using runtime component");

          // Add CSS variables to runtime component if it's a valid component
          if (runtimeComponent && typeof runtimeComponent === "object" && "ref" in runtimeComponent) {
            const originalRef = (runtimeComponent as any).ref;
            (runtimeComponent as any).ref = (el: HTMLElement) => {
              const cssVarManager = getCSSVariableManager();
              // Create a clean component name from the tag
              const componentName = typeof prop === "string" ? prop : "component";
              const cssVariables = cssVarManager.generateComponentVariables(componentName, props);

              if (Object.keys(cssVariables).length > 0) {
                console.log("[LIGHTNING-CSS] Generated CSS variables:", cssVariables);
                cssVarManager.applyCSSVariables(el, cssVariables);
                console.log("[LIGHTNING-CSS] Applied CSS variables to element");
              }

              if (typeof originalRef === "function") {
                originalRef(el);
              }
            };
          }

          return runtimeComponent;
        }

        // Lightning CSS not enabled, use original
        return OriginalComponent(props);
      };
    };
  },
}) as typeof originalStyled;

// Also export the enhanced styled for direct usage
export { enhancedStyled } from "./enhanced-styled";

// Re-export animated for convenience
export { animated } from "../../animation/animatedStyled";
