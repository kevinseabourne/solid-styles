/**
 * 3D Transform Animation Support
 * 
 * Animate 3D transforms with spring physics
 */

import { createSpring } from '../../utils/spring';
import { Accessor, createMemo } from 'solid-js';

export interface Transform3DConfig {
  /**
   * 3D rotation around X axis (degrees)
   */
  rotateX?: {
    from: number;
    to: number;
  };

  /**
   * 3D rotation around Y axis (degrees)
   */
  rotateY?: {
    from: number;
    to: number;
  };

  /**
   * 3D rotation around Z axis (degrees)
   */
  rotateZ?: {
    from: number;
    to: number;
  };

  /**
   * 3D rotation with axis and angle
   */
  rotate3d?: {
    from: { x: number; y: number; z: number; angle: number };
    to: { x: number; y: number; z: number; angle: number };
  };

  /**
   * 3D translation
   */
  translate3d?: {
    from: { x: number; y: number; z: number };
    to: { x: number; y: number; z: number };
  };

  /**
   * 3D scale
   */
  scale3d?: {
    from: { x: number; y: number; z: number };
    to: { x: number; y: number; z: number };
  };

  /**
   * Perspective (pixels)
   */
  perspective?: {
    from: number;
    to: number;
  };

  /**
   * Perspective origin
   */
  perspectiveOrigin?: {
    from: { x: string | number; y: string | number };
    to: { x: string | number; y: string | number };
  };

  /**
   * Transform origin
   */
  transformOrigin?: {
    from: { x: string | number; y: string | number; z?: string | number };
    to: { x: string | number; y: string | number; z?: string | number };
  };

  /**
   * Backface visibility
   */
  backfaceVisibility?: 'visible' | 'hidden';

  /**
   * Transform style
   */
  transformStyle?: 'flat' | 'preserve-3d';

  /**
   * Spring configuration
   */
  config?: {
    stiffness?: number;
    damping?: number;
    precision?: number;
  };
}

/**
 * Hook for animating 3D transforms
 */
export function use3DTransform(
  config: Transform3DConfig
): {
  transformStyles: Accessor<Record<string, string>>;
  start: () => void;
  reset: () => void;
} {
  const springConfig = {
    stiffness: config.config?.stiffness ?? 170,
    damping: config.config?.damping ?? 26,
    precision: config.config?.precision ?? 0.01,
  };

  // Create springs for each transform property
  const rotateXSpring = config.rotateX ?
    createSpring(config.rotateX.from, springConfig) : null;
  
  const rotateYSpring = config.rotateY ?
    createSpring(config.rotateY.from, springConfig) : null;
  
  const rotateZSpring = config.rotateZ ?
    createSpring(config.rotateZ.from, springConfig) : null;
  
  const rotate3dSpring = config.rotate3d ?
    createSpring(config.rotate3d.from, springConfig) : null;
  
  const translate3dSpring = config.translate3d ?
    createSpring(config.translate3d.from, springConfig) : null;
  
  const scale3dSpring = config.scale3d ?
    createSpring(config.scale3d.from, springConfig) : null;
  
  const perspectiveSpring = config.perspective ?
    createSpring(config.perspective.from, springConfig) : null;

  const transformStyles = createMemo(() => {
    const styles: Record<string, string> = {};
    const transforms: string[] = [];

    // Apply perspective (must come first in transform)
    if (perspectiveSpring) {
      const [value] = perspectiveSpring;
      transforms.push(`perspective(${value()}px)`);
    }

    // Apply 3D transforms
    if (rotateXSpring) {
      const [value] = rotateXSpring;
      transforms.push(`rotateX(${value()}deg)`);
    }

    if (rotateYSpring) {
      const [value] = rotateYSpring;
      transforms.push(`rotateY(${value()}deg)`);
    }

    if (rotateZSpring) {
      const [value] = rotateZSpring;
      transforms.push(`rotateZ(${value()}deg)`);
    }

    if (rotate3dSpring) {
      const [value] = rotate3dSpring;
      const rotation = value() as { x: number; y: number; z: number; angle: number };
      transforms.push(`rotate3d(${rotation.x}, ${rotation.y}, ${rotation.z}, ${rotation.angle}deg)`);
    }

    if (translate3dSpring) {
      const [value] = translate3dSpring;
      const translation = value() as { x: number; y: number; z: number };
      transforms.push(`translate3d(${translation.x}px, ${translation.y}px, ${translation.z}px)`);
    }

    if (scale3dSpring) {
      const [value] = scale3dSpring;
      const scale = value() as { x: number; y: number; z: number };
      transforms.push(`scale3d(${scale.x}, ${scale.y}, ${scale.z})`);
    }

    // Apply transform
    if (transforms.length > 0) {
      styles.transform = transforms.join(' ');
    }

    // Apply other 3D properties
    if (config.backfaceVisibility) {
      styles['backface-visibility'] = config.backfaceVisibility;
    }

    if (config.transformStyle) {
      styles['transform-style'] = config.transformStyle;
    }

    // Handle transform origin
    if (config.transformOrigin) {
      const origin = config.transformOrigin.to;
      const x = typeof origin.x === 'number' ? `${origin.x}px` : origin.x;
      const y = typeof origin.y === 'number' ? `${origin.y}px` : origin.y;
      const z = origin.z ? (typeof origin.z === 'number' ? `${origin.z}px` : origin.z) : '';
      styles['transform-origin'] = z ? `${x} ${y} ${z}` : `${x} ${y}`;
    }

    // Handle perspective origin
    if (config.perspectiveOrigin) {
      const origin = config.perspectiveOrigin.to;
      const x = typeof origin.x === 'number' ? `${origin.x}px` : origin.x;
      const y = typeof origin.y === 'number' ? `${origin.y}px` : origin.y;
      styles['perspective-origin'] = `${x} ${y}`;
    }

    return styles;
  });

  const start = () => {
    // Start all animations
    if (rotateXSpring && config.rotateX) {
      const [, setRotateX] = rotateXSpring;
      setRotateX(config.rotateX.to);
    }

    if (rotateYSpring && config.rotateY) {
      const [, setRotateY] = rotateYSpring;
      setRotateY(config.rotateY.to);
    }

    if (rotateZSpring && config.rotateZ) {
      const [, setRotateZ] = rotateZSpring;
      setRotateZ(config.rotateZ.to);
    }

    if (rotate3dSpring && config.rotate3d) {
      const [, setRotate3d] = rotate3dSpring;
      setRotate3d(config.rotate3d.to);
    }

    if (translate3dSpring && config.translate3d) {
      const [, setTranslate3d] = translate3dSpring;
      setTranslate3d(config.translate3d.to);
    }

    if (scale3dSpring && config.scale3d) {
      const [, setScale3d] = scale3dSpring;
      setScale3d(config.scale3d.to);
    }

    if (perspectiveSpring && config.perspective) {
      const [, setPerspective] = perspectiveSpring;
      setPerspective(config.perspective.to);
    }
  };

  const reset = () => {
    // Reset all animations
    if (rotateXSpring && config.rotateX) {
      const [, setRotateX] = rotateXSpring;
      setRotateX(config.rotateX.from);
    }

    if (rotateYSpring && config.rotateY) {
      const [, setRotateY] = rotateYSpring;
      setRotateY(config.rotateY.from);
    }

    if (rotateZSpring && config.rotateZ) {
      const [, setRotateZ] = rotateZSpring;
      setRotateZ(config.rotateZ.from);
    }

    if (rotate3dSpring && config.rotate3d) {
      const [, setRotate3d] = rotate3dSpring;
      setRotate3d(config.rotate3d.from);
    }

    if (translate3dSpring && config.translate3d) {
      const [, setTranslate3d] = translate3dSpring;
      setTranslate3d(config.translate3d.from);
    }

    if (scale3dSpring && config.scale3d) {
      const [, setScale3d] = scale3dSpring;
      setScale3d(config.scale3d.from);
    }

    if (perspectiveSpring && config.perspective) {
      const [, setPerspective] = perspectiveSpring;
      setPerspective(config.perspective.from);
    }
  };

  return {
    transformStyles,
    start,
    reset,
  };
}

/**
 * Cube rotation animation
 */
export function useCubeRotation(
  config?: {
    duration?: number;
    stiffness?: number;
    damping?: number;
  }
): {
  faceStyles: (face: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom') => Accessor<Record<string, string>>;
  containerStyles: Accessor<Record<string, string>>;
  rotate: () => void;
  reset: () => void;
} {
  const [rotation, setRotation] = createSpring(
    { x: 0, y: 0 },
    {
      stiffness: config?.stiffness ?? 50,
      damping: config?.damping ?? 20,
    }
  );

  const containerStyles = createMemo(() => {
    const rot = rotation() as { x: number; y: number };
    return {
      'transform-style': 'preserve-3d',
      'transform': `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
      'width': '200px',
      'height': '200px',
      'position': 'relative',
    };
  });

  const faceStyles = (face: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom') => {
    return createMemo(() => {
      const baseStyles: Record<string, string> = {
        'position': 'absolute',
        'width': '200px',
        'height': '200px',
        'backface-visibility': 'hidden',
      };

      const transforms: Record<string, string> = {
        'front': 'translateZ(100px)',
        'back': 'rotateY(180deg) translateZ(100px)',
        'left': 'rotateY(-90deg) translateZ(100px)',
        'right': 'rotateY(90deg) translateZ(100px)',
        'top': 'rotateX(90deg) translateZ(100px)',
        'bottom': 'rotateX(-90deg) translateZ(100px)',
      };

      return {
        ...baseStyles,
        'transform': transforms[face],
      };
    });
  };

  const rotate = () => {
    setRotation({ x: -20, y: 45 });
  };

  const reset = () => {
    setRotation({ x: 0, y: 0 });
  };

  return {
    faceStyles,
    containerStyles,
    rotate,
    reset,
  };
}

/**
 * Card flip animation
 */
export function useCardFlip(
  config?: {
    axis?: 'x' | 'y';
    stiffness?: number;
    damping?: number;
  }
): {
  frontStyles: Accessor<Record<string, string>>;
  backStyles: Accessor<Record<string, string>>;
  containerStyles: Accessor<Record<string, string>>;
  flip: () => void;
  reset: () => void;
  isFlipped: Accessor<boolean>;
} {
  const axis = config?.axis ?? 'y';
  const [rotation, setRotation] = createSpring(0, {
    stiffness: config?.stiffness ?? 170,
    damping: config?.damping ?? 26,
  });

  const isFlipped = createMemo(() => {
    const rot = rotation() as number;
    return Math.abs(rot) > 90;
  });

  const containerStyles = createMemo(() => ({
    'transform-style': 'preserve-3d',
    'perspective': '1000px',
    'position': 'relative',
  }));

  const frontStyles = createMemo(() => {
    const rot = rotation() as number;
    return {
      'position': 'absolute',
      'width': '100%',
      'height': '100%',
      'backface-visibility': 'hidden',
      'transform': axis === 'y' ? `rotateY(${rot}deg)` : `rotateX(${rot}deg)`,
    };
  });

  const backStyles = createMemo(() => {
    const rot = rotation() as number;
    const baseRotation = axis === 'y' ? 180 : -180;
    return {
      'position': 'absolute',
      'width': '100%',
      'height': '100%',
      'backface-visibility': 'hidden',
      'transform': axis === 'y' 
        ? `rotateY(${baseRotation + rot}deg)` 
        : `rotateX(${baseRotation + rot}deg)`,
    };
  });

  const flip = () => {
    const current = rotation() as number;
    setRotation(current === 0 ? 180 : 0);
  };

  const reset = () => {
    setRotation(0);
  };

  return {
    frontStyles,
    backStyles,
    containerStyles,
    flip,
    reset,
    isFlipped,
  };
} 