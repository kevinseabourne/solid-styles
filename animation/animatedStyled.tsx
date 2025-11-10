/**
 * Animated Styled Components
 *
 * This file provides a higher-order component that adds animation capabilities
 * to styled components or regular HTML elements.
 */

import {
  Accessor,
  Component,
  ComponentProps,
  JSX,
  batch,
  createComponent,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  onMount,
  splitProps,
} from "solid-js";
import { AnimationConfig, useAnimation } from "./hooks/useAnimation";
import {
  AnimationControls,
  AnimationOptions,
  AnimationResult,
  SpringTarget,
  WidenSpringTarget,
  createAnimation,
  springPresets,
} from "./spring-bridge";
import { AnimationTrigger, InViewOptions, useTrigger } from "./hooks/useTriggers";
import { Color, ColorFormat, Gradient, GradientStop } from "../utils/spring";

import { Dynamic } from "solid-js/web";
import { styled } from "../src";

// Debug mode flag - set to false for production and clean test output
// @ts-ignore - import.meta.env is replaced at build time
const IS_DEBUG_MODE = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'development' && import.meta.env?.ENABLE_DEBUG_LOGGING === 'true';

// =============================================================================
// Constants and Utilities
// =============================================================================

/**
 * Map of CSS properties that need units
 * Used to automatically add units to numeric values
 */
const CSS_NUMERIC_PROPERTIES = new Map<string, string>([
  // Dimensions
  ["width", "px"],
  ["height", "px"],
  ["minWidth", "px"],
  ["minHeight", "px"],
  ["maxWidth", "px"],
  ["maxHeight", "px"],

  // Spacing
  ["padding", "px"],
  ["paddingTop", "px"],
  ["paddingRight", "px"],
  ["paddingBottom", "px"],
  ["paddingLeft", "px"],
  ["margin", "px"],
  ["marginTop", "px"],
  ["marginRight", "px"],
  ["marginBottom", "px"],
  ["marginLeft", "px"],

  // Positioning
  ["top", "px"],
  ["right", "px"],
  ["bottom", "px"],
  ["left", "px"],

  // Border
  ["borderWidth", "px"],
  ["borderTopWidth", "px"],
  ["borderRightWidth", "px"],
  ["borderBottomWidth", "px"],
  ["borderLeftWidth", "px"],
  ["borderRadius", "px"],

  // Font
  ["fontSize", "px"],
  ["lineHeight", ""],
  ["letterSpacing", "px"],

  // Other
  ["zIndex", ""],
  ["opacity", ""],
  ["flex", ""],
  ["flexGrow", ""],
  ["flexShrink", ""],
  ["scale", ""],
  ["rotate", "deg"],
  ["translateX", "px"],
  ["translateY", "px"],
  ["translateZ", "px"],
]);

// =============================================================================
// Types
// =============================================================================

/**
 * Enhanced animation configuration for the animated component
 */
export interface AnimateConfig<T extends SpringTarget = any> {
  /**
   * Initial state of the animation
   */
  from: T;

  /**
   * Target value to animate to
   */
  to: WidenSpringTarget<T>;

  /**
   * Spring configuration
   */
  config?: {
    /**
     * Spring stiffness
     * Default: 150
     */
    stiffness?: number;

    /**
     * Spring damping
     * Default: 15
     */
    damping?: number;

    /**
     * Animation delay in ms
     * Default: 0
     */
    delay?: number;

    /**
     * Whether to skip animation
     * Default: false
     */
    immediate?: boolean;
  };

  /**
   * Trigger for when to start the animation
   */
  when?: AnimationTrigger | AnimationTrigger[];

  /**
   * Options for inView trigger
   */
  inViewOptions?: InViewOptions;

  /**
   * If true, animation will play in reverse when trigger becomes inactive
   * Default: false
   */
  reverseOnExit?: boolean;

  /**
   * CSS styles for animation target
   * These will be applied automatically based on animation state
   */
  style?: Record<string, any>;

  /**
   * Variant name for predefined animations
   */
  variant?: string;

  /**
   * Lifecycle callbacks
   */
  onStart?: () => void;
  onComplete?: () => void;
  onInterrupt?: () => void;

  /**
   * If true, respects user's reduced motion preferences
   * Default: true
   */
  respectReducedMotion?: boolean;
}

/**
 * Props for the animated component
 */
export interface AnimatedProps<P = {}> {
  /**
   * Animation configuration
   */
  animate?: AnimateConfig | AnimateConfig[];

  /**
   * Apply CSS transition instead of spring animation for reduced motion
   */
  reducedMotionTransition?: string;

  /**
   * Ref to the underlying element
   */
  ref?: (el: HTMLElement) => void;

  /**
   * CSS style overrides
   */
  style?: JSX.CSSProperties;

  /**
   * Whether to use hardware acceleration
   * Default: "auto" (uses GPU for transform animations)
   */
  hardware?: "auto" | "always" | "never";
}

/**
 * Animation context for connecting animations to DOM elements
 */
interface AnimationContext {
  targets: Set<HTMLElement>;
  results: AnimationResult<any>[];
  active: boolean;
  cleanup: () => void;
}

// =============================================================================
// Animation Variants
// =============================================================================

/**
 * Predefined animation variants for common use cases
 */
export const variants: Record<string, AnimateConfig> = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: { stiffness: 100, damping: 15 },
  },
  fadeInUp: {
    from: { opacity: 0, y: 20 },
    to: { opacity: 1, y: 0 },
    config: { stiffness: 120, damping: 14 },
  },
  fadeInDown: {
    from: { opacity: 0, y: -20 },
    to: { opacity: 1, y: 0 },
    config: { stiffness: 120, damping: 14 },
  },
  scale: {
    from: { scale: 0.9 },
    to: { scale: 1 },
    config: { stiffness: 150, damping: 15 },
  },
  scaleIn: {
    from: { opacity: 0, scale: 0.8 },
    to: { opacity: 1, scale: 1 },
    config: { stiffness: 140, damping: 15 },
  },
  slideInLeft: {
    from: { x: -50, opacity: 0 },
    to: { x: 0, opacity: 1 },
    config: { stiffness: 130, damping: 20 },
  },
  slideInRight: {
    from: { x: 50, opacity: 0 },
    to: { x: 0, opacity: 1 },
    config: { stiffness: 130, damping: 20 },
  },
  pop: {
    from: { scale: 0.8, opacity: 0.5 },
    to: { scale: 1, opacity: 1 },
    config: { stiffness: 250, damping: 10 },
  },
  bounce: {
    from: { y: -10 },
    to: { y: 0 },
    config: { stiffness: 500, damping: 10 },
  },
};

// =============================================================================
// Style Utilities
// =============================================================================

/**
 * Generate style object from animated value
 */
const generateAnimatedStyle = (
  animatedValue: any,
  styleProps: Record<string, any> = {},
  transformStore: Map<string, string> = new Map()
): JSX.CSSProperties => {
  const style: JSX.CSSProperties = {};

  // Process animated value based on type
  if (animatedValue === null || animatedValue === undefined) {
    return style;
  }

  // Process object values (like {x: 10, y: 20, opacity: 0.5})
  if (typeof animatedValue === "object" && !Array.isArray(animatedValue)) {
    // Handle transforms specially
    Object.entries(animatedValue).forEach(([key, value]) => {
      switch (key) {
        // Transform properties - store in transform map rather than applying directly
        case "x":
          transformStore.set("translateX", `translateX(${value}px)`);
          break;
        case "y":
          transformStore.set("translateY", `translateY(${value}px)`);
          break;
        case "z":
          transformStore.set("translateZ", `translateZ(${value}px)`);
          break;
        case "scale":
          transformStore.set("scale", `scale(${value})`);
          break;
        case "scaleX":
          transformStore.set("scaleX", `scaleX(${value})`);
          break;
        case "scaleY":
          transformStore.set("scaleY", `scaleY(${value})`);
          break;
        case "rotate":
          transformStore.set("rotate", `rotate(${value}deg)`);
          break;
        case "rotateX":
          transformStore.set("rotateX", `rotateX(${value}deg)`);
          break;
        case "rotateY":
          transformStore.set("rotateY", `rotateY(${value}deg)`);
          break;
        case "skew":
          transformStore.set("skew", `skew(${value}deg)`);
          break;
        case "skewX":
          transformStore.set("skewX", `skewX(${value}deg)`);
          break;
        case "skewY":
          transformStore.set("skewY", `skewY(${value}deg)`);
          break;

        // Regular CSS properties
        default:
          style[key as keyof JSX.CSSProperties] = value as any;
      }
    });
  } else {
    // For primitive values, apply to the specified style property or default to opacity
    const styleKey = Object.keys(styleProps)[0] || "opacity";
    style[styleKey as keyof JSX.CSSProperties] = animatedValue as any;
  }

  return style;
};

/**
 * Compose transform properties in the correct order
 * Transform order matters in CSS: translate, scale, rotate, skew
 */
const composeTransforms = (transformStore: Map<string, string>): string => {
  if (transformStore.size === 0) return "";

  // Define the correct order for transforms
  // This order is important for predictable animations
  const transformOrder = [
    // Translate transforms
    "translateX",
    "translateY",
    "translateZ",
    "translate3d",
    "translate",
    // Scale transforms
    "scale",
    "scaleX",
    "scaleY",
    "scaleZ",
    "scale3d",
    // Rotate transforms
    "rotate",
    "rotateX",
    "rotateY",
    "rotateZ",
    "rotate3d",
    // Skew transforms
    "skew",
    "skewX",
    "skewY",
  ];

  // Sort transforms according to preferred order
  const sortedTransforms: string[] = [];

  // First add transforms in our preferred order
  transformOrder.forEach((key) => {
    const value = transformStore.get(key);
    if (value) {
      sortedTransforms.push(value);
    }
  });

  // Then add any remaining transforms not explicitly in our order
  transformStore.forEach((value, key) => {
    if (!transformOrder.includes(key)) {
      sortedTransforms.push(value);
    }
  });

  return sortedTransforms.join(" ");
};

/**
 * Apply hardware acceleration to styles if needed
 */
const applyHardwareAcceleration = (
  style: JSX.CSSProperties,
  hardware: "auto" | "always" | "never" = "auto"
): JSX.CSSProperties => {
  // Return unchanged if hardware acceleration is disabled
  if (hardware === "never") {
    return style;
  }

  // Force hardware acceleration
  if (hardware === "always" || style.transform) {
    // Create a new style object with both standard and vendor properties
    // Using the Record type with string keys to avoid TypeScript errors with vendor prefixes
    const acceleratedStyle: Record<string, any> = {
      ...style,
      // Force GPU acceleration - using kebab-case for CSS properties
      "will-change": "transform",
      "backface-visibility": "hidden",
      // Fix for Safari using vendor prefixes
      "-webkit-backface-visibility": "hidden",
      // Use string for perspective to avoid type issues
      perspective: "1000px",
      "-webkit-perspective": "1000px",
    };

    return acceleratedStyle as JSX.CSSProperties;
  }

  return style;
};

/**
 * Checks if a given property should be applied as a transform
 * Supports all CSS transform functions including shorthand notations
 */
const isTransformProperty = (prop: string): boolean => {
  return [
    // Shorthand translation (x, y, z map to translateX, translateY, translateZ)
    "x",
    "y",
    "z",
    // Translation transforms
    "translateX",
    "translateY",
    "translateZ",
    "translate",
    "translate3d",
    // Scale transforms
    "scale",
    "scaleX",
    "scaleY",
    "scaleZ",
    "scale3d",
    // Rotation transforms
    "rotate",
    "rotateX",
    "rotateY",
    "rotateZ",
    "rotate3d",
    // Skew transforms
    "skew",
    "skewX",
    "skewY",
    // Matrix transforms
    "matrix",
    "matrix3d",
    // Perspective
    "perspective",
  ].includes(prop);
};

// Enhanced helper to properly format transform values with correct CSS units
const formatTransformValue = (key: string, value: any): string => {
  if (typeof value !== "number" && typeof value !== "string") {
    return String(value);
  }

  // Handle special transform properties with appropriate units
  // Scale transforms - no units needed
  if (key.includes("scale")) {
    return String(value);
  }
  
  // Rotation transforms - use deg units if numeric
  if (key.includes("rotate")) {
    return typeof value === "number" ? `${value}deg` : String(value);
  }
  
  // Translation transforms (including shorthand x, y, z) - use px units if numeric
  if (key.includes("translate") || key === "x" || key === "y" || key === "z") {
    return typeof value === "number" ? `${value}px` : String(value);
  }
  
  // Skew transforms - use deg units if numeric
  if (key.includes("skew")) {
    return typeof value === "number" ? `${value}deg` : String(value);
  }
  
  // Perspective - use px units if numeric
  if (key === "perspective") {
    return typeof value === "number" ? `${value}px` : String(value);
  }
  
  // Matrix transforms - return as-is (they're already formatted)
  if (key.includes("matrix")) {
    return String(value);
  }

  // Default fallback for other transform types
  return typeof value === "number" ? `${value}px` : String(value);
};

// Apply styles directly to DOM element through ref, bypassing styled components
// This is necessary because we need direct control over styles for animations
const applyStyles = (styles: Record<string, any>, el: HTMLElement) => {
  if (!el) return;

  // Clear previous transforms first to prevent compounding
  // This is critical for animations that trigger multiple times (like hover)
  if (styles.transform || Object.keys(styles).some(isTransformProperty)) {
    el.style.transform = "";
  }

  // Apply each style property
  Object.entries(styles).forEach(([key, value]) => {
    if (isTransformProperty(key)) {
      // Handle transform properties specially
      const transformValue = formatTransformValue(key, value);

      // Get current transform and append new transform
      const currentTransform = el.style.transform || "";
      el.style.transform = `${currentTransform} ${key}(${transformValue})`.trim();

      if (IS_DEBUG_MODE) {
      }
    } else if (typeof value !== "undefined" && value !== null) {
      // Convert to string value with unit if needed
      const stringValue =
        typeof value === "number" && CSS_NUMERIC_PROPERTIES.has(key)
          ? `${value}${CSS_NUMERIC_PROPERTIES.get(key) || "px"}`
          : String(value);

      // Apply style directly to element
      el.style[key as any] = stringValue;

      if (IS_DEBUG_MODE) {
      }
    }
  });

  if (IS_DEBUG_MODE) {
  }
};

// Helper to get test ID from element - supports both data-test-id and data-testid
const getTestId = (element: HTMLElement): string | null => {
  return element.getAttribute("data-testid") || element.getAttribute("data-test-id");
};

// Store refs to all active animations for direct control
const animationRegistry = new Map<string, any>();

// Create a global registry for animation triggers - can be accessed across both systems
const triggerRegistry = new Map<
  string,
  {
    setActive: (active: boolean) => void;
    triggers: Set<AnimationTrigger>;
    animations: Map<string, any>; // Track animations by ID for each element
  }
>();

// Enhanced registerAnimation function that now connects the two systems
const registerAnimation = (id: string, animation: any, config: any) => {
  if (IS_DEBUG_MODE) {
  }

  // Extract the element test ID from the animation ID (format is typically elementId-anim-X)
  const elementTestId = id.split("-anim-")[0];
  if (IS_DEBUG_MODE) {
  }

  // For click animations, add extra debugging
  const isClickAnimation = config.when === "click" || (Array.isArray(config.when) && config.when.includes("click"));

  if (isClickAnimation && IS_DEBUG_MODE) {
  }

  // Store the animation so we can access it directly for clicks
  // CRITICAL FIX: Store with the correct elementId for lookup
  animationRegistry.set(id, {
    elementId: elementTestId, // FIXED: Use element test ID, not animation ID
    controls: animation,
    config,
  });
  if (IS_DEBUG_MODE) {
  }

  // CRITICAL: Add to trigger registry if it doesn't exist
  let triggerEntry = triggerRegistry.get(elementTestId);
  if (!triggerEntry) {
    if (IS_DEBUG_MODE) {
    }

    triggerEntry = {
      setActive: (active: boolean) => {
        if (IS_DEBUG_MODE) {
        }

        // Track which animations were affected by this trigger
        let affectedAnimations = 0;

        // Safety check for TypeScript
        if (!triggerEntry) return;

        // Directly control animations when setActive is called
        triggerEntry.animations.forEach((anim, animId) => {
          if (IS_DEBUG_MODE) {
          }
          const isRelevantAnimation =
            anim.config.when === "all" ||
            anim.config.when === "any" ||
            anim.config.when === Array.from(triggerEntry!.triggers)[0] ||
            (Array.isArray(anim.config.when) &&
              Array.from(triggerEntry!.triggers).some((t) => anim.config.when.includes(t)));

          if (IS_DEBUG_MODE) {
          }

          if (isRelevantAnimation) {
            affectedAnimations++;
            if (IS_DEBUG_MODE) {
            }

            try {
              if (active) {
                if (IS_DEBUG_MODE) {
                }

                // CRITICAL PHYSICS FIX: Properly apply spring physics by separating config from target
                let springConfig = {
                  stiffness: 170,
                  damping: 22,
                  precision: 0.001,
                };

                // Get config from animation if available
                if (anim.config.config) {
                  springConfig = { ...springConfig, ...anim.config.config };
                }

                // Extract direct spring properties if they exist
                if (anim.config.stiffness !== undefined) springConfig.stiffness = anim.config.stiffness;
                if (anim.config.damping !== undefined) springConfig.damping = anim.config.damping;
                if (anim.config.precision !== undefined) springConfig.precision = anim.config.precision;


                // Normalize spring parameters if needed
                const normalizedConfig = { ...springConfig };
                if (normalizedConfig.stiffness && normalizedConfig.stiffness > 1) {
                  normalizedConfig.stiffness = normalizedConfig.stiffness / 1000;
                }
                if (normalizedConfig.damping && normalizedConfig.damping > 1) {
                  normalizedConfig.damping = normalizedConfig.damping / 100;
                }


                anim.controls.start(anim.config.to, {
                  ...normalizedConfig,
                  hard: false, // Explicitly use spring physics
                });

              } else if (anim.config.reverseOnExit !== false) {

                // Same normalization for the reversed animation
                let springConfig = {
                  stiffness: 170,
                  damping: 22,
                  precision: 0.001,
                };

                // Get config from animation if available
                if (anim.config.config) {
                  springConfig = { ...springConfig, ...anim.config.config };
                }

                // Extract direct spring properties if they exist
                if (anim.config.stiffness !== undefined) springConfig.stiffness = anim.config.stiffness;
                if (anim.config.damping !== undefined) springConfig.damping = anim.config.damping;
                if (anim.config.precision !== undefined) springConfig.precision = anim.config.precision;

                // Normalize spring parameters if needed
                const normalizedConfig = { ...springConfig };
                if (normalizedConfig.stiffness && normalizedConfig.stiffness > 1) {
                  normalizedConfig.stiffness = normalizedConfig.stiffness / 1000;
                }
                if (normalizedConfig.damping && normalizedConfig.damping > 1) {
                  normalizedConfig.damping = normalizedConfig.damping / 100;
                }

                // Start animation with correctly normalized physics configuration
                anim.controls.start(anim.config.from, {
                  ...normalizedConfig,
                  hard: false, // Ensure spring physics are used
                });
              }
            } catch (error) {
              console.error(`[ANIM-ERROR] Failed to control animation:`, error);
            }
          }
        });

      },
      triggers: new Set<AnimationTrigger>(),
      animations: new Map(),
    };
    triggerRegistry.set(elementTestId, triggerEntry);
  }

  // Add this animation to the trigger's animation map
  const animationId = `${elementTestId}-${triggerEntry.animations.size}`;

  if (IS_DEBUG_MODE) {
  }

  triggerEntry.animations.set(animationId, {
    controls: animation,
    config,
  });

  // Register what triggers this element responds to
  if (config.when) {
    if (Array.isArray(config.when)) {
      config.when.forEach((trigger: AnimationTrigger) => {
        // Safety check for TypeScript
        if (!triggerEntry) return;

        // Ensure trigger is a valid AnimationTrigger type
        const validTrigger = trigger;
        triggerEntry.triggers.add(validTrigger);
        if (IS_DEBUG_MODE) {
        }
      });
    } else {
      // Safety check for TypeScript
      if (!triggerEntry) return;

      // Ensure trigger is a valid AnimationTrigger type
      const validTrigger = config.when;
      triggerEntry.triggers.add(validTrigger);
      if (IS_DEBUG_MODE) {
      }
    }
  }

  return {
    id,
    animate: animation,
  };
};

// Updated direct event handler setup function
const setupDirectEventHandlers = (el: HTMLElement) => {
  const testId = getTestId(el);
  if (!testId) {
    console.warn("[ANIM-WARN] Element without test ID (data-testid or data-test-id) cannot use direct event handlers");
    return () => {};
  }

  if (IS_DEBUG_MODE) {
  }

  // Spring physics preset for smoother animations
  const smoothSpringConfig = {
    tension: 150, // Increased from 50 to 150 (within 120-180 recommended range)
    friction: 15, // Increased from 8 to 15 (within 10-25 recommended range)
    precision: 0.0001, // Much higher precision for smoother animation
    duration: 500, // Longer duration for better visibility
    easing: (t: number) => t * (2 - t), // Ease-out quad for natural feel
  };

  // ARCHITECTURE FIX: Handle mouse events with unified trigger registry
  const handleDirectMouseEnter = (e: MouseEvent) => {
    const targetElement = e.currentTarget as HTMLElement;
    const targetTestId = getTestId(targetElement);

    if (IS_DEBUG_MODE) {
    }

    // Skip if we don't have a test ID
    if (!targetTestId) return;

    // Set a data attribute for debugging
    targetElement.setAttribute("data-hover-state", "true");

    // ARCHITECTURE FIX: Use the unified trigger registry
    const triggerEntry = triggerRegistry.get(targetTestId);
    if (triggerEntry && triggerEntry.triggers.has("hover")) {
      triggerEntry.setActive(true);

      // CRITICAL FIX: Also update the manual hover signals in animations
      // This connects the DOM event handlers to the SolidJS reactive signals
      animationRegistry.forEach((animation, id) => {
        if (
          animation.elementId === targetTestId &&
          animation.setHoverState &&
          typeof animation.setHoverState === "function"
        ) {
          animation.setHoverState(true);
        }
      });

      // Also find all animations for this element to directly control them
      animationRegistry.forEach((animation, id) => {
        if (
          animation.elementId === targetTestId &&
          animation.config &&
          (animation.config.when === "hover" ||
            (Array.isArray(animation.config.when) && animation.config.when.includes("hover")))
        ) {
          // CRITICAL PHYSICS FIX: Properly apply spring physics by separating config from target
          try {

            // Extract the proper spring config from the animation configuration
            // Use proper null checking and extract embedded config properly
            const configObj = animation.config || {};

            // Look for spring config in several possible locations
            let springConfig;

            // First try direct config property
            if (configObj.config && typeof configObj.config === "object") {
              springConfig = configObj.config;
            }
            // Then try individual spring properties at the root level
            else if (configObj.stiffness !== undefined || configObj.damping !== undefined) {
              springConfig = {
                stiffness: configObj.stiffness,
                damping: configObj.damping,
                precision: configObj.precision,
              };
            }
            // Fall back to preset if available
            else if (smoothSpringConfig) {
              springConfig = smoothSpringConfig;
            }
            // Final fallback to a hardcoded spring physics
            else {
              springConfig = {
                stiffness: 170,
                damping: 22,
                precision: 0.005,
                duration: 500,
              };
            }

            // Ensure we have a valid object
            springConfig = springConfig || {};

            // PARAMETER SCALE FIX: Normalize spring physics parameters to core engine scale
            const normalizedConfig = { ...springConfig };

            // Only normalize if values are in high-level API scale
            if (normalizedConfig.stiffness && normalizedConfig.stiffness > 1) {
              normalizedConfig.stiffness = normalizedConfig.stiffness / 1000;
            }

            if (normalizedConfig.damping && normalizedConfig.damping > 1) {
              normalizedConfig.damping = normalizedConfig.damping / 100;
            }

            // Start animation with correctly normalized physics configuration
            animation.controls.start(animation.config.to, {
              ...normalizedConfig,
              hard: false, // Explicitly disable immediate mode
              soft: false, // Ensure we're not in soft mode either
            });
          } catch (err) {
            console.error(`[ANIM-ERROR] Failed to start animation ${id}:`, err);
          }
        }
      });
    }
  };

  const handleDirectMouseLeave = (e: MouseEvent) => {
    const targetElement = e.currentTarget as HTMLElement;
    const targetTestId = getTestId(targetElement);


    // Skip if we don't have a test ID
    if (!targetTestId) return;

    // Set a data attribute for debugging
    targetElement.setAttribute("data-hover-state", "false");

    // ARCHITECTURE FIX: Use the unified trigger registry
    const triggerEntry = triggerRegistry.get(targetTestId);
    if (triggerEntry && triggerEntry.triggers.has("hover")) {
      triggerEntry.setActive(false);

      // CRITICAL FIX: Also update the manual hover signals in animations
      // This connects the DOM event handlers to the SolidJS reactive signals
      animationRegistry.forEach((animation, id) => {
        if (
          animation.elementId === targetTestId &&
          animation.setHoverState &&
          typeof animation.setHoverState === "function"
        ) {
          animation.setHoverState(false);
        }
      });

      // Also find all animations for this element to directly control them
      animationRegistry.forEach((animation, id) => {
        if (
          animation.elementId === targetTestId &&
          animation.config &&
          (animation.config.when === "hover" ||
            (Array.isArray(animation.config.when) && animation.config.when.includes("hover")))
        ) {
          // Only reverse if configuration allows it
          if (animation.config.reverseOnExit !== false) {
            try {

              // Extract the proper spring config from the animation configuration
              // Use proper null checking and extract embedded config properly
              const configObj = animation.config || {};

              // Look for spring config in several possible locations
              let springConfig;

              // First try direct config property
              if (configObj.config && typeof configObj.config === "object") {
                springConfig = configObj.config;
              }
              // Then try individual spring properties at root level
              else if (configObj.stiffness !== undefined || configObj.damping !== undefined) {
                springConfig = {
                  stiffness: configObj.stiffness,
                  damping: configObj.damping,
                  precision: configObj.precision,
                };
              }
              // Fall back to preset if available
              else if (smoothSpringConfig) {
                springConfig = smoothSpringConfig;
              }
              // Final fallback to a hardcoded spring physics
              else {
                springConfig = {
                  stiffness: 170,
                  damping: 22,
                  precision: 0.005,
                  duration: 500,
                };
              }

              // Ensure we have a valid object
              springConfig = springConfig || {};

              // PARAMETER SCALE FIX: Normalize spring physics parameters to core engine scale
              const normalizedConfig = { ...springConfig };

              // Only normalize if values are in high-level API scale
              if (normalizedConfig.stiffness && normalizedConfig.stiffness > 1) {
                normalizedConfig.stiffness = normalizedConfig.stiffness / 1000;
              }

              if (normalizedConfig.damping && normalizedConfig.damping > 1) {
                normalizedConfig.damping = normalizedConfig.damping / 100;
              }

              // Start animation with correctly normalized physics configuration
              animation.controls.start(animation.config.from, {
                ...normalizedConfig,
                hard: false, // Ensure spring physics are used
              });
            } catch (err) {
              console.error(`[ANIM-ERROR] Failed to reverse animation ${id}:`, err);
            }
          }
        }
      });
    }
  };

  const handleDirectClick = (e: MouseEvent) => {
    const targetElement = e.currentTarget as HTMLElement;
    const targetTestId = getTestId(targetElement);


    // CRITICAL FIX: Check if the targetElement has already been processed
    if (!targetTestId) {
      console.warn("[ANIM-WARN] Cannot handle click on element without test ID (data-testid or data-test-id)");
      return;
    }

    // Get current toggle state (default to false if not set)
    const currentState = clickedStates.get(targetTestId) || false;
    // Toggle the state
    const newState = !currentState;

    // Save the new state in our click state tracking map
    clickedStates.set(targetTestId, newState);

    // Set a data attribute for debugging
    targetElement.setAttribute("data-click-state", String(newState));

    // Check trigger registry status

    // ARCHITECTURE FIX: Use unified trigger registry for spring animations
    // just like hover animations do
    const triggerEntry = triggerRegistry.get(targetTestId);

    // Debug trigger registry entry
    if (triggerEntry) {
    }

    if (triggerEntry && triggerEntry.triggers.has("click")) {

      // This triggers the animation via triggerRegistry.setActive handler
      triggerEntry.setActive(newState);

      // HYBRID APPROACH: Also directly control animations for additional reliability
      // This mirrors how hover animations work

      let animationsFound = 0;

      animationRegistry.forEach((animation, id) => {

        if (animation.config && animation.config.when) {
        }

        if (
          animation.elementId === targetTestId &&
          animation.config &&
          (animation.config.when === "click" ||
            (Array.isArray(animation.config.when) && animation.config.when.includes("click")))
        ) {
          animationsFound++;

          try {

            // Extract spring configuration exactly like hover does
            const configObj = animation.config || {};

            // Look for spring config in several possible locations
            let springConfig;

            // First try direct config property
            if (configObj.config && typeof configObj.config === "object") {
              springConfig = configObj.config;
            }
            // Then try individual spring properties at root level
            else if (configObj.stiffness !== undefined || configObj.damping !== undefined) {
              springConfig = {
                stiffness: configObj.stiffness,
                damping: configObj.damping,
                precision: configObj.precision,
              };
            }
            // Fall back to a smooth preset
            else {
              springConfig = {
                stiffness: 170,
                damping: 22,
                precision: 0.001,
              };
            }

            // Normalize spring parameters exactly like hover does
            const normalizedConfig = { ...springConfig };

            // Only normalize if values are in high-level API scale
            if (normalizedConfig.stiffness && normalizedConfig.stiffness > 1) {
              normalizedConfig.stiffness = normalizedConfig.stiffness / 1000;
            }

            if (normalizedConfig.damping && normalizedConfig.damping > 1) {
              normalizedConfig.damping = normalizedConfig.damping / 100;
            }

            // CRITICAL FIX: Transform color values before animation
            const processColors = (value: any): any => {
              // Handle null/undefined
              if (value == null) return value;

              // Case 1: Direct hex color strings
              if (typeof value === "string" && value.startsWith("#")) {
                // Create a proper Color object that the spring system expects
                // This is compatible with spring's interpolateColor function
                const colorObj = { value: value, format: "hex" as "hex" | "rgb" | "rgba" | "hsl" | "hsla" };
                return colorObj;
              }

              // Case 2: Objects with color properties
              if (typeof value === "object" && !Array.isArray(value) && value !== null) {
                // Create a shallow copy to modify
                const result = { ...value };
                let modified = false;

                // Process each property
                for (const key in result) {
                  // Color property (background or color in name)
                  if (
                    (key.toLowerCase().includes("color") || key.toLowerCase().includes("background")) &&
                    typeof result[key] === "string" &&
                    result[key].startsWith("#")
                  ) {
                    // Convert to proper Color object
                    result[key] = {
                      value: result[key],
                      format: "hex" as "hex" | "rgb" | "rgba" | "hsl" | "hsla",
                    };
                    modified = true;
                  }
                  // Recursively process nested objects
                  else if (typeof result[key] === "object" && result[key] !== null) {
                    const processed = processColors(result[key]);
                    if (processed !== result[key]) {
                      result[key] = processed;
                      modified = true;
                    }
                  }
                }

                return modified ? result : value;
              }

              // Other types returned as-is
              return value;
            };

            // Process both from and to values with deep color conversion
            const fromValueProcessed = processColors(animation.config.from);
            const toValueProcessed = processColors(animation.config.to);

            // Show detailed logs about the transformation

            // Determine which animation target to use based on click state
            const target = newState ? toValueProcessed : fromValueProcessed;

            // Start animation with correctly normalized physics configuration
            animation.controls.start(target, {
              ...normalizedConfig,
              hard: false, // Ensure spring physics are used (not immediate)
            });

          } catch (err) {
            console.error(`[ANIM-ERROR] Failed to apply click animation:`, err);
          }
        }
      });

    }

    // CRITICAL FIX: Setup document click listener for click outside detection
    // Only add if we're toggling to active state (newState is true)
    if (newState) {
      // Remove any existing click-outside handler to prevent duplicates
      document.removeEventListener("click", (el as any)._clickOutsideHandler);

      // Create and store the click outside handler function
      (el as any)._clickOutsideHandler = (outsideEvent: MouseEvent) => {
        // Skip if original element is no longer in DOM
        if (!document.body.contains(targetElement)) {
          document.removeEventListener("click", (el as any)._clickOutsideHandler);
          return;
        }

        // Check if click is outside our element
        if (targetElement !== outsideEvent.target && !targetElement.contains(outsideEvent.target as Node)) {

          // Deactivate on click outside
          clickedStates.set(targetTestId, false);
          targetElement.setAttribute("data-click-state", "false");

          // Update trigger registry - this triggers spring animations
          if (targetTestId) {
            // Add null check
            const triggerEntry = triggerRegistry.get(targetTestId);
            if (triggerEntry && triggerEntry.triggers.has("click")) {
              triggerEntry.setActive(false);

              // HYBRID APPROACH: Also directly control animations for additional reliability
              // This mirrors how we handle normal clicks above
              animationRegistry.forEach((animation, id) => {
                if (
                  animation.elementId === targetTestId &&
                  animation.config &&
                  (animation.config.when === "click" ||
                    (Array.isArray(animation.config.when) && animation.config.when.includes("click")))
                ) {
                  // Only reverse if configuration allows it
                  if (animation.config.reverseOnExit !== false) {
                    try {
                      // Extract spring configuration exactly like above
                      const configObj = animation.config || {};

                      // Look for spring config in several possible locations
                      let springConfig;

                      // First try direct config property
                      if (configObj.config && typeof configObj.config === "object") {
                        springConfig = configObj.config;
                      } else if (configObj.stiffness !== undefined || configObj.damping !== undefined) {
                        springConfig = {
                          stiffness: configObj.stiffness,
                          damping: configObj.damping,
                          precision: configObj.precision,
                        };
                      } else {
                        springConfig = {
                          stiffness: 170,
                          damping: 22,
                          precision: 0.001,
                        };
                      }

                      // Normalize spring parameters
                      const normalizedConfig = { ...springConfig };
                      if (normalizedConfig.stiffness && normalizedConfig.stiffness > 1) {
                        normalizedConfig.stiffness = normalizedConfig.stiffness / 1000;
                      }
                      if (normalizedConfig.damping && normalizedConfig.damping > 1) {
                        normalizedConfig.damping = normalizedConfig.damping / 100;
                      }

                      // CRITICAL FIX: Transform color values before animation
                      const fromValueProcessed = processColors(animation.config.from);

                      // Start animation to "from" state with spring physics
                      animation.controls.start(fromValueProcessed, {
                        ...normalizedConfig,
                        hard: false, // Ensure spring physics are used
                      });

                    } catch (err) {
                      console.error(`[ANIM-ERROR] Failed to reverse animation:`, err);
                    }
                  }
                }
              });
            }
          }

          // Clean up this handler after we've handled the outside click
          document.removeEventListener("click", (el as any)._clickOutsideHandler);
        }
      };

      // Add the click outside handler with a slight delay to avoid immediate trigger
      setTimeout(() => {
        document.addEventListener("click", (el as any)._clickOutsideHandler);
      }, 10);
    }

  };

  // CRITICAL FIX: Check if this element already has event handlers to prevent duplication
  const elementId = getTestId(el) || "";
  if (elementsWithEventHandlers.has(elementId)) {
    // Return empty cleanup function since we didn't add any new handlers
    return () => {};
  }

  // Add direct event handlers
  el.addEventListener("mouseenter", handleDirectMouseEnter);
  el.addEventListener("mouseleave", handleDirectMouseLeave);
  el.addEventListener("click", handleDirectClick);

  // Mark this element as having event handlers
  if (elementId) {
    elementsWithEventHandlers.add(elementId);
  }

  // Store handlers for cleanup
  return () => {
    el.removeEventListener("mouseenter", handleDirectMouseEnter);
    el.removeEventListener("mouseleave", handleDirectMouseLeave);
    el.removeEventListener("click", handleDirectClick);

    // Remove from tracked elements on cleanup
    if (elementId) {
      elementsWithEventHandlers.delete(elementId);
    }
  };
};

// Maintain a map of clicked states for elements with proper lifecycle tracking
const clickedStates = new Map<string, boolean>();

// Track elements that already have event handlers to avoid duplication
const elementsWithEventHandlers = new Set<string>();

// Helper function to convert hex color to RGB object
const hexToRgb = (hex: string) => {
  // Skip invalid values
  if (!hex || typeof hex !== "string") return { r: 0, g: 0, b: 0 };

  // Remove the hash if it exists
  hex = hex.replace(/^#/, "");

  // Parse the hex values
  let r = 0,
    g = 0,
    b = 0;
  try {
    if (hex.length === 3) {
      // Short notation #RGB
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      // Full notation #RRGGBB
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }

    // Guard against NaN values
    r = isNaN(r) ? 0 : r;
    g = isNaN(g) ? 0 : g;
    b = isNaN(b) ? 0 : b;
  } catch (e) {
    console.error("[COLOR-ERROR] Failed to parse hex color:", hex, e);
  }

  return { r, g, b };
};

// Helper function to check if a property needs px units
const isDimensionProperty = (key: string): boolean => {
  const dimensionProps = [
    "width",
    "height",
    "top",
    "left",
    "right",
    "bottom",
    "margin",
    "marginTop",
    "marginRight",
    "marginBottom",
    "marginLeft",
    "padding",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "fontSize",
    "lineHeight",
    "borderRadius",
    "borderWidth",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "minWidth",
    "maxWidth",
    "minHeight",
    "maxHeight",
    "outlineWidth",
    "outlineOffset",
    "letterSpacing",
    "wordSpacing",
    "gap",
    "columnGap",
    "rowGap",
  ];

  return dimensionProps.includes(key) || key.endsWith("Width") || key.endsWith("Height") || key.endsWith("Size");
};

// Helper function to convert RGB object to string
const rgbToString = (rgb: { r: number | unknown; g: number | unknown; b: number | unknown; a?: number | unknown }) => {
  // Make sure to convert to numbers in case the values are not already numbers
  const r = Number(rgb.r);
  const g = Number(rgb.g);
  const b = Number(rgb.b);
  const a = rgb.a !== undefined ? Number(rgb.a) : 1;

  // Check if this is valid
  if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) {
    console.error("[COLOR-ERROR] Invalid RGB values:", rgb);
    return "rgba(0,0,0,1)"; // Fallback to black
  }

  // Return rgba string
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

// Helper function to check if a property is a color property
const isColorProperty = (prop: string): boolean => {
  const colorProps = [
    "color",
    "background",
    "backgroundImage",
    "backgroundColor",
    "border",
    "outline",
    "fill",
    "stroke",
  ];
  return colorProps.some((colorProp) => prop.toLowerCase().includes(colorProp));
};

// Helper function to transform hex colors to RGB objects for spring animation
// This is used across multiple handlers to ensure color animations work properly
const processColors = (value: any): any => {
  try {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return value;
    }

    // Case 1: Direct color string (hex, rgb, rgba, hsl, hsla, named colors)
    if (typeof value === "string") {
      // Handle hex colors
      if (value.startsWith("#")) {
        return { value, format: "hex" as ColorFormat };
      }

      // Handle RGB/RGBA colors
      if (value.match(/rgba?\(/)) {
        return {
          value,
          format: value.startsWith("rgba") ? ("rgba" as ColorFormat) : ("rgb" as ColorFormat),
        };
      }

      // Handle HSL/HSLA colors
      if (value.match(/hsla?\(/)) {
        return {
          value,
          format: value.startsWith("hsla") ? ("hsla" as ColorFormat) : ("hsl" as ColorFormat),
        };
      }

      // Handle gradient strings
      if (
        typeof value === "string" &&
        (value.includes("gradient(") || value.match(/(?:linear|radial|conic)-gradient\(/))
      ) {
        try {
          const gradientObj = parseGradientString(value);
          return gradientObj;
        } catch (err) {
          console.error(`[PROCESS-COLORS] Failed to parse gradient string:`, err);
          // Return the original string if parsing fails
          return { value, format: "gradient" as ColorFormat };
        }
      }

      // Handle named colors like 'red', 'blue', etc.
      if (CSS.supports("color", value)) {
        return { value, format: "named" as ColorFormat };
      }

      // Not a color string, return as is
      return value;
    }

    // Case 2: Color object with value and format properties - already processed
    if (typeof value === "object" && value !== null && "value" in value && "format" in value) {
      return value;
    }

    // Case 3: Gradient object - already processed
    if (typeof value === "object" && value !== null && "type" in value && "stops" in value) {
      return value;
    }

    // Case 4: Object with potentially nested color properties
    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        return value.map((v) => processColors(v));
      }

      // Process each property of the object
      const result: Record<string, any> = {};
      for (const key in value) {
        result[key] = processColors(value[key]);
      }
      return result;
    }

    // Default case: not a color or color object, return as is
    return value;
  } catch (error) {
    console.error(`[PROCESS-COLORS-ERROR] Error processing colors:`, error);
    // On error, return the original value to avoid breaking animations
    return value;
  }
};

/**
 * Parse a CSS gradient string into a Gradient object structure
 * Supports linear, radial, and conic gradients with varying numbers of color stops
 */
const parseGradientString = (value: string): Gradient => {
  // Determine gradient type
  let type: "linear" | "radial" | "conic" = "linear";
  if (value.startsWith("radial-")) {
    type = "radial";
  } else if (value.startsWith("conic-")) {
    type = "conic";
  }


  // Extract gradient parameters
  const gradient: Gradient = {
    type,
    stops: [],
  };

  // Extract angle for linear gradients (e.g., 45deg)
  if (type === "linear") {
    const angleMatch = value.match(/(\d+)deg/);
    if (angleMatch) {
      gradient.angle = parseInt(angleMatch[1], 10);
    }
  }

  // Extract shape and size for radial gradients
  if (type === "radial") {
    if (value.includes("circle")) {
      gradient.shape = "circle";
    } else {
      gradient.shape = "ellipse";
    }

    // Look for size keywords like closest-side, farthest-corner, etc.
    const sizeKeywords = ["closest-side", "closest-corner", "farthest-side", "farthest-corner"];
    for (const keyword of sizeKeywords) {
      if (value.includes(keyword)) {
        gradient.size = keyword;
        break;
      }
    }
  }

  // Extract color stops with regex
  // This regex matches color values followed by optional position
  const stopsRegex = /((#[0-9a-fA-F]{3,8})|(rgba?\([^)]+\))|(hsla?\([^)]+\))|(\w+))\s*(\d*\.?\d+%)?/g;
  let match;

  const matches: { color: string; position: string | null }[] = [];
  while ((match = stopsRegex.exec(value)) !== null) {
    const colorValue = match[1];
    const positionValue = match[6] || null;

    // Only process if we have a valid color
    if (colorValue) {
      matches.push({
        color: colorValue,
        position: positionValue,
      });
    }
  }

  // Now process all the color stops
  gradient.stops = matches.map((item, index, array) => {
    const color = processColors(item.color) as Color;
    let position: number;

    if (item.position) {
      // Parse percentage value
      position = parseFloat(item.position) / 100;
    } else {
      // If no position specified, distribute evenly
      position = array.length === 1 ? 0.5 : index / (array.length - 1);
    }

    return { color, position };
  });

  // Ensure we have at least 2 stops for valid gradients
  if (gradient.stops.length < 2) {
    console.warn("[PARSE-GRADIENT] Warning: Gradient has fewer than 2 stops, which may cause issues");
    // Add a duplicate stop if we only have one
    if (gradient.stops.length === 1) {
      gradient.stops.push({ ...gradient.stops[0], position: 1 });
      gradient.stops[0].position = 0;
    }
  }

  return gradient;
};

// Helper function to apply color values from spring animations to DOM
const applyColorValue = (element: HTMLElement, key: string, value: any): boolean => {
  // Handle Color objects (format: hex, rgb, rgba, hsl, hsla, named)
  if (value && typeof value === "object" && "format" in value && "value" in value) {
    element.style[key as any] = value.value;
    return true;
  }

  // Handle Gradient objects (type: linear, radial, conic)
  if (value && typeof value === "object" && "type" in value && "stops" in value) {

    // Convert Gradient object back to CSS string
    let gradientString = "";

    // Format based on gradient type
    if (value.type === "linear") {
      gradientString = `linear-gradient(${value.angle || 0}deg, `;
    } else if (value.type === "radial") {
      gradientString = `radial-gradient(${value.shape || "circle"} `;
      if (value.size) {
        gradientString += `${value.size} `;
      }
    } else if (value.type === "conic") {
      gradientString = "conic-gradient(";
    }

    // Add color stops
    const stopStrings = value.stops.map((stop: GradientStop) => {
      const colorValue = stop.color.value;
      const position = `${Math.round(stop.position * 100)}%`;
      return `${colorValue} ${position}`;
    });

    gradientString += stopStrings.join(", ") + ")";

    // Apply the gradient string to the element
    element.style[key as any] = gradientString;
    return true;
  }

  return false;
};

// Update DOM style application to handle RGB color objects
const updateDOMStyle = (element: HTMLElement, key: string, value: any) => {

  try {
    // Special case for transform properties
    if (isTransformProperty(key)) {

      // Get current transforms
      const transform = element.style.transform || "";
      const transformRegex = new RegExp(`${key}\\([^)]*\\)`, "g");

      // Format the transform value
      const formattedValue = formatTransformValue(key, value);

      // Apply the transform
      if (transform.match(transformRegex)) {
        // Replace existing transform
        element.style.transform = transform.replace(transformRegex, formattedValue);
      } else {
        // Append new transform
        element.style.transform = transform ? `${transform} ${formattedValue}` : formattedValue;
      }

      return;
    }

    // Handle color values
    if (applyColorValue(element, key, value)) {
      return;
    }

    // Non-color, non-transform property
    // Add units for numeric properties that need them
    if (typeof value === "number" && CSS_NUMERIC_PROPERTIES.has(key)) {
      const unit = CSS_NUMERIC_PROPERTIES.get(key) || "px";
      element.style[key as any] = unit ? `${value}${unit}` : `${value}`;
      return;
    }

    // Default case - direct application
    element.style[key as any] = value;
  } catch (error) {
    console.error(`[UPDATE-DOM-ERROR] Error updating DOM style:`, error);
  }
};

// =============================================================================
// Animated Component Factory
// =============================================================================

/**
 * Creates a SolidJS component with animation capabilities
 *
 * @param tag HTML tag or component to animate
 * @returns Animated component
 */
export function animated<T extends keyof JSX.IntrinsicElements | Component<any>>(tag: T) {
  // Get styled component for this tag
  const StyledComponent =
    typeof tag === "string"
      ? styled(tag)`
          position: relative;
        `
      : (tag as any);

  type Props = ComponentProps<typeof StyledComponent> & AnimatedProps;

  /**
   * The animated component
   */
  return (props: Props) => {
    // Create a reference to the element
    const [elementRef, setElementRef] = createSignal<HTMLElement | null>(null);

    // Split animation props from regular props
    const [animationProps, otherProps] = splitProps(props, [
      "animate",
      "reducedMotionTransition",
      "hardware",
      "ref",
      "style",
    ]);

    // Store animation results
    const animationResults: AnimationResult<any>[] = [];

    // Process animation configurations
    const animateConfigs = createMemo(() => {
      const { animate } = animationProps;
      if (!animate) return [];

      // Handle array or single config
      return Array.isArray(animate) ? animate : [animate];
    });

    // Generate styles from animations
    const animatedStyles = createMemo(() => {
      // Start with base styles
      let mergedStyle: JSX.CSSProperties = animationProps.style ? { ...animationProps.style } : {};

      // Store for transform properties to ensure correct ordering
      const transformStore = new Map<string, string>();

      // Process each animation result
      animationResults.forEach((result) => {
        // Ensure we have a valid animation result with required methods
        if (!result || typeof result.value !== "function") {
          return; // Skip invalid results
        }

        const animValue = result.value();

        // Generate animated styles with transform tracking
        const animStyle = generateAnimatedStyle(animValue, {}, transformStore);

        // Then merge with the accumulated styles
        mergedStyle = {
          ...mergedStyle,
          ...animStyle,
        };

        // Force active state detection for debugging
        if (typeof result.isActive === "function") {
          const isActive = result.isActive();
          if (isActive && result.controls && typeof result.controls.start === "function") {
            // This will ensure animations actually run when trigger is active
            result.controls.start();
          }
        }
      });

      // Compose transforms in correct order and add to style
      const composedTransform = composeTransforms(transformStore);
      if (composedTransform) {
        mergedStyle.transform = composedTransform;
      }

      // Apply hardware acceleration if needed
      return applyHardwareAcceleration(mergedStyle, animationProps.hardware);
    });

    // Respect reduced motion preferences
    const prefersReducedMotion = createMemo(() => {
      return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    });
    // Process animation configs and create animations
    createEffect(() => {
      // Clean up previous animations if element or configs change
      batch(() => {
        // Clear previous animation results
        animationResults.splice(0, animationResults.length);

        // Get current animation configurations - this makes the effect reactive to config changes
        const currentConfigs = Array.isArray(animationProps.animate)
          ? animationProps.animate
          : animationProps.animate
            ? [animationProps.animate]
            : [];

        // Process each animation configuration
        currentConfigs.forEach((config, index) => {
          // Get element reference
          const element = elementRef();
          if (!element) {
            return;
          }

          // Process animation configuration with reactive evaluation
          let finalConfig: AnimateConfig;

          // Handle variant-based animations
          if (config.variant && variants[config.variant]) {
            finalConfig = { ...variants[config.variant], ...config };
          } else {
            finalConfig = config;
          }

          // CRITICAL FIX: Evaluate from/to values reactively within the createEffect
          // This ensures that changes to reactive signals trigger this effect
          const evaluatedFrom = finalConfig.from;
          const evaluatedTo = finalConfig.to;

          if (IS_DEBUG_MODE) {
          }

          // Validate animation configuration
          if (!evaluatedFrom || !evaluatedTo) {
            console.error("[ANIM-ERROR] Animation missing from/to values:", finalConfig);
            return;
          }

          // Generate unique animation ID using test-id if available
          const testId = getTestId(element) || "unknown";
          const animId = `${testId}-anim-${index}`;

          if (IS_DEBUG_MODE) {
          }

          // Extract animation properties with evaluated values
          const {
            when: triggerType,
            inViewOptions,
            config: springConfig,
            reverseOnExit = false,
            onStart,
            onComplete,
            onInterrupt,
            ...options
          } = finalConfig;

          // If reduced motion is preferred, use CSS transitions instead if specified
          if (prefersReducedMotion() && animationProps.reducedMotionTransition) {
            // Apply immediate styles without animation
            return;
          }

          // CRITICAL ROOT CAUSE FIX: Manual trigger signals for ALL animation types
          // Previously we only had this for hover, but we need it for all triggers
          const [isManualHovered, setManualHovered] = createSignal(false);
          const [isManualFocused, setManualFocused] = createSignal(false);
          const [isManualClicked, setManualClicked] = createSignal(false);
          const [isManualMounted, setManualMounted] = createSignal(false);
          const [isManualInView, setManualInView] = createSignal(false);

          // Set up trigger based on the animation type
          let trigger = () => true; // Default to always active

          // CRITICAL FIX: Setup direct element monitoring for ALL animation trigger types
          // This ensures ALL animations have working triggers, not just hover
          if (triggerType === "focus" || (Array.isArray(triggerType) && triggerType.includes("focus"))) {
            // Focus/blur event monitoring
            element.addEventListener("focus", () => {
              setManualFocused(true);
              // Direct style application for immediate feedback
              if (evaluatedTo) {
                applyStyles(evaluatedTo, element);
              }
            });

            element.addEventListener("blur", () => {
              setManualFocused(false);
              // Reverse animation on blur if needed
              if (reverseOnExit && evaluatedFrom) {
                applyStyles(evaluatedFrom, element);
              }
            });
          }

          // Setup mount animation trigger
          if (triggerType === "mount" || (Array.isArray(triggerType) && triggerType.includes("mount"))) {
            // Immediately mark as mounted to trigger animation
            setManualMounted(true);

            // Direct style application for immediate feedback
            if (evaluatedTo) {
              // Small delay to ensure the element is fully rendered
              setTimeout(() => {
                applyStyles(evaluatedTo, element);
              }, 10);
            }
          }

          // Setup inView animation trigger
          if (triggerType === "inView" || (Array.isArray(triggerType) && triggerType.includes("inView"))) {

            // Create an IntersectionObserver to monitor visibility
            const observer = new IntersectionObserver(
              (entries) => {
                const [entry] = entries;
                const isVisible = entry.isIntersecting;

                setManualInView(isVisible);

                // Direct style application for immediate feedback
                if (isVisible && evaluatedTo) {
                  applyStyles(evaluatedTo, element);
                } else if (!isVisible && reverseOnExit && evaluatedFrom) {
                  applyStyles(evaluatedFrom, element);
                }

                // If "once" option is set, disconnect after becoming visible
                if (isVisible && inViewOptions?.once) {
                  observer.disconnect();
                }
              },
              inViewOptions || { threshold: 0.1 }
            );

            // Start observing
            observer.observe(element);

            // Clean up observer on unmount
            onCleanup(() => {
              observer.disconnect();
            });
          }

          // Set up the main trigger function based on trigger type
          if (triggerType) {
            // Handle multiple triggers - active if ANY trigger is active
            if (Array.isArray(triggerType)) {
              const triggers = triggerType.map((type: AnimationTrigger) => {
                // CRITICAL FIX: Use our manual signals for ALL trigger types
                if (type === "hover") return isManualHovered;
                if (type === "focus") return isManualFocused;
                if (type === "click") return isManualClicked;
                if (type === "mount") return isManualMounted;
                if (type === "inView") return isManualInView;
                if (type === "always") return () => true; // Always active

                // Fallback to the useTrigger system
                const triggerFn = useTrigger(() => elementRef(), type, { inViewOptions: inViewOptions || {} });
                return triggerFn;
              });

              // Create a reactive memo that combines the trigger results
              trigger = createMemo(() => {
                // Check if any trigger is active
                return triggers.some((triggerFn) => {
                  if (typeof triggerFn === "function") {
                    return triggerFn();
                  }
                  return false;
                });
              });
            } else {
              // Single trigger - use the appropriate manual signal
              if (triggerType === "hover") {
                trigger = isManualHovered;
              } else if (triggerType === "focus") {
                trigger = isManualFocused;
              } else if (triggerType === "click") {
                trigger = isManualClicked;
              } else if (triggerType === "mount") {
                trigger = isManualMounted;
              } else if (triggerType === "inView") {
                trigger = isManualInView;
              } else if (triggerType === "always") {
                // CRITICAL FIX: Handle "always" trigger that should always be active
                trigger = () => true;
              } else {
                // Fallback to the normal useTrigger system
                const rawTrigger = useTrigger(() => elementRef(), triggerType, { inViewOptions: inViewOptions || {} });
                trigger = createMemo(() => {
                  if (typeof rawTrigger === "function") {
                    try {
                      return rawTrigger();
                    } catch (error) {
                      console.error(`[ANIM-ERROR] Trigger function error:`, error);
                      return false;
                    }
                  }
                  return false;
                });
              }
            }
          }

          // Completely rewrite the direct click handler to properly handle animations
          const handleDirectClick = (e: MouseEvent) => {
            const targetElement = e.currentTarget as HTMLElement;
            const targetTestId = getTestId(targetElement);


            // CRITICAL FIX: Check if the targetElement has already been processed
            if (!targetTestId) {
              console.warn("[ANIM-WARN] Cannot handle click on element without test ID (data-testid or data-test-id)");
              return;
            }

            // Get current toggle state (default to false if not set)
            const currentState = clickedStates.get(targetTestId) || false;
            // Toggle the state
            const newState = !currentState;

            // Save the new state in our click state tracking map
            clickedStates.set(targetTestId, newState);

            // Set a data attribute for debugging
            targetElement.setAttribute("data-click-state", String(newState));

            // SPACEX SOLUTION: Direct, immediate action for click animations
            // This is what SpaceX engineers would do - don't rely on complex systems when a direct approach works
            let animationFound = false;
            let targetStyle: any = null;

            // First, let's determine what style changes we need to make
            animationRegistry.forEach((animation, id) => {
              if (
                animation.elementId === targetTestId &&
                animation.config &&
                (animation.config.when === "click" ||
                  (Array.isArray(animation.config.when) && animation.config.when.includes("click")))
              ) {
                animationFound = true;

                // Determine which style values to apply based on current state
                targetStyle = newState ? animation.config.to : animation.config.from;

              }
            });

            // SPACEX APPROACH: Apply styles directly to DOM for immediate feedback
            if (targetStyle) {
              applyStyles(targetStyle, targetElement);
            }

            // ARCHITECTURE FIX: Use the unified trigger registry for animation system integration
            const triggerEntry = triggerRegistry.get(targetTestId);
            if (triggerEntry && triggerEntry.triggers.has("click")) {

              // Set click state in trigger registry (for system consistency)
              triggerEntry.setActive(newState);

              // CRITICAL FIX: Also update the manual click signals in animations
              // This connects the DOM event handlers to the SolidJS reactive signals
              animationRegistry.forEach((animation, id) => {
                if (
                  animation.elementId === targetTestId &&
                  animation.setClickState &&
                  typeof animation.setClickState === "function"
                ) {
                  animation.setClickState(newState);
                }
              });

              if (!animationFound) {
                console.warn(`[ANIM-WARN] No click animations found for element ${targetTestId}`);
              }
            } else {
              console.warn(`[ANIM-WARN] No trigger entry for click on element ${targetTestId}`);
            }

            // Prevent event from bubbling to avoid double-triggering
            e.stopPropagation();
          };

          // Store previous values for detecting changes - these need to be outside the useAnimation call
          let previousFrom = evaluatedFrom;
          let previousTo = evaluatedTo;
          let animationCreated = false;

          // Create animation using the useAnimation hook to leverage spring physics
          const result = useAnimation({
            when: trigger,
            reverseOnExit,
            // Forward spring config properly
            ...(springConfig ? { ...springConfig } : {}),
            ...(onStart ? { onStart } : {}),
            ...(onComplete ? { onComplete } : {}),
            // CRITICAL FIX: Add onInterrupt callback for reactive value changes
            onInterrupt: () => {
              onInterrupt?.();
            },
            ...options,
            // Override with evaluated values last to prevent conflicts
            from: evaluatedFrom,
            to: evaluatedTo,
          });

          // CRITICAL FIX: Track if this is a reactive change vs initial creation
          if (animationCreated) {
            // This is a reactive re-run, check if values actually changed
            const fromChanged = JSON.stringify(evaluatedFrom) !== JSON.stringify(previousFrom);
            const toChanged = JSON.stringify(evaluatedTo) !== JSON.stringify(previousTo);

            if (fromChanged || toChanged) {
              onInterrupt?.();

              // Restart animation with new values
              result.controls.start(evaluatedTo);
            }
          }

          animationCreated = true;
          previousFrom = evaluatedFrom;
          previousTo = evaluatedTo;

          // Store in animation results array
          animationResults.push(result);

          // Register animation with the animation registry for direct access and debugging
          registerAnimation(
            animId,
            {
              ...result,
              elementId: testId,
              // CRITICAL FIX: Expose all manual state setters to direct DOM event handlers
              ...(triggerType === "hover" || (Array.isArray(triggerType) && triggerType.includes("hover"))
                ? { setHoverState: setManualHovered }
                : {}),
              ...(triggerType === "focus" || (Array.isArray(triggerType) && triggerType.includes("focus"))
                ? { setFocusState: setManualFocused }
                : {}),
              ...(triggerType === "click" || (Array.isArray(triggerType) && triggerType.includes("click"))
                ? { setClickState: setManualClicked }
                : {}),
              ...(triggerType === "mount" || (Array.isArray(triggerType) && triggerType.includes("mount"))
                ? { setMountState: setManualMounted }
                : {}),
              ...(triggerType === "inView" || (Array.isArray(triggerType) && triggerType.includes("inView"))
                ? { setInViewState: setManualInView }
                : {}),
            },
            finalConfig
          );

          // Track animation value changes and apply to styles via SolidJS reactivity
          createEffect(() => {
            // Get the element directly from elementRef signal to ensure we always have the latest reference
            const animElement = elementRef();
            if (!animElement) {
              return;
            }

            // Get the current animation value from the result
            const currentValue = result.value();
            const isActive = result.isActive();
            const state = result.state();
            
            // CRITICAL: Log what we're trying to apply for debugging
            if (IS_DEBUG_MODE) {
              console.log('[DOM-APPLY]', {
                testId,
                isActive,
                state,
                currentValue,
                hasTransform: Object.keys(currentValue).some(isTransformProperty)
              });
            }

            // CRITICAL FIX: Transform handling
            // We must separate transform collection and application to avoid compounding issues
            const transformsToApply: string[] = [];

            // Step 1: Clear previous transform to prevent compounding
            const previousTransform = animElement.style.transform;
            animElement.style.transform = "";

            // Step 2: Collect all transform values
            Object.entries(currentValue).forEach(([key, value]) => {
              // Skip config property which is not a CSS property
              if (key === "config") {
                return;
              }

              if (isTransformProperty(key)) {
                // Format transform value with proper units
                const transformValue = formatTransformValue(key, value);

                // Convert shorthand property names to full CSS transform function names
                let transformFunctionName = key;
                
                // Translation transforms
                if (key === "x") transformFunctionName = "translateX";
                else if (key === "y") transformFunctionName = "translateY";
                else if (key === "z") transformFunctionName = "translateZ";
                
                // Already correct CSS function names - no mapping needed:
                // - translateX, translateY, translateZ, translate, translate3d
                // - scale, scaleX, scaleY, scaleZ, scale3d
                // - rotate, rotateX, rotateY, rotateZ, rotate3d
                // - skew, skewX, skewY
                // - matrix, matrix3d, perspective

                // Collect transforms in array with correct function names
                transformsToApply.push(`${transformFunctionName}(${transformValue})`);
              
              } else {
                // For non-transform properties, apply directly
                try {
                  // Check if this is a color object that needs special handling
                  if (key.toLowerCase().includes("color") || key.toLowerCase().includes("background")) {
                    if (value && typeof value === "object") {
                      // Case 1: Color object with value and format properties (from spring system)
                      if ("value" in value && "format" in value) {
                        // @ts-ignore - Dynamic style property assignment
                        animElement.style[key] = value.value;
                      }
                      // Case 2: RGB object with r,g,b properties
                      else if ("r" in value && "g" in value && "b" in value) {
                        const colorString = rgbToString(value);
                        // @ts-ignore - Dynamic style property assignment
                        animElement.style[key] = colorString;
                      } else {
                        // Fallback to direct assignment as before
                        // @ts-ignore - Dynamic style property assignment
                        animElement.style[key] = value;
                      }
                    } else {
                      // Standard property, apply directly
                      // @ts-ignore - Dynamic style property assignment
                      animElement.style[key] = value;
                    }
                  } else {
                    // Standard property, apply directly
                    // @ts-ignore - Dynamic style property assignment
                    animElement.style[key] = value;
                  }

                  // Verify it was actually set
                } catch (err) {
                  console.error(`[DIAG-DOM] Failed to apply style property ${key}:`, err);
                }
              }
            });

            // Step 3: Apply transform string to element
            if (transformsToApply.length > 0) {
              const newTransform = transformsToApply.join(" ");
              animElement.style.transform = newTransform;
            }
          });
        });
      });
    });

    // Setup event handlers in a reactive context
    createEffect(() => {
      const el = elementRef();
      if (!el) return;

      // CRITICAL: Setup direct event handlers for hover, click, focus
      // This ensures event-based animations work correctly
      const cleanupHandlers = setupDirectEventHandlers(el);
      
      // Cleanup event handlers when component unmounts or element changes
      onCleanup(() => {
        if (cleanupHandlers) {
          cleanupHandlers();
        }
      });
    });

    // Handle ref
    const handleRef = (el: HTMLElement) => {
      if (!el) return; // Guard against null refs

      if (IS_DEBUG_MODE) {
      }

      // Set the element ref for animations to use
      setElementRef(el);

      // CRITICAL: Ensure all animations are created after the element is available
      // This forces re-evaluation of all animations with the element available
      setTimeout(() => {

        // Simply accessing the element triggers reactivity in SolidJS
        // This ensures all animations get properly bound to the element
        if (el && el.tagName) {
          // Touch element property to trigger reactivity
          const dummy = el.tagName;
        }
      }, 0);

      // Pass ref to original handler if provided
      if (typeof animationProps.ref === "function") {
        animationProps.ref(el);
      }
    };

    // Apply reduced motion styles if needed
    createEffect(() => {
      const element = elementRef();
      if (!element) return;

      if (prefersReducedMotion() && animationProps.reducedMotionTransition) {
        element.style.transition = animationProps.reducedMotionTransition;
      } else {
        element.style.transition = "";
      }
    });

    // Render component with animated styles
    return createComponent(
      StyledComponent,
      mergeProps(otherProps, {
        ref: handleRef,
        style: animatedStyles(),
      })
    );
  };
}

// Export the animated function and convenience components
const AnimatedComponents = {
  div: animated("div"),
  span: animated("span"),
  p: animated("p"),
  h1: animated("h1"),
  h2: animated("h2"),
  h3: animated("h3"),
  h4: animated("h4"),
  h5: animated("h5"),
  h6: animated("h6"),
  a: animated("a"),
  img: animated("img"),
  button: animated("button"),
  section: animated("section"),
  article: animated("article"),
  header: animated("header"),
  footer: animated("footer"),
  main: animated("main"),
  nav: animated("nav"),
  ul: animated("ul"),
  ol: animated("ol"),
  li: animated("li"),
  input: animated("input"),
  textarea: animated("textarea"),
  select: animated("select"),
  form: animated("form"),
  svg: animated("svg"),
  path: animated("path"),
};

// Export both the animated function and convenience components
export default Object.assign(animated, AnimatedComponents);
