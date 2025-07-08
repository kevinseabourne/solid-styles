/**
 * Animation Hooks Index
 * 
 * This file exports all animation hooks and utilities
 * for easy consumption throughout the application.
 */

// Export the core animation hook and its types
export { 
  useAnimation,
  useMountAnimation,
  useUnmountAnimation,
  type AnimationConfig,
  type AnimationResult
} from './useAnimation';

// Export trigger hooks and types
export {
  useTrigger,
  useHoverTrigger,
  useFocusTrigger,
  useClickTrigger,
  useActiveTrigger,
  useInViewTrigger,
  type AnimationTrigger,
  type InViewOptions
} from './useTriggers';

// Export keyframe animation hooks and types
export {
  useKeyframeAnimation,
  type KeyframeAnimationConfig,
  type KeyframeAnimationResult
} from './useKeyframeAnimation';

// Export stagger animation utilities
export {
  useStagger,
  createStagger,
  type StaggerPattern,
  StaggerPatterns,
  type StaggerOptions
} from './useStagger';

// Export item animation utilities
export {
  useItemAnimation,
  useItemHandlers,
  useAnimatedItem,
  getItemRegistry,
  type ItemRegistry
} from './useItemAnimation';
