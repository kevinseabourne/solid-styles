import { createEffect, createMemo, createSignal, onCleanup } from "solid-js";
import { AnimationConfig, SpringTarget, WidenSpringTarget } from "../spring-bridge";
import { useAnimation, AnimationResult } from "./useAnimation";

/**
 * Stagger pattern function signature
 * Takes an index and total count, returns a normalized delay factor (0-1)
 */
export type StaggerPattern = (index: number, total: number) => number;

/**
 * Built-in stagger patterns
 */
export const StaggerPatterns = {
  /**
   * Animations start from the first item to the last
   */
  forward: (index: number, total: number) => index / Math.max(1, total - 1),

  /**
   * Animations start from the last item to the first
   */
  reverse: (index: number, total: number) => 1 - index / Math.max(1, total - 1),

  /**
   * Animations start from the center and move outward
   */
  center: (index: number, total: number) => {
    const mid = (total - 1) / 2;
    const distance = Math.abs(index - mid);
    return distance / mid;
  },

  /**
   * Animations start from the edges and move toward the center
   */
  edges: (index: number, total: number) => {
    const mid = (total - 1) / 2;
    const distance = Math.abs(index - mid);
    return 1 - distance / mid;
  },

  /**
   * Random stagger order (different each time)
   */
  random: () => Math.random(),

  /**
   * Even items first, then odd items
   */
  evenOdd: (index: number) => index % 2,
};

/**
 * Configuration for staggered animations
 */
export interface StaggerConfig {
  /**
   * Base delay between animations (milliseconds)
   * @default 50
   */
  delay?: number;

  /**
   * Stagger pattern to use
   * Can be a string key from StaggerPatterns or a custom function
   * @default "forward"
   */
  pattern?: keyof typeof StaggerPatterns | StaggerPattern;

  /**
   * Number of items to animate at once (groups)
   * @default 1
   */
  groupSize?: number;

  /**
   * Maximum total delay (milliseconds)
   * Useful for large lists to cap the maximum delay
   * If provided, delays will be scaled proportionally
   */
  maxTotalDelay?: number;
}

/**
 * Hook for creating staggered animations across multiple items
 *
 * @param config Animation configuration
 * @param staggerProps Stagger configuration
 * @param index Index of this item in the staggered sequence
 * @param total Total number of items in the sequence
 * @returns Animation result with delayed start
 */
export function useStaggeredAnimation<T extends SpringTarget>(
  config: any,
  index: number,
  total: number,
  staggerProps: StaggerConfig = {}
): AnimationResult<T> {
  // Extract stagger configuration with defaults
  const { delay = 50, pattern = "forward", groupSize = 1, maxTotalDelay } = staggerProps;

  // Calculate group index if using groups
  const groupIndex = Math.floor(index / groupSize);
  const totalGroups = Math.ceil(total / groupSize);

  // Determine the stagger pattern function to use
  const patternFn = typeof pattern === "function" ? pattern : StaggerPatterns[pattern] || StaggerPatterns.forward;

  // Calculate the stagger factor (0-1)
  const staggerFactor = patternFn(groupIndex, totalGroups);

  // Calculate the final delay
  let staggerDelay = staggerFactor * delay * totalGroups;

  // Cap the delay if maxTotalDelay is provided
  if (maxTotalDelay !== undefined && delay * totalGroups > maxTotalDelay) {
    const scale = maxTotalDelay / (delay * totalGroups);
    staggerDelay *= scale;
  }

  // Create a delayed version of the when or condition function
  const originalWhen = config.when;
  const originalCondition = config.condition;

  // Track if the animation should be active based on original condition
  const [shouldBeActive, setShouldBeActive] = createSignal(false);
  // Track if animation is actually allowed to start (after delay)
  const [canStart, setCanStart] = createSignal(false);

  // Set up timer for the delay
  let timer: number | null = null;

  // Watch the original condition
  createEffect(() => {
    let active = false;

    if (originalCondition) {
      active = originalCondition();
    } else if (typeof originalWhen === "function") {
      active = originalWhen();
    }

    // Update the should-be-active state
    setShouldBeActive(active);

    // If becoming active, set timer for delay
    if (active && !canStart()) {
      // Clear any existing timer
      if (timer !== null) {
        window.clearTimeout(timer);
      }

      // Set new timer
      timer = window.setTimeout(() => {
        setCanStart(true);
      }, staggerDelay);
    } else if (!active) {
      // If becoming inactive, reset canStart
      setCanStart(false);
    }
  });

  // Clean up timer
  onCleanup(() => {
    if (timer !== null) {
      window.clearTimeout(timer);
    }
  });

  // Create final condition that respects the delay
  const delayedCondition = createMemo(() => {
    return shouldBeActive() && canStart();
  });

  // Create the animation with delayed condition
  return useAnimation({
    ...config,
    condition: delayedCondition,
  });
}

/**
 * Helper hook to create staggered animations for a list of items
 *
 * @param items Array of items to animate
 * @param getConfig Function to get animation config for an item
 * @param staggerProps Stagger configuration
 * @returns Array of animation results
 */
export function useStaggeredList<T extends SpringTarget, Item>(
  items: Item[],
  getConfig: (item: Item, index: number) => AnimationConfig<T>,
  staggerProps: StaggerConfig = {}
): AnimationResult<T>[] {
  // Create animations for each item
  return items.map((item, index) => {
    const config = getConfig(item, index);
    return useStaggeredAnimation(config, index, items.length, staggerProps);
  });
}
