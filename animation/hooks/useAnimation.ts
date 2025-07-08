/**
 * useAnimation Hook
 *
 * Core hook for creating animations with enhanced lifecycle management.
 * This hook is the foundation for all animation types in the system.
 */

import { Accessor, createEffect, createMemo, createSignal, onCleanup, untrack } from "solid-js";
import { AnimationControls, AnimationOptions, AnimationState, createAnimation } from "../spring-bridge";
import { SpringTarget, WidenSpringTarget } from "../../utils/spring";
import { logAnimationEvent, registerAnimation, unregisterAnimation } from "../diagnostics";

/**
 * Animation configuration for the useAnimation hook
 */
export interface AnimationConfig<T extends SpringTarget> extends AnimationOptions {
  /**
   * Initial value to animate from
   */
  from: T;

  /**
   * Target value to animate to
   */
  to: WidenSpringTarget<T>;

  /**
   * When to automatically trigger the animation
   * Can be a boolean signal or a function returning a boolean
   */
  when?: Accessor<boolean> | (() => boolean);

  /**
   * If true, animation will play in reverse when condition becomes false
   * Default: false
   */
  reverseOnExit?: boolean;

  /**
   * Delay before starting the animation (in ms)
   * Default: 0
   */
  delay?: number;

  /**
   * Condition to use for animation, overrides the 'when' property
   * Useful for custom control logic
   */
  condition?: Accessor<boolean>;

  /**
   * Callback to call when animation is interrupted
   */
  onInterrupt?: () => void;
}

/**
 * Result of the useAnimation hook
 */
export interface AnimationResult<T extends SpringTarget> {
  /**
   * Current animated value
   * Note: Using any here to avoid complex generic type constraints
   * that are challenging to express fully in TypeScript
   */
  value: Accessor<any>;

  /**
   * Current animation state
   */
  state: Accessor<AnimationState>;

  /**
   * Animation controls for manual control
   */
  controls: AnimationControls<T>;

  /**
   * Force start animation
   */
  start: (target?: WidenSpringTarget<T>) => void;

  /**
   * Is animation active
   */
  isActive: Accessor<boolean>;

  /**
   * Whether animation is running in reverse
   * Required for compatibility with the spring-bridge AnimationResult
   */
  isReversed: Accessor<boolean>;
}

/**
 * Core hook for creating animations
 *
 * @param config Animation configuration
 * @returns Animation result with value and controls
 */
export function useAnimation<T extends SpringTarget>(config: AnimationConfig<T>): AnimationResult<T> {
  // Extract configuration
  const { from, to, when, condition, reverseOnExit = false, delay, onInterrupt, ...options } = config;

  // Create animation with all options including callbacks
  const { value, state, controls, isReversed } = createAnimation(from, to, {
    ...options,
    immediate: false,
    delay,
    onInterrupt,
  });

  // Determine active state based on provided condition or "when" function
  const isActive = createMemo(() => {
    if (condition) {
      return condition();
    }

    if (typeof when === "function") {
      // Ensure we're tracking the when function as a reactive dependency
      try {
        return when();
      } catch (err) {
        console.error("[ANIM-ERROR] Error in animation trigger function:", err);
        return false;
      }
    }

    return false;
  });

  // Store previous active state for detecting changes
  const [wasActive, setWasActive] = createSignal(isActive());

  // Debug signals to track state
  const [hasStarted, setHasStarted] = createSignal(false);

  // Track active state changes and trigger animations - THIS IS KEY
  createEffect(() => {
    const active = isActive();
    const wasActiveValue = untrack(() => wasActive());
    const hasStartedValue = untrack(() => hasStarted());

    logAnimationEvent("animation", "check-active", { active, wasActive: wasActiveValue, hasStarted: hasStartedValue });

    // Only trigger if active state changed or we haven't started yet and should be active
    if (active !== wasActiveValue || (active && !hasStartedValue)) {
      if (active) {
        // Starting animation
        controls.start(to);
        setHasStarted(true);
        logAnimationEvent("animation", "start", { to, active });
      } else if (reverseOnExit) {
        // CRITICAL FIX: Call onInterrupt when animation changes direction due to trigger change
        if (hasStartedValue && wasActiveValue) {
          onInterrupt?.();
        }
        // Reverse animation when condition becomes false
        controls.start(from as WidenSpringTarget<T>);
        logAnimationEvent("animation", "reverse", { from, active });
      } else if (hasStartedValue && wasActiveValue) {
        // CRITICAL FIX: Call onInterrupt when animation stops due to trigger change
        onInterrupt?.();
        logAnimationEvent("animation", "interrupt", { wasActive: wasActiveValue, active });
      }

      setWasActive(active);
    }
  });

  // Manual start function (useful for imperative control)
  const start = (target?: WidenSpringTarget<T>) => {
    controls.start(target || to);
    setHasStarted(true);
    logAnimationEvent("animation", "manual-start", { target: target || to });
  };

  // Clean up animation when component unmounts
  onCleanup(() => {
    controls.stop();
    unregisterAnimation("animation");
  });

  // Register animation for diagnostics
  const animationId = `animation-${Math.random().toString(36).substring(2, 9)}`;
  registerAnimation(animationId, { controls, value, state });

  return {
    value,
    state,
    controls,
    start,
    isActive,
    isReversed,
  };
}

/**
 * Creates an animation that runs once on component mount
 *
 * @param config Animation configuration
 * @returns Animation result
 */
export function useMountAnimation<T extends SpringTarget>(
  config: Omit<AnimationConfig<T>, "when">
): AnimationResult<T> {
  return useAnimation({
    ...config,
    when: () => true,
    immediate: true,
  });
}

/**
 * Creates an animation that runs when component unmounts
 *
 * @param config Animation configuration
 * @returns Animation result with cleanup function
 */
export function useUnmountAnimation<T extends SpringTarget>(
  config: Omit<AnimationConfig<T>, "when">
): AnimationResult<T> & { cleanup: () => void } {
  const [shouldAnimate, setShouldAnimate] = createSignal(false);

  const result = useAnimation({
    ...config,
    when: shouldAnimate,
    immediate: false,
  });

  // Cleanup function to trigger unmount animation
  const cleanup = () => {
    setShouldAnimate(true);
  };

  onCleanup(cleanup);

  return {
    ...result,
    cleanup,
  };
}
