/**
 * Keyframe Animation Hook
 * 
 * This hook provides a percentage-based keyframe animation system powered by springs
 * offering the benefits of natural motion with the timing control of traditional animations.
 */

import { Accessor, createEffect, createMemo, createSignal, onCleanup } from "solid-js";
import { AnimationConfig, AnimationResult, AnimationState, KeyframeConfig, SpringTarget, WidenSpringTarget } from "../spring-bridge";
import { useAnimation } from "./useAnimation";

/**
 * Enhanced keyframe configuration with percentage support
 */
export interface KeyframeAnimationConfig<T extends SpringTarget> {
  /**
   * Array of keyframes with percentage positions
   * Each keyframe defines a state at a specific percentage of the animation
   * Keyframes must be ordered by percentage (0-100)
   * 
   * @example
   * keyframes: [
   *   { value: { opacity: 0, scale: 0.8 }, percentage: 0 },
   *   { value: { opacity: 1, scale: 1 }, percentage: 50 },
   *   { value: { opacity: 1, scale: 1.1 }, percentage: 75 },
   *   { value: { opacity: 1, scale: 1 }, percentage: 100 }
   * ]
   */
  keyframes: KeyframeConfig[];
  
  /**
   * Total duration of the animation in milliseconds
   * Required for percentage-based timing
   * @default 1000
   */
  duration?: number;
  
  /**
   * When to trigger animation
   * @example "mount" | "hover" | "inView"
   */
  when?: AnimationConfig<T>["when"];
  
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
   * Whether to loop the animation
   * @default false
   */
  loop?: boolean;
  
  /**
   * Spring configuration for transitions between keyframes
   * Controls how "springy" the motion is between keyframes
   */
  springConfig?: {
    /**
     * Stiffness of the spring (higher = faster)
     * @default 170
     */
    stiffness?: number;
    
    /**
     * Damping of the spring (higher = less bouncy)
     * @default 26
     */
    damping?: number;
    
    /**
     * Precision threshold for considering animation complete
     * @default 0.01
     */
    precision?: number;
  };
  
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
   * Called when a specific keyframe is reached
   */
  onKeyframe?: (index: number, keyframe: KeyframeConfig) => void;
}

/**
 * Result of the keyframe animation hook
 */
export interface KeyframeAnimationResult<T extends SpringTarget> {
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
  controls: AnimationResult<T>["controls"];
  
  /**
   * Whether animation is active
   */
  isActive: AnimationResult<T>["isActive"];
  
  /**
   * Whether animation is running in reverse
   */
  isReversed: AnimationResult<T>["isReversed"];
  
  /**
   * Current keyframe index
   */
  currentKeyframe: Accessor<number>;
  
  /**
   * Current progress (0-100)
   */
  progress: Accessor<number>;
  
  /**
   * Start the animation from the beginning
   * 
   * @returns Animation controls for chaining
   */
  start: () => void;
  
  /**
   * Pause the animation
   * 
   * @returns Animation controls for chaining
   */
  pause: () => void;
  
  /**
   * Resume a paused animation
   * 
   * @returns Animation controls for chaining
   */
  resume: () => void;
  
  /**
   * Seek to a specific percentage
   * 
   * @param percentage Target percentage (0-100)
   * @returns Animation controls for chaining
   */
  seekToPercentage: (percentage: number) => void;
  
  /**
   * Seek to a specific keyframe
   * 
   * @param index Keyframe index
   * @returns Animation controls for chaining
   */
  seekToKeyframe: (index: number) => void;
}

/**
 * Normalizes keyframes to ensure they have percentage values
 * and are sorted properly from 0-100
 */
function normalizeKeyframes(keyframes: KeyframeConfig[]): KeyframeConfig[] {
  if (!keyframes || keyframes.length === 0) {
    throw new Error("Keyframes array cannot be empty");
  }
  
  // Create a deep copy of keyframes to avoid mutating the original
  const keyframesCopy = [...keyframes];
  
  // Sort by percentage if provided
  const hasPercentages = keyframesCopy.some(kf => kf.percentage !== undefined);
  
  if (hasPercentages) {
    // Sort by percentage
    keyframesCopy.sort((a, b) => {
      const aPercent = a.percentage ?? 0;
      const bPercent = b.percentage ?? 100;
      return aPercent - bPercent;
    });
    
    // Fill in missing percentages (distribute evenly)
    let lastPercentage = 0;
    let nextIndex = keyframesCopy.findIndex(kf => kf.percentage !== undefined);
    
    if (nextIndex === -1) {
      // No keyframes have percentages, distribute evenly
      keyframesCopy.forEach((kf, i) => {
        kf.percentage = (i / (keyframesCopy.length - 1)) * 100;
      });
    } else {
      // Some keyframes have percentages, fill in gaps
      for (let i = 0; i < keyframesCopy.length; i++) {
        if (keyframesCopy[i].percentage !== undefined) {
          lastPercentage = keyframesCopy[i].percentage ?? 0; // Using nullish coalescing for safety
          continue;
        }
        
        // Find next keyframe with percentage
        nextIndex = keyframesCopy.findIndex((kf, idx) => idx > i && kf.percentage !== undefined);
        
        if (nextIndex === -1) {
          // No more keyframes with percentages, distribute to 100%
          const remainingFrames = keyframesCopy.length - i;
          const step = (100 - lastPercentage) / remainingFrames;
          
          for (let j = i; j < keyframesCopy.length; j++) {
            keyframesCopy[j].percentage = lastPercentage + step * (j - i + 1);
          }
          break;
        } else {
          // Distribute between lastPercentage and nextPercentage
          const nextPercentage = keyframesCopy[nextIndex].percentage ?? 100; // Using nullish coalescing
          const framesToFill = nextIndex - i;
          const step = (nextPercentage - lastPercentage) / (framesToFill + 1);
          
          keyframesCopy[i].percentage = lastPercentage + step;
          lastPercentage = keyframesCopy[i].percentage ?? 0; // Using nullish coalescing
        }
      }
    }
  } else {
    // No percentages provided, distribute evenly from 0-100
    keyframesCopy.forEach((kf, i) => {
      kf.percentage = (i / (keyframesCopy.length - 1)) * 100;
    });
  }
  
  // Ensure first keyframe is at 0% and last is at 100%
  if (keyframesCopy[0].percentage !== 0) {
    keyframesCopy[0].percentage = 0;
  }
  
  if (keyframesCopy[keyframesCopy.length - 1].percentage !== 100) {
    keyframesCopy[keyframesCopy.length - 1].percentage = 100;
  }
  
  return keyframesCopy;
}

/**
 * Hook for creating percentage-based keyframe animations
 * powered by the spring animation system
 * 
 * @example
 * ```tsx
 * // Create a bouncing entrance animation with precise timing
 * const animation = useKeyframeAnimation({
 *   keyframes: [
 *     { value: { opacity: 0, y: -50 }, percentage: 0 },
 *     { value: { opacity: 1, y: 10 }, percentage: 60 },
 *     { value: { opacity: 1, y: -5 }, percentage: 80 },
 *     { value: { opacity: 1, y: 0 }, percentage: 100 }
 *   ],
 *   duration: 800,
 *   when: "mount"
 * });
 * 
 * return (
 *   <animated("div") animate={animation}>
 *     I appear with a bounce!
 *   </animated("div")>
 * );
 * ```
 */
export function useKeyframeAnimation<T extends SpringTarget>(
  config: KeyframeAnimationConfig<T>
): KeyframeAnimationResult<T> {
  // Extract config options with defaults
  const {
    keyframes: rawKeyframes,
    duration = 1000,
    when,
    condition,
    reverseOnExit = false,
    delay = 0,
    loop = false,
    springConfig = { stiffness: 170, damping: 26, precision: 0.01 },
    onStart,
    onComplete,
    onCancel,
    onKeyframe
  } = config;
  
  // Normalize and validate keyframes
  const keyframes = normalizeKeyframes(rawKeyframes);
  
  if (keyframes.length < 2) {
    throw new Error("Keyframe animation requires at least 2 keyframes");
  }
  
  // Find the starting and ending values
  const firstKeyframe = keyframes[0];
  const lastKeyframe = keyframes[keyframes.length - 1];
  
  // Current state
  const [currentKeyframeIndex, setCurrentKeyframeIndex] = createSignal(0);
  const [progress, setProgress] = createSignal(0);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [isPaused, setIsPaused] = createSignal(false);
  
  // Track animation time
  let startTime = 0;
  let pausedTime = 0;
  let animationFrame: number | null = null;
  
  // Create the first base animation from initial keyframe to second
  const animation = useAnimation<T>({
    from: firstKeyframe.value as T,
    to: keyframes[1].value as WidenSpringTarget<T>,
    // Use our spring configuration for the animation
    ...springConfig
  });
  
  // Find keyframe at a specific percentage
  const findKeyframeAtPercentage = (targetPercentage: number): [number, KeyframeConfig, KeyframeConfig] => {
    // Ensure percentage is within bounds
    const clampedPercentage = Math.max(0, Math.min(100, targetPercentage));
    
    // Find the keyframes that bound this percentage
    let startIndex = 0;
    let endIndex = 1;
    
    for (let i = 0; i < keyframes.length - 1; i++) {
      const currentPercentage = keyframes[i].percentage ?? 0;
      const nextPercentage = keyframes[i + 1].percentage ?? 100;
      
      if (clampedPercentage >= currentPercentage && clampedPercentage <= nextPercentage) {
        startIndex = i;
        endIndex = i + 1;
        break;
      }
    }
    
    return [startIndex, keyframes[startIndex], keyframes[endIndex]];
  };
  
  // Process a frame of the animation
  const processFrame = (timestamp: number) => {
    if (!isPlaying() || isPaused()) return;
    
    if (startTime === 0) {
      startTime = timestamp;
    }
    
    // Calculate elapsed time and progress
    const elapsed = timestamp - startTime;
    const newProgress = Math.min(100, (elapsed / duration) * 100);
    
    // Update progress state
    setProgress(newProgress);
    
    // Find current keyframe segment
    const [newKeyframeIndex, startKeyframe, endKeyframe] = findKeyframeAtPercentage(newProgress);
    
    // Transition between keyframes if we've moved to a new segment
    if (newKeyframeIndex !== currentKeyframeIndex()) {
      setCurrentKeyframeIndex(newKeyframeIndex);
      
      // Notify about keyframe change
      onKeyframe?.(newKeyframeIndex, startKeyframe);
      
      // Update animation targets
      animation.controls.start(endKeyframe.value);
    }
    
    // Handle animation completion
    if (newProgress >= 100) {
      if (loop) {
        // Reset for next loop
        startTime = timestamp;
        setProgress(0);
        setCurrentKeyframeIndex(0);
        animation.controls.start(keyframes[1].value);
      } else {
        // Complete animation
        setIsPlaying(false);
        onComplete?.();
        return;
      }
    }
    
    // Continue animation
    animationFrame = requestAnimationFrame(processFrame);
  };
  
  // Start or restart the animation
  const start = () => {
    // Cancel any existing animation
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
    }
    
    // Reset state
    setIsPlaying(true);
    setIsPaused(false);
    setProgress(0);
    setCurrentKeyframeIndex(0);
    startTime = 0;
    pausedTime = 0;
    
    // Set initial keyframe
    animation.controls.stop();
    animation.controls.start(keyframes[1].value);
    
    // Start animation
    onStart?.();
    animationFrame = requestAnimationFrame(processFrame);
  };
  
  // Pause the animation
  const pause = () => {
    if (isPlaying() && !isPaused()) {
      setIsPaused(true);
      pausedTime = performance.now() - startTime;
      
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    }
  };
  
  // Resume the animation
  const resume = () => {
    if (isPlaying() && isPaused()) {
      setIsPaused(false);
      startTime = performance.now() - pausedTime;
      animationFrame = requestAnimationFrame(processFrame);
    }
  };
  
  // Seek to a specific percentage
  const seekToPercentage = (targetPercentage: number) => {
    const [newKeyframeIndex, startKeyframe, endKeyframe] = findKeyframeAtPercentage(targetPercentage);
    
    // Update state
    setProgress(targetPercentage);
    setCurrentKeyframeIndex(newKeyframeIndex);
    
    // Process keyframe transition
    animation.controls.stop();
    animation.controls.start(endKeyframe.value);
    
    // Notify about keyframe change
    onKeyframe?.(newKeyframeIndex, startKeyframe);
  };
  
  // Seek to a specific keyframe
  const seekToKeyframe = (index: number) => {
    const targetIndex = Math.max(0, Math.min(keyframes.length - 1, index));
    const targetKeyframe = keyframes[targetIndex];
    
    // Update state
    setProgress(targetKeyframe.percentage!);
    setCurrentKeyframeIndex(targetIndex);
    
    // Set animation to this keyframe
    animation.controls.stop();
    animation.controls.start(targetKeyframe.value);
    
    // Notify about keyframe change
    onKeyframe?.(targetIndex, targetKeyframe);
  };
  
  // Handle animation trigger conditions
  createEffect(() => {
    const shouldAnimate = typeof condition === 'function' 
      ? condition() 
      : typeof when === 'function' 
        ? when() 
        : false;
    
    if (shouldAnimate && !isPlaying()) {
      start();
    } else if (!shouldAnimate && isPlaying() && reverseOnExit) {
      // We should implement reverse playback here
      // For now, just stop the animation
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      
      setIsPlaying(false);
      onCancel?.();
    }
  });
  
  // Clean up animation frame on unmount
  onCleanup(() => {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  });
  
  // Create a memo for the final value
  const currentValue = createMemo(() => {
    // Return current animated value
    return animation.value();
  });
  
  // Return the animation result
  return {
    value: currentValue,
    state: animation.state,
    controls: animation.controls,
    isActive: animation.isActive,
    isReversed: animation.isReversed,
    start,
    pause,
    resume,
    seekToPercentage,
    seekToKeyframe,
    currentKeyframe: currentKeyframeIndex,
    progress
  };
}
