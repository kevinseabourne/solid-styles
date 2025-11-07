/**
 * Animation System Index
 * 
 * This is the main entry point for the animation system,
 * exporting all components, hooks, and utilities.
 */

// Export animated component factory and types
export { 
  animated,
  default as AnimatedComponents,
  variants,
  type AnimateConfig,
  type AnimatedProps
} from './animatedStyled';

// Export all animation hooks
export * from './hooks';

// Export spring bridge utilities
export {
  createAnimation,
  createToggleAnimation,
  type AnimationOptions,
  type AnimationControls,
  type AnimationState
} from './spring-bridge';

// Export advanced animation features
export * from './advanced';

// Export layout animation features
export {
  LayoutAnimationEngine,
  createLayoutAnimation,
  useLayoutAnimation,
  type LayoutTransitionConfig
} from './layout-engine';

export {
  LayoutAnimated,
  LayoutTransitionProvider,
  layoutAnimation,
  type LayoutAnimatedProps
} from './layout-components';
