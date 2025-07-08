/**
 * Advanced Animation Features
 * 
 * Export all advanced animation capabilities with spring physics
 */

// CSS Grid Animations
export {
  useGridAnimation,
  useGridItemAnimation,
  type GridAnimationConfig,
  type GridItemAnimationConfig,
} from './grid-animations';

// SVG Animations
export {
  useSVGPathAnimation,
  useSVGStrokeAnimation,
  useSVGViewBoxAnimation,
  useSVGDrawAnimation,
  useSVGShapeMorph,
  type SVGPathAnimationConfig,
  type SVGStrokeAnimationConfig,
  type SVGViewBoxAnimationConfig,
  type SVGShapeMorphConfig,
  type SVGPathCommand,
} from './svg-animations';

// 3D Transform Animations
export {
  use3DTransform,
  useCubeRotation,
  useCardFlip,
  type Transform3DConfig,
} from './transforms-3d';

// Gesture Support
export {
  useGestures,
  useSwipeable,
  type GestureConfig,
} from './gesture-support';

// Re-export spring utilities for convenience
export { createSpring } from '../../utils/spring'; 