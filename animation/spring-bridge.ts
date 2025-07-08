/**
 * Spring Animation Bridge
 *
 * This file serves as a bridge between the core spring animation system and the Solid Styles library.
 * It provides a unified API for creating and controlling animations with proper lifecycle management.
 */

import { Accessor, createEffect, createSignal, onCleanup, onMount } from "solid-js";
// Re-export necessary types from spring.ts
import {
  SpringConfig,
  SpringOptions,
  SpringTarget as SpringTypeTarget,
  WidenSpringTarget as SpringWidenSpringTarget,
  createSpring,
} from "../utils/spring";

// Debug mode flag - set to false for production and clean test output
const IS_DEBUG_MODE = process.env.NODE_ENV === 'development' && process.env.ENABLE_DEBUG_LOGGING === 'true';

import { AnimationTrigger } from "./hooks/useTriggers";

// Export these types to be used by other components
export type WidenSpringTarget<T> = SpringWidenSpringTarget<T>;
export type SpringTarget = SpringTypeTarget;

// Define a type for any spring target (used for type casting in complex scenarios)
export type AnySpringTarget = any;

// =============================================================================
// Animation State Types
// =============================================================================

/**
 * The current state of an animation
 */
export type AnimationState =
  | "idle" // Animation is not running
  | "running" // Animation is currently running
  | "paused" // Animation is paused
  | "completed" // Animation has completed
  | "cancelled"; // Animation was cancelled before completion

/**
 * Animation controls interface
 */
export interface AnimationControls<T extends SpringTarget> {
  /**
   * Start animation to the specified target value
   *
   * @param target Target value to animate to
   * @returns Animation controls (for chaining)
   */
  start: (target?: WidenSpringTarget<T>) => AnimationControls<T>;

  /**
   * Immediately set value without animation
   *
   * @param value Value to set
   * @returns Animation controls (for chaining)
   */
  set: (value: WidenSpringTarget<T>) => AnimationControls<T>;

  /**
   * Stop ongoing animation
   *
   * @returns Animation controls (for chaining)
   */
  stop: () => AnimationControls<T>;

  /**
   * Pause ongoing animation
   *
   * @returns Animation controls (for chaining)
   */
  pause: () => AnimationControls<T>;

  /**
   * Resume paused animation
   *
   * @returns Animation controls (for chaining)
   */
  resume: () => AnimationControls<T>;

  /**
   * Reverse animation direction
   *
   * @returns Animation controls (for chaining)
   */
  reverse: () => AnimationControls<T>;

  /**
   * Complete animation immediately
   *
   * @returns Animation controls (for chaining)
   */
  finish: () => AnimationControls<T>;
}

/**
 * Result of animation creation
 */
export interface AnimationResult<T extends SpringTarget> {
  /**
   * Current animated value
   */
  value: Accessor<T>;

  /**
   * Current animation state
   */
  state: Accessor<AnimationState>;

  /**
   * Animation controls
   */
  controls: AnimationControls<T>;

  /**
   * Whether animation is running in reverse
   */
  isReversed: Accessor<boolean>;

  /**
   * Whether animation is currently active
   */
  isActive?: Accessor<boolean>;
}

/**
 * Animation configuration
 */
export interface AnimationConfig<T extends SpringTarget> {
  /**
   * Starting value
   */
  from: T;

  /**
   * Target value
   */
  to: WidenSpringTarget<T>;

  /**
   * When to trigger animation
   * @example "mount" | "hover" | "inView"
   */
  when?: AnimationTrigger | (() => boolean);

  /**
   * Condition to trigger animation
   */
  condition?: () => boolean;

  /**
   * Whether to reverse animation when condition becomes false
   */
  reverseOnExit?: boolean;

  /**
   * Delay before animation starts (in ms)
   */
  delay?: number;

  /**
   * Animation spring options
   */
  config?: Partial<SpringConfig>;

  /**
   * Called when animation starts
   */
  onStart?: () => void;

  /**
   * Called when animation completes
   */
  onComplete?: () => void;

  /**
   * Called when animation is cancelled
   */
  onCancel?: () => void;

  /**
   * Keyframe animation options
   * If provided, the animation will use keyframes instead of from/to
   */
  keyframes?: KeyframeConfig[];
}

/**
 * Keyframe definition with percentage support
 */
export interface KeyframeConfig {
  /**
   * Value to animate to at this keyframe
   */
  value: any;

  /**
   * Percentage position in the animation sequence (0-100)
   * If omitted, keyframes are spaced evenly
   * @example 0, 25, 50, 75, 100
   */
  percentage?: number;

  /**
   * Optional spring configuration override for this specific keyframe transition
   */
  config?: Partial<SpringConfig>;
}

/**
 * Options for keyframe animation
 */
export interface KeyframeOptions {
  /**
   * Array of keyframe values to animate through
   * Can be simple values or full keyframe objects with percentage positions
   */
  keyframes: KeyframeConfig[];

  /**
   * Total animation duration in milliseconds
   * This defines the overall timeline that percentage keyframes reference
   * If omitted, animation will use natural spring timing
   */
  duration?: number;

  /**
   * If true, animation will loop through keyframes
   */
  loop?: boolean;

  /**
   * Global spring configuration for all keyframe transitions
   * Can be overridden by individual keyframe configs
   */
  springConfig?: Partial<SpringConfig>;
}

/**
 * Enhanced spring options with animation lifecycle callbacks
 */
export interface AnimationOptions extends SpringOptions {
  /**
   * Called when animation starts
   */
  onStart?: () => void;

  /**
   * Called when animation completes
   */
  onComplete?: () => void;

  /**
   * Called when animation is paused
   */
  onPause?: () => void;

  /**
   * Called when animation is resumed from paused state
   */
  onResume?: () => void;

  /**
   * Called when animation is cancelled
   */
  onCancel?: () => void;

  /**
   * Called on each animation frame with current value
   */
  onUpdate?: (value: any) => void;

  /**
   * If true, animation starts immediately on creation
   * Default: true
   */
  immediate?: boolean;

  /**
   * If true, animation will automatically reverse on completion
   * Default: false
   */
  autoReverse?: boolean;

  /**
   * Number of times to repeat the animation
   * Default: 0 (no repeat)
   */
  repeat?: number;

  /**
   * Type of repetition (loop or reverse)
   */
  repeatType?: "loop" | "reverse";

  /**
   * If true, respects user's reduced motion preferences
   * Default: true
   */
  respectReducedMotion?: boolean;

  /**
   * Keyframe animation options
   * If provided, the animation will use keyframes instead of from/to
   */
  keyframeOptions?: KeyframeOptions;

  /**
   * Called when an animation that is currently running gets interrupted by a new `start()` invocation.
   */
  onInterrupt?: () => void;

  /**
   * Called when the animation encounters an unrecoverable error.
   */
  onError?: (error: any) => void;
}

// =============================================================================
// Utility Functions
// =============================================================================

// Normalizes spring physics parameters to the correct scale for the core engine
// High-level API uses values like stiffness: 170, damping: 22
// Core engine expects values like stiffness: 0.15, damping: 0.8
//
// @param options Original spring options with high-level API scale
// @returns Normalized spring options with core engine scale
const normalizeSpringParams = (options: AnimationOptions): AnimationOptions => {
  // Deep clone to avoid mutating the original
  const normalizedOptions = { ...options };

  // Normalize stiffness (150 -> 0.15)
  if (typeof normalizedOptions.stiffness === "number") {
    normalizedOptions.stiffness = normalizedOptions.stiffness / 1000;
  }

  // Normalize damping (18 -> 0.18)
  if (typeof normalizedOptions.damping === "number") {
    normalizedOptions.damping = normalizedOptions.damping / 100;
  }

  return normalizedOptions;
};

// Helper function to convert hex to RGB object
function hexToRgb(hex: string): { r: number; g: number; b: number; a?: number } {
  // Remove # if present
  const cleanHex = hex.startsWith("#") ? hex.substring(1) : hex;

  // Handle shorthand hex (#RGB or #RGBA)
  if (cleanHex.length === 3 || cleanHex.length === 4) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    const a = cleanHex.length === 4 ? parseInt(cleanHex[3] + cleanHex[3], 16) / 255 : undefined;

    return { r, g, b, a };
  }

  // Handle full hex (#RRGGBB or #RRGGBBAA)
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const a = cleanHex.length === 8 ? parseInt(cleanHex.substring(6, 8), 16) / 255 : undefined;

  return { r, g, b, a: a ?? 1 };
}

// Helper function to convert any color string to RGB values
function colorToRgb(color: string): { r: number; g: number; b: number; a: number } {
  // Use a canvas element to convert any CSS color to RGB
  try {
    // Handle hex colors directly
    if (color.startsWith("#")) {
      const rgb = hexToRgb(color);
      return { r: rgb.r, g: rgb.g, b: rgb.b, a: rgb.a ?? 1 };
    }

    // Handle RGB/RGBA directly with regex
    if (color.startsWith("rgb")) {
      const matches = color.match(/\d+(\.\d+)?/g);
      if (matches && matches.length >= 3) {
        return {
          r: parseFloat(matches[0]),
          g: parseFloat(matches[1]),
          b: parseFloat(matches[2]),
          a: matches.length >= 4 ? parseFloat(matches[3]) : 1,
        };
      }
    }

    // For other formats, use a temporary DOM element
    const tempElement = document.createElement("div");
    tempElement.style.color = color;
    document.body.appendChild(tempElement);
    const computedColor = getComputedStyle(tempElement).color;
    document.body.removeChild(tempElement);

    // Parse the computed rgb/rgba value
    const matches = computedColor.match(/\d+(\.\d+)?/g);
    if (matches && matches.length >= 3) {
      return {
        r: parseFloat(matches[0]),
        g: parseFloat(matches[1]),
        b: parseFloat(matches[2]),
        a: matches.length >= 4 ? parseFloat(matches[3]) : 1,
      };
    }

    throw new Error(`Failed to parse color: ${color}`);
  } catch (e) {
    console.error("Error converting color to RGB:", e);
    // Return a default color on error (black)
    return { r: 0, g: 0, b: 0, a: 1 };
  }
}

// Debug function to transform color objects to the format expected by the spring physics engine
function deepProcessColorValues(colorObject: any): any {
  if (IS_DEBUG_MODE) {
    console.log("[DEEP-PROCESS] Processing color value:", colorObject);
  }

  // Case 1: Direct string handling
  if (typeof colorObject === "string") {
    // Hex colors
    if (colorObject.startsWith("#")) {
      console.log("[DEEP-PROCESS] Converting hex string to RGB object");
      return hexToRgb(colorObject);
    }

    // RGB/RGBA colors, HSL/HSLA colors, Named colors
    if (colorObject.match(/rgba?\(/) || colorObject.match(/hsla?\(/) || CSS.supports("color", colorObject)) {
      console.log("[DEEP-PROCESS] Converting color string to RGB object:", colorObject);
      return colorToRgb(colorObject);
    }

    // Gradient strings
    if (colorObject.match(/(?:linear|radial|conic)-gradient\(/)) {
      if (IS_DEBUG_MODE) {
        console.log("[DEEP-PROCESS] Converting gradient string - passing through for later parsing");
      }
      return colorObject; // Will be parsed in processColors in animatedStyled.tsx
    }
  }

  // Case 2: Already a Color object with value and format - convert to RGB object
  if (colorObject && typeof colorObject === "object" && "value" in colorObject && "format" in colorObject) {
    if (IS_DEBUG_MODE) {
      console.log("[DEEP-PROCESS] Converting Color object to RGB object:", colorObject);
    }
    return colorToRgb(colorObject.value);
  }

  // Case 3: Direct RGB object
  if (
    colorObject &&
    typeof colorObject === "object" &&
    "r" in colorObject &&
    "g" in colorObject &&
    "b" in colorObject
  ) {
    if (IS_DEBUG_MODE) {
      console.log("[DEEP-PROCESS] Already an RGB object:", colorObject);
    }
    // Ensure alpha is present
    return { ...colorObject, a: colorObject.a ?? 1 };
  }

  // Case 4: Object with potentially nested color values
  if (colorObject && typeof colorObject === "object") {
    if (IS_DEBUG_MODE) {
      console.log("[DEEP-PROCESS] Processing object with potential color properties");
    }
    const result = Array.isArray(colorObject) ? [...colorObject] : { ...colorObject };

    for (const key in result) {
      // Check if this is a color-related property
      if (
        key.toLowerCase().includes("color") ||
        key.toLowerCase().includes("background") ||
        key.toLowerCase().includes("gradient")
      ) {
        result[key] = deepProcessColorValues(result[key]);
      } else if (typeof result[key] === "object") {
        // Recursively process nested objects
        result[key] = deepProcessColorValues(result[key]);
      }
    }
    return result;
  }

  // Default: return unchanged
  return colorObject;
}

// =============================================================================
// Animation Presets
// =============================================================================

/**
 * Spring animation presets for common use cases
 * These provide optimized parameters for different types of animations
 */
export const springPresets = {
  /**
   * Default animation - balanced for most general cases
   * Medium stiffness, moderate damping for slight bounce
   */
  default: {
    stiffness: 150,
    damping: 15,
    precision: 0.01,
  },

  /**
   * Responsive hover effect - quick with minimal bounce
   * Higher stiffness, moderate damping for responsiveness
   */
  hover: {
    stiffness: 170,
    damping: 22,
    precision: 0.005,
  },

  /**
   * Subtle effect - very gentle animation
   * Lower stiffness, higher damping to prevent bounce
   */
  subtle: {
    stiffness: 120,
    damping: 30,
    precision: 0.01,
  },

  /**
   * Bounce effect - emphasizes movement with noticeable bounce
   * Medium stiffness, low damping for pronounced bounce
   */
  bounce: {
    stiffness: 150,
    damping: 8,
    precision: 0.005,
  },

  /**
   * Elastic effect - exaggerated bounce for playful interactions
   * Higher stiffness, very low damping for multiple oscillations
   */
  elastic: {
    stiffness: 200,
    damping: 6,
    precision: 0.001,
  },

  /**
   * Precise effect - quick with no bounce
   * Very high stiffness, critical damping for no oscillation
   */
  precise: {
    stiffness: 250,
    damping: 35,
    precision: 0.001,
  },

  /**
   * Gentle effect - slow, gradual movement
   * Low stiffness, high damping for slow settling
   */
  gentle: {
    stiffness: 80,
    damping: 20,
    precision: 0.01,
  },

  /**
   * Custom preset creator
   * @param stiffness Spring stiffness (higher = faster movement)
   * @param damping Damping factor (higher = less bounce)
   * @param precision Animation precision
   * @returns Spring configuration
   */
  custom: (stiffness: number, damping: number, precision = 0.01) => ({
    stiffness,
    damping,
    precision,
  }),
};

// =============================================================================
// Core Animation Functions
// =============================================================================

/**
 * Creates an animated value with enhanced lifecycle management and controls.
 *
 * @param initialValue Initial value to animate from
 * @param targetValue Target value to animate to
 * @param options Animation options
 * @returns Animation value, state, and controls
 */
export function createAnimation<T extends SpringTarget>(
  initialValue: T,
  targetValue: WidenSpringTarget<T>,
  options: AnimationOptions = {}
): AnimationResult<T> {
  // Normalize physics parameters for the core engine
  const normalizedOptions = normalizeSpringParams(options);

  // Enhanced error handling for animations
  if (options.immediate && (options.onStart || options.onComplete)) {
    console.warn("[ANIM-WARN] Using immediate with lifecycle callbacks may skip callbacks");
  }

  // Transform color values in both initial and target values
  if (IS_DEBUG_MODE) {
    console.log(`[SPRING-DEBUG] Starting animation to target:`, targetValue);
  }

  // Enhanced color processing for spring physics
  const processedTarget = deepProcessColorValues(targetValue);
  const processedInitial = deepProcessColorValues(initialValue);

  if (IS_DEBUG_MODE) {
    console.log(`[SPRING-COLOR-FIX] Transformed target color values:`);
    console.log(`  Original:`, targetValue);
    console.log(`  Processed:`, processedTarget);

    // Diagnostic for color properties
    if (typeof processedTarget === "object" && processedTarget !== null) {
      for (const key in processedTarget) {
        if (key.toLowerCase().includes("color") || key.toLowerCase().includes("background")) {
          console.log(`[SPRING-COLOR] Property ${key} =`, JSON.stringify(processedTarget[key]));
        }
      }
    }
  }

  // Create a spring with normalized options and callbacks
  const [springValue, setSpringValue] = createSpring(processedInitial, {
    ...normalizedOptions,
    onStart: () => {
      if (IS_DEBUG_MODE) {
        console.log("[ANIM-CALLBACK] onStart called");
      }
      setState("running");
      options.onStart?.();
    },
    onComplete: () => {
      if (IS_DEBUG_MODE) {
        console.log("[ANIM-CALLBACK] onComplete called");
      }
      setState("completed");
      options.onComplete?.();
    },
    onUpdate: (value) => {
      options.onUpdate?.(value);
    },
    onInterrupt: () => {
      if (IS_DEBUG_MODE) {
        console.log("[ANIM-CALLBACK] onInterrupt called");
      }
      options.onInterrupt?.();
    },
  });

  // Add state tracking
  const [state, setState] = createSignal<AnimationState>("idle");
  const [isReversed, setIsReversed] = createSignal(false);

  // Keep track if animation is playing in reverse
  const lastDirection = { reverse: false };

  // Start animation with the specified target
  const start = (target: WidenSpringTarget<T> = processedTarget, springOpts: AnimationOptions = {}) => {
    if (IS_DEBUG_MODE) {
      console.log(`[ANIM-START] Setting new target value:`, target);
    }

    const processedStart = deepProcessColorValues(target);

    try {
      // Diagnostic logging for state transitions
      if (IS_DEBUG_MODE) {
        console.log(`[ANIM-STATE-DEBUG] Animation state before start: ${state()}, current value:`, springValue());
      }

      // If an animation is already running this constitutes an interruption.
      if (state() === "running") {
        options.onInterrupt?.();
      }

      // Configure spring animation options
      const animationConfig: any = {
        ...normalizedOptions,
        ...springOpts,
      };

      // Optional: handle immediate mode
      if (options.immediate) {
        animationConfig.hard = true; // Skip physics
      }

      if (IS_DEBUG_MODE) {
        console.log(`[ANIM-STATE-DEBUG] Setting spring animation with:`, { target: processedStart });
      }

      // Set the spring target value – capture promise to surface errors.
      setSpringValue(processedStart as any, animationConfig).catch((err) => {
        options.onError?.(err);
      });

      return controls; // Return controls for chaining
    } catch (e) {
      console.error("[ANIM-ERROR] Failed to start animation:", e);
      return controls; // Return controls even on error
    }
  };

  // Stop the animation and reset
  const stop = () => {
    setState("idle");
    setIsReversed(false);
    return controls; // Return controls for chaining
  };

  // Pause the animation
  const pause = () => {
    if (state() !== "running") return controls;

    setState("paused");

    if (options.onPause) {
      options.onPause();
    }

    return controls; // Return controls for chaining
  };

  // Resume the animation
  const resume = () => {
    if (state() !== "paused") return controls;

    setState("running");

    if (options.onResume) {
      options.onResume();
    }

    return controls; // Return controls for chaining
  };

  // Reverse the animation direction
  const reverse = () => {
    setIsReversed(!isReversed());

    const target = !isReversed() ? processedInitial : processedTarget;
    setSpringValue(target as any);

    setState("running");

    return controls; // Return controls for chaining
  };

  // Complete animation immediately
  const finish = () => {
    setSpringValue(processedTarget as any, { hard: true });

    setState("completed");

    if (options.onComplete) {
      options.onComplete();
    }

    return controls; // Return controls for chaining
  };

  // Animation controls
  const controls: AnimationControls<T> = {
    start,
    set: (value: WidenSpringTarget<T>) => {
      setSpringValue(deepProcessColorValues(value) as any, { hard: true });
      return controls;
    },
    stop,
    pause,
    resume,
    reverse,
    finish,
  };

  // Start animation immediately if option is set
  onMount(() => {
    if (options.immediate !== false) {
      start();
    }
  });

  // Cleanup on unmount
  onCleanup(() => {
    // If the component unmounts (or the animation instance is replaced)
    // while the animation is still active, this counts as an interruption.
    if (state() === "running" || state() === "paused") {
      // Notify consumers that the animation did not finish naturally.
      options.onInterrupt?.();

      // Mark as cancelled for downstream listeners.
      setState("cancelled");
      options.onCancel?.();
    }
  });

  return {
    value: springValue,
    state,
    controls,
    isReversed,
  };
}

/**
 * Creates a toggle animation that switches between two states.
 *
 * @param initialValue Initial value (inactive state)
 * @param activeValue Target value (active state)
 * @param options Animation options
 * @returns Animation result with toggle controls
 */
export function createToggleAnimation<T extends SpringTarget>(
  initialValue: T,
  activeValue: WidenSpringTarget<T>,
  options: AnimationOptions = {}
) {
  // CRITICAL FIX: Store toggle state in a persistent variable
  // that won't be affected by component re-renders
  const [isActive, setIsActive] = createSignal(false);

  // Create base animation
  const animation = createAnimation<T>(initialValue, activeValue, {
    ...options,
    immediate: false, // Don't start immediately
  });

  // Debug toggle state changes
  createEffect(() => {
    const active = isActive();
    console.log(`[TOGGLE-DEBUG] Toggle animation active state changed to: ${active}`);
  });

  // Enhanced controls for toggling
  const controls = {
    ...animation.controls,

    // Toggle between states
    toggle: () => {
      const nextState = !isActive();
      console.log(`[TOGGLE-DEBUG] Toggle animation from ${isActive()} to ${nextState}`);

      if (nextState) {
        controls.activate();
      } else {
        controls.deactivate();
      }
      return controls;
    },

    // Activate (animate to active value)
    activate: () => {
      console.log(`[TOGGLE-DEBUG] Activating toggle animation`);

      // Only update if state is changing
      if (!isActive()) {
        setIsActive(true);

        // CRITICAL FIX: Force state update before animation starts
        // This ensures animations maintain continuity
        const currentState = animation.state();
        console.log(`[TOGGLE-STATE] Current animation state before activation: ${currentState}`);

        // CRITICAL FIX: Force a full state update even if animation appears to be in the desired state
        // This addresses edge cases where animation state seems correct but values aren't updating
        const springValue = animation.value();
        console.log(`[TOGGLE-DEBUG] Current spring value before activation:`, springValue);

        // Start the animation to the active value, preserving physics
        animation.controls.start(activeValue as any);

        // CRITICAL FIX: Ensure animation is running and track completion
        setTimeout(() => {
          console.log(`[TOGGLE-VERIFY] Animation state 1 frame after activation: ${animation.state()}`);
          console.log(`[TOGGLE-VERIFY] Animation value 1 frame after activation:`, animation.value());
        }, 16);

        // Ensure state is properly tracked
        if (currentState !== "running") {
          console.log(`[TOGGLE-STATE] Animation state after activation: ${animation.state()}`);
        }
      }
      return controls;
    },

    // Deactivate (animate to initial value)
    deactivate: () => {
      console.log(`[TOGGLE-DEBUG] Deactivating toggle animation`);

      // Only update if state is changing
      if (isActive()) {
        setIsActive(false);

        // CRITICAL FIX: Get current animation state for proper transition
        const currentState = animation.state();
        console.log(`[TOGGLE-STATE] Current animation state before deactivation: ${currentState}`);

        // Animate back to initial value
        animation.controls.start(initialValue as any);

        // Ensure state is properly tracked
        if (currentState !== "running") {
          console.log(`[TOGGLE-STATE] Animation state after deactivation: ${animation.state()}`);
        }
      }
      return controls;
    },

    // Force specific state
    setActive: (active: boolean) => {
      console.log(`[TOGGLE-DEBUG] Directly setting toggle state to: ${active}`);
      if (active !== isActive()) {
        active ? controls.activate() : controls.deactivate();
      }
      return controls;
    },

    // Read current active state
    isActive,
  };

  return {
    ...animation,
    controls,
    isActive,
  };
}
