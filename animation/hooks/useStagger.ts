import { Accessor, createMemo } from "solid-js";
import { AnimationConfig, SpringTarget } from "../spring-bridge";

/**
 * Built-in stagger patterns
 */
export const StaggerPatterns = {
  forward: (index: number, total: number) => index / Math.max(1, total - 1),
  reverse: (index: number, total: number) => 1 - (index / Math.max(1, total - 1)),
  center: (index: number, total: number) => {
    const mid = (total - 1) / 2;
    const distance = Math.abs(index - mid);
    return distance / mid;
  },
  edges: (index: number, total: number) => {
    const mid = (total - 1) / 2;
    const distance = Math.abs(index - mid);
    return 1 - (distance / mid);
  },
  random: () => Math.random()
};

/**
 * Type for stagger pattern function
 */
export type StaggerPattern = (index: number, total: number) => number;

/**
 * Base configuration for stagger
 */
export interface StaggerOptions {
  /**
   * Delay in milliseconds between each item
   * @default 50
   */
  delay?: number;
  
  /**
   * Pattern to use for calculating delays
   * @default "forward"
   */
  pattern?: keyof typeof StaggerPatterns | StaggerPattern;
  
  /**
   * Maximum total delay for the entire sequence (ms)
   * Delays will be scaled to fit within this limit
   */
  maxTotalDelay?: number;
}

/**
 * Creates a stagger factory for generating animations with coordinated delays
 * 
 * @example
 * ```
 * // Create a stagger sequence
 * const stagger = createStagger({ delay: 50, pattern: "forward" });
 * 
 * // In your component rendering a list:
 * return (
 *   <div>
 *     {items.map((item, i) => (
 *       <animated("div")
 *         animate={stagger({
 *           from: { opacity: 0, y: 20 },
 *           to: { opacity: 1, y: 0 },
 *           when: "mount"
 *         }, i, items.length)}
 *       >
 *         {item.content}
 *       </animated("div")>
 *     ))}
 *   </div>
 * );
 * ```
 */
export function createStagger(options: StaggerOptions = {}) {
  const { 
    delay = 50, 
    pattern = "forward", 
    maxTotalDelay
  } = options;
  
  /**
   * Creates a delayed version of an animation config
   * 
   * @param animation Base animation configuration
   * @param index Index of this item in the sequence
   * @param total Total number of items
   * @returns Animation config with appropriate delay
   */
  function stagger<T extends SpringTarget>(
    animation: AnimationConfig<T>, 
    index: number, 
    total: number
  ): AnimationConfig<T> {
    // Skip delay calculation if delay is 0
    if (delay === 0) {
      return animation;
    }
    
    // Get the pattern function
    const patternFn = typeof pattern === "function" 
      ? pattern 
      : StaggerPatterns[pattern] || StaggerPatterns.forward;
    
    // Calculate the stagger factor (0-1)
    const staggerFactor = patternFn(index, total);
    
    // Determine the basic delay
    let calculatedDelay = staggerFactor * delay * (total - 1);
    
    // Cap the delay if maxTotalDelay is specified
    if (maxTotalDelay !== undefined && (delay * (total - 1)) > maxTotalDelay) {
      const scale = maxTotalDelay / (delay * (total - 1));
      calculatedDelay *= scale;
    }
    
    // Return the animation with delay added
    return {
      ...animation,
      delay: (animation.delay || 0) + calculatedDelay
    };
  }
  
  // Return the stagger function
  return stagger;
}

/**
 * Creates a stagger sequence for multiple items
 * with a cleaner, more declarative API
 * 
 * @example
 * ```
 * // In your component:
 * const animations = useStagger(
 *   items.map(item => item.id), // Array of IDs or any values
 *   {
 *     from: { opacity: 0, y: 20 },
 *     to: { opacity: 1, y: 0 },
 *     when: "mount"
 *   },
 *   { delay: 80, pattern: "center" }
 * );
 * 
 * // Then in your JSX:
 * return (
 *   <div>
 *     {items.map((item, i) => (
 *       <animated("div") key={item.id} animate={animations[i]}>
 *         {item.content}
 *       </animated("div")>
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useStagger<T extends SpringTarget, ID>(
  items: ID[],
  baseAnimation: AnimationConfig<T>,
  options: StaggerOptions = {}
): AnimationConfig<T>[] {
  // Create a stagger factory with these options
  const staggerFn = createStagger(options);
  
  // Create staggered configurations for each item
  return items.map((_, index) => 
    staggerFn(baseAnimation, index, items.length)
  );
}
