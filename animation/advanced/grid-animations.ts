/**
 * CSS Grid Animation Support
 * 
 * Animate CSS Grid properties with spring physics
 */

import { createSpring, SpringTarget, WidenSpringTarget } from '../../utils/spring';
import { Accessor, createEffect } from 'solid-js';

export interface GridAnimationConfig {
  /**
   * Grid template columns animation
   */
  columns?: {
    from: string | string[];
    to: string | string[];
  };

  /**
   * Grid template rows animation
   */
  rows?: {
    from: string | string[];
    to: string | string[];
  };

  /**
   * Grid gap animation
   */
  gap?: {
    from: number | { row: number; column: number };
    to: number | { row: number; column: number };
  };

  /**
   * Grid area animations for children
   */
  areas?: {
    from: string;
    to: string;
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
 * Parse grid template string into numerical values
 */
function parseGridTemplate(template: string | string[]): number[] {
  if (Array.isArray(template)) {
    return template.map(val => {
      const match = val.match(/(\d+(?:\.\d+)?)(px|fr|%|em|rem|vh|vw)/);
      return match ? parseFloat(match[1]) : 1;
    });
  }
  
  const parts = template.split(/\s+/);
  return parts.map(part => {
    const match = part.match(/(\d+(?:\.\d+)?)(px|fr|%|em|rem|vh|vw)/);
    return match ? parseFloat(match[1]) : 1;
  });
}

/**
 * Get units from grid template
 */
function getGridUnits(template: string | string[]): string[] {
  if (Array.isArray(template)) {
    return template.map(val => {
      const match = val.match(/\d+(?:\.\d+)?(px|fr|%|em|rem|vh|vw)/);
      return match ? match[1] : 'fr';
    });
  }
  
  const parts = template.split(/\s+/);
  return parts.map(part => {
    const match = part.match(/\d+(?:\.\d+)?(px|fr|%|em|rem|vh|vw)/);
    return match ? match[1] : 'fr';
  });
}

/**
 * Interpolate grid template values
 */
function interpolateGridTemplate(
  fromValues: number[],
  toValues: number[],
  progress: number[],
  units: string[]
): string {
  const interpolated = fromValues.map((from, i) => {
    const to = toValues[i] || from;
    const p = progress[i] || 0;
    const value = from + (to - from) * p;
    const unit = units[i] || 'fr';
    return `${value}${unit}`;
  });
  
  return interpolated.join(' ');
}

/**
 * Hook for animating CSS Grid properties
 */
export function useGridAnimation(
  config: GridAnimationConfig
): {
  gridStyles: Accessor<Record<string, string>>;
  start: () => void;
  reset: () => void;
} {
  const springConfig = {
    stiffness: config.config?.stiffness ?? 170,
    damping: config.config?.damping ?? 26,
    precision: config.config?.precision ?? 0.01,
  };

  // Create springs for each property
  const columnSpring = config.columns ? 
    createSpring(parseGridTemplate(config.columns.from), springConfig) : null;
  
  const rowSpring = config.rows ? 
    createSpring(parseGridTemplate(config.rows.from), springConfig) : null;
  
  const gapSpring = config.gap ? 
    createSpring(
      typeof config.gap.from === 'number' 
        ? { row: config.gap.from, column: config.gap.from }
        : config.gap.from,
      springConfig
    ) : null;

  // Get units for templates
  const columnUnits = config.columns ? getGridUnits(config.columns.from) : [];
  const rowUnits = config.rows ? getGridUnits(config.rows.from) : [];

  const gridStyles: Accessor<Record<string, string>> = () => {
    const styles: Record<string, string> = {
      display: 'grid',
    };

    // Apply animated grid template columns
    if (columnSpring && config.columns) {
      const [values] = columnSpring;
      const currentValues = values() as number[];
      const toValues = parseGridTemplate(config.columns.to);
      
      // Calculate progress for each value
      const fromValues = parseGridTemplate(config.columns.from);
      const progress = currentValues.map((current, i) => {
        const from = fromValues[i] || 0;
        const to = toValues[i] || from;
        return to === from ? 1 : (current - from) / (to - from);
      });

      styles['grid-template-columns'] = interpolateGridTemplate(
        fromValues,
        toValues,
        progress,
        columnUnits
      );
    }

    // Apply animated grid template rows
    if (rowSpring && config.rows) {
      const [values] = rowSpring;
      const currentValues = values() as number[];
      const toValues = parseGridTemplate(config.rows.to);
      
      const fromValues = parseGridTemplate(config.rows.from);
      const progress = currentValues.map((current, i) => {
        const from = fromValues[i] || 0;
        const to = toValues[i] || from;
        return to === from ? 1 : (current - from) / (to - from);
      });

      styles['grid-template-rows'] = interpolateGridTemplate(
        fromValues,
        toValues,
        progress,
        rowUnits
      );
    }

    // Apply animated gap
    if (gapSpring && config.gap) {
      const [gapValue] = gapSpring;
      const gap = gapValue() as { row: number; column: number };
      styles['grid-gap'] = `${gap.row}px ${gap.column}px`;
    }

    // Apply grid areas if specified
    if (config.areas) {
      styles['grid-template-areas'] = config.areas.to;
    }

    return styles;
  };

  const start = () => {
    // Start column animation
    if (columnSpring && config.columns) {
      const [, setColumns] = columnSpring;
      setColumns(parseGridTemplate(config.columns.to));
    }

    // Start row animation
    if (rowSpring && config.rows) {
      const [, setRows] = rowSpring;
      setRows(parseGridTemplate(config.rows.to));
    }

    // Start gap animation
    if (gapSpring && config.gap) {
      const [, setGap] = gapSpring;
      const target = typeof config.gap.to === 'number' 
        ? { row: config.gap.to, column: config.gap.to }
        : config.gap.to;
      setGap(target);
    }
  };

  const reset = () => {
    // Reset to initial values
    if (columnSpring && config.columns) {
      const [, setColumns] = columnSpring;
      setColumns(parseGridTemplate(config.columns.from));
    }

    if (rowSpring && config.rows) {
      const [, setRows] = rowSpring;
      setRows(parseGridTemplate(config.rows.from));
    }

    if (gapSpring && config.gap) {
      const [, setGap] = gapSpring;
      const initial = typeof config.gap.from === 'number' 
        ? { row: config.gap.from, column: config.gap.from }
        : config.gap.from;
      setGap(initial);
    }
  };

  return {
    gridStyles,
    start,
    reset,
  };
}

/**
 * Grid item animation for individual grid children
 */
export interface GridItemAnimationConfig {
  /**
   * Grid column animation
   */
  column?: {
    from: number | { start: number; end: number };
    to: number | { start: number; end: number };
  };

  /**
   * Grid row animation
   */
  row?: {
    from: number | { start: number; end: number };
    to: number | { start: number; end: number };
  };

  /**
   * Grid area animation
   */
  area?: {
    from: string;
    to: string;
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
 * Hook for animating individual grid items
 */
export function useGridItemAnimation(
  config: GridItemAnimationConfig
): {
  itemStyles: Accessor<Record<string, string>>;
  start: () => void;
  reset: () => void;
} {
  const springConfig = {
    stiffness: config.config?.stiffness ?? 170,
    damping: config.config?.damping ?? 26,
    precision: config.config?.precision ?? 0.01,
  };

  // Create springs for grid positioning
  const columnSpring = config.column ? 
    createSpring(
      typeof config.column.from === 'number' 
        ? { start: config.column.from, end: config.column.from + 1 }
        : config.column.from,
      springConfig
    ) : null;
  
  const rowSpring = config.row ? 
    createSpring(
      typeof config.row.from === 'number' 
        ? { start: config.row.from, end: config.row.from + 1 }
        : config.row.from,
      springConfig
    ) : null;

  const itemStyles: Accessor<Record<string, string>> = () => {
    const styles: Record<string, string> = {};

    // Apply animated grid column
    if (columnSpring) {
      const [value] = columnSpring;
      const pos = value() as { start: number; end: number };
      styles['grid-column'] = `${Math.round(pos.start)} / ${Math.round(pos.end)}`;
    }

    // Apply animated grid row
    if (rowSpring) {
      const [value] = rowSpring;
      const pos = value() as { start: number; end: number };
      styles['grid-row'] = `${Math.round(pos.start)} / ${Math.round(pos.end)}`;
    }

    // Apply grid area if specified
    if (config.area) {
      styles['grid-area'] = config.area.to;
    }

    return styles;
  };

  const start = () => {
    // Start column animation
    if (columnSpring && config.column) {
      const [, setColumn] = columnSpring;
      const target = typeof config.column.to === 'number' 
        ? { start: config.column.to, end: config.column.to + 1 }
        : config.column.to;
      setColumn(target);
    }

    // Start row animation
    if (rowSpring && config.row) {
      const [, setRow] = rowSpring;
      const target = typeof config.row.to === 'number' 
        ? { start: config.row.to, end: config.row.to + 1 }
        : config.row.to;
      setRow(target);
    }
  };

  const reset = () => {
    // Reset to initial values
    if (columnSpring && config.column) {
      const [, setColumn] = columnSpring;
      const initial = typeof config.column.from === 'number' 
        ? { start: config.column.from, end: config.column.from + 1 }
        : config.column.from;
      setColumn(initial);
    }

    if (rowSpring && config.row) {
      const [, setRow] = rowSpring;
      const initial = typeof config.row.from === 'number' 
        ? { start: config.row.from, end: config.row.from + 1 }
        : config.row.from;
      setRow(initial);
    }
  };

  return {
    itemStyles,
    start,
    reset,
  };
} 