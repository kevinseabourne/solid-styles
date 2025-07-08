/**
 * SVG Animation Support
 * 
 * Animate SVG properties and paths with spring physics
 */

import { createSpring, SpringTarget, WidenSpringTarget } from '../../utils/spring';
import { Accessor, createEffect, createMemo } from 'solid-js';

export interface SVGPathCommand {
  type: 'M' | 'L' | 'C' | 'Q' | 'A' | 'Z';
  values: number[];
}

/**
 * Parse SVG path string into commands
 */
function parsePath(pathStr: string): SVGPathCommand[] {
  const commands: SVGPathCommand[] = [];
  const regex = /([MLCQAZ])([^MLCQAZ]*)/gi;
  let match;

  while ((match = regex.exec(pathStr)) !== null) {
    const type = match[1].toUpperCase() as SVGPathCommand['type'];
    const values = match[2].trim()
      .split(/[\s,]+/)
      .filter(v => v.length > 0)
      .map(parseFloat);
    
    commands.push({ type, values });
  }

  return commands;
}

/**
 * Convert path commands back to string
 */
function commandsToPath(commands: SVGPathCommand[]): string {
  return commands
    .map(cmd => `${cmd.type}${cmd.values.join(' ')}`)
    .join(' ');
}

/**
 * Normalize two paths to have the same structure
 */
function normalizePaths(fromPath: SVGPathCommand[], toPath: SVGPathCommand[]): {
  from: SVGPathCommand[];
  to: SVGPathCommand[];
} {
  // Simple normalization - ensure same number of commands
  const maxLength = Math.max(fromPath.length, toPath.length);
  const normalizedFrom = [...fromPath];
  const normalizedTo = [...toPath];

  // Pad shorter path with duplicate last command
  while (normalizedFrom.length < maxLength) {
    normalizedFrom.push({ ...normalizedFrom[normalizedFrom.length - 1] });
  }
  while (normalizedTo.length < maxLength) {
    normalizedTo.push({ ...normalizedTo[normalizedTo.length - 1] });
  }

  return { from: normalizedFrom, to: normalizedTo };
}

export interface SVGPathAnimationConfig {
  /**
   * Starting path
   */
  from: string;

  /**
   * Target path
   */
  to: string;

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
 * Hook for animating SVG paths
 */
export function useSVGPathAnimation(
  config: SVGPathAnimationConfig
): {
  path: Accessor<string>;
  start: () => void;
  reset: () => void;
} {
  const fromCommands = parsePath(config.from);
  const toCommands = parsePath(config.to);
  const { from: normalizedFrom, to: normalizedTo } = normalizePaths(fromCommands, toCommands);

  // Create a single spring for all path values
  const allFromValues = normalizedFrom.flatMap(cmd => cmd.values);
  const allToValues = normalizedTo.flatMap(cmd => cmd.values);

  const [pathValues, setPathValues] = createSpring(allFromValues, {
    stiffness: config.config?.stiffness ?? 170,
    damping: config.config?.damping ?? 26,
    precision: config.config?.precision ?? 0.01,
  });

  const path = createMemo(() => {
    const currentValues = pathValues() as number[];
    let valueIndex = 0;
    
    const animatedCommands = normalizedFrom.map((cmd, i) => {
      const valueCount = cmd.values.length;
      const animatedValues = currentValues.slice(valueIndex, valueIndex + valueCount);
      valueIndex += valueCount;
      
      return {
        type: cmd.type,
        values: animatedValues,
      };
    });

    return commandsToPath(animatedCommands);
  });

  const start = () => {
    setPathValues(allToValues);
  };

  const reset = () => {
    setPathValues(allFromValues);
  };

  return {
    path,
    start,
    reset,
  };
}

export interface SVGStrokeAnimationConfig {
  /**
   * Stroke dasharray animation
   */
  dashArray?: {
    from: number[];
    to: number[];
  };

  /**
   * Stroke dashoffset animation
   */
  dashOffset?: {
    from: number;
    to: number;
  };

  /**
   * Stroke width animation
   */
  strokeWidth?: {
    from: number;
    to: number;
  };

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
 * Hook for animating SVG stroke properties
 */
export function useSVGStrokeAnimation(
  config: SVGStrokeAnimationConfig
): {
  strokeStyles: Accessor<Record<string, string>>;
  start: () => void;
  reset: () => void;
} {
  const springConfig = {
    stiffness: config.config?.stiffness ?? 170,
    damping: config.config?.damping ?? 26,
    precision: config.config?.precision ?? 0.01,
  };

  // Create springs for each property
  const dashArraySpring = config.dashArray ?
    createSpring(config.dashArray.from, springConfig) : null;
  
  const dashOffsetSpring = config.dashOffset ?
    createSpring(config.dashOffset.from, springConfig) : null;
  
  const strokeWidthSpring = config.strokeWidth ?
    createSpring(config.strokeWidth.from, springConfig) : null;

  const strokeStyles = createMemo(() => {
    const styles: Record<string, string> = {};

    if (dashArraySpring) {
      const [values] = dashArraySpring;
      const dashArray = values() as number[];
      styles['stroke-dasharray'] = dashArray.join(' ');
    }

    if (dashOffsetSpring) {
      const [value] = dashOffsetSpring;
      styles['stroke-dashoffset'] = String(value());
    }

    if (strokeWidthSpring) {
      const [value] = strokeWidthSpring;
      styles['stroke-width'] = String(value());
    }

    return styles;
  });

  const start = () => {
    if (dashArraySpring && config.dashArray) {
      const [, setDashArray] = dashArraySpring;
      setDashArray(config.dashArray.to);
    }

    if (dashOffsetSpring && config.dashOffset) {
      const [, setDashOffset] = dashOffsetSpring;
      setDashOffset(config.dashOffset.to);
    }

    if (strokeWidthSpring && config.strokeWidth) {
      const [, setStrokeWidth] = strokeWidthSpring;
      setStrokeWidth(config.strokeWidth.to);
    }
  };

  const reset = () => {
    if (dashArraySpring && config.dashArray) {
      const [, setDashArray] = dashArraySpring;
      setDashArray(config.dashArray.from);
    }

    if (dashOffsetSpring && config.dashOffset) {
      const [, setDashOffset] = dashOffsetSpring;
      setDashOffset(config.dashOffset.from);
    }

    if (strokeWidthSpring && config.strokeWidth) {
      const [, setStrokeWidth] = strokeWidthSpring;
      setStrokeWidth(config.strokeWidth.from);
    }
  };

  return {
    strokeStyles,
    start,
    reset,
  };
}

export interface SVGViewBoxAnimationConfig {
  /**
   * Starting viewBox
   */
  from: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  /**
   * Target viewBox
   */
  to: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

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
 * Hook for animating SVG viewBox
 */
export function useSVGViewBoxAnimation(
  config: SVGViewBoxAnimationConfig
): {
  viewBox: Accessor<string>;
  start: () => void;
  reset: () => void;
} {
  const [viewBoxValues, setViewBoxValues] = createSpring(config.from, {
    stiffness: config.config?.stiffness ?? 170,
    damping: config.config?.damping ?? 26,
    precision: config.config?.precision ?? 0.01,
  });

  const viewBox = createMemo(() => {
    const values = viewBoxValues() as typeof config.from;
    return `${values.x} ${values.y} ${values.width} ${values.height}`;
  });

  const start = () => {
    setViewBoxValues(config.to);
  };

  const reset = () => {
    setViewBoxValues(config.from);
  };

  return {
    viewBox,
    start,
    reset,
  };
}

/**
 * Draw-on animation for SVG paths
 */
export function useSVGDrawAnimation(
  pathElement: Accessor<SVGPathElement | null>
): {
  strokeStyles: Accessor<Record<string, string>>;
  draw: () => void;
  erase: () => void;
} {
  const [progress, setProgress] = createSpring(0, {
    stiffness: 50,
    damping: 20,
    precision: 0.001,
  });

  const strokeStyles = createMemo((): Record<string, string> => {
    const el = pathElement();
    if (!el) return {};

    const length = el.getTotalLength();
    const currentProgress = progress() as number;
    const offset = length * (1 - currentProgress);

    return {
      'stroke-dasharray': String(length),
      'stroke-dashoffset': String(offset),
    };
  });

  const draw = () => {
    setProgress(1);
  };

  const erase = () => {
    setProgress(0);
  };

  return {
    strokeStyles,
    draw,
    erase,
  };
}

/**
 * Morph between different SVG shapes
 */
export interface SVGShapeMorphConfig {
  /**
   * Starting shape type and properties
   */
  from: {
    type: 'circle' | 'rect' | 'ellipse' | 'polygon';
    props: Record<string, number | number[]>;
  };

  /**
   * Target shape type and properties
   */
  to: {
    type: 'circle' | 'rect' | 'ellipse' | 'polygon';
    props: Record<string, number | number[]>;
  };

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
 * Convert shape to path for morphing
 */
function shapeToPath(shape: SVGShapeMorphConfig['from']): string {
  switch (shape.type) {
    case 'circle': {
      const cx = shape.props.cx as number || 0;
      const cy = shape.props.cy as number || 0;
      const r = shape.props.r as number || 0;
      return `M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy} A ${r} ${r} 0 0 0 ${cx - r} ${cy}`;
    }
    case 'rect': {
      const x = shape.props.x as number || 0;
      const y = shape.props.y as number || 0;
      const width = shape.props.width as number || 0;
      const height = shape.props.height as number || 0;
      return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
    }
    case 'ellipse': {
      const cx = shape.props.cx as number || 0;
      const cy = shape.props.cy as number || 0;
      const rx = shape.props.rx as number || 0;
      const ry = shape.props.ry as number || 0;
      return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 0 0 ${cx - rx} ${cy}`;
    }
    case 'polygon': {
      const points = shape.props.points as number[] || [];
      const pointPairs: number[][] = [];
      for (let i = 0; i < points.length; i += 2) {
        pointPairs.push([points[i], points[i + 1]]);
      }
      return pointPairs.map((p, i) => 
        i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`
      ).join(' ') + ' Z';
    }
  }
}

/**
 * Hook for morphing between SVG shapes
 */
export function useSVGShapeMorph(
  config: SVGShapeMorphConfig
): {
  path: Accessor<string>;
  start: () => void;
  reset: () => void;
} {
  const fromPath = shapeToPath(config.from);
  const toPath = shapeToPath(config.to);

  return useSVGPathAnimation({
    from: fromPath,
    to: toPath,
    config: config.config,
  });
} 