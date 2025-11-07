/**
 * Layout Animation Engine
 * 
 * Provides Framer Motion-like layout animations that automatically animate
 * size and position changes when elements change due to state updates.
 */

import { createEffect, onCleanup, Accessor, createSignal } from "solid-js";
import { createSpring, SpringConfig } from "../utils/spring";

/**
 * Configuration for layout animations
 */
export interface LayoutTransitionConfig extends SpringConfig {
  /**
   * Whether to animate width changes
   * @default true
   */
  animateWidth?: boolean;
  
  /**
   * Whether to animate height changes
   * @default true
   */
  animateHeight?: boolean;
  
  /**
   * Whether to animate position changes (x, y)
   * @default true
   */
  animatePosition?: boolean;
  
  /**
   * Whether to use transform for position animations (more performant)
   * @default true
   */
  useTransform?: boolean;
  
  /**
   * Callback when layout animation starts
   */
  onLayoutAnimationStart?: (element: HTMLElement) => void;
  
  /**
   * Callback when layout animation completes
   */
  onLayoutAnimationComplete?: (element: HTMLElement) => void;
}

/**
 * Represents the measured dimensions and position of an element
 */
interface LayoutSnapshot {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Default layout transition configuration
 */
const DEFAULT_LAYOUT_CONFIG: Required<LayoutTransitionConfig> = {
  stiffness: 300,
  damping: 30,
  precision: 0.01,
  animateWidth: true,
  animateHeight: true,
  animatePosition: true,
  useTransform: true,
  onLayoutAnimationStart: () => {},
  onLayoutAnimationComplete: () => {},
};

/**
 * Layout Animation Engine
 * 
 * Tracks element size and position changes and animates them using springs.
 * Uses ResizeObserver for size changes and requestAnimationFrame for position tracking.
 */
export class LayoutAnimationEngine {
  private element: HTMLElement;
  private config: Required<LayoutTransitionConfig>;
  private previousSnapshot: LayoutSnapshot | null = null;
  private currentSnapshot: LayoutSnapshot | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private rafId: number | null = null;
  private isAnimating = false;
  
  // Spring animations for each dimension
  private widthSpring: ReturnType<typeof createSpring<number>> | null = null;
  private heightSpring: ReturnType<typeof createSpring<number>> | null = null;
  private xSpring: ReturnType<typeof createSpring<number>> | null = null;
  private ySpring: ReturnType<typeof createSpring<number>> | null = null;
  
  constructor(element: HTMLElement, config: LayoutTransitionConfig = {}) {
    this.element = element;
    this.config = { ...DEFAULT_LAYOUT_CONFIG, ...config };
    
    // Initialize springs
    this.initSprings();
    
    // Take initial snapshot
    this.currentSnapshot = this.measureElement();
    this.previousSnapshot = { ...this.currentSnapshot };
    
    // Set up observers
    this.setupObservers();
  }
  
  /**
   * Initialize spring animations for each dimension
   */
  private initSprings(): void {
    const springConfig = {
      stiffness: this.config.stiffness,
      damping: this.config.damping,
      precision: this.config.precision,
    };
    
    if (this.config.animateWidth) {
      this.widthSpring = createSpring(0, springConfig);
    }
    
    if (this.config.animateHeight) {
      this.heightSpring = createSpring(0, springConfig);
    }
    
    if (this.config.animatePosition) {
      this.xSpring = createSpring(0, springConfig);
      this.ySpring = createSpring(0, springConfig);
    }
  }
  
  /**
   * Measure the current dimensions and position of the element
   */
  private measureElement(): LayoutSnapshot {
    const rect = this.element.getBoundingClientRect();
    return {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height,
    };
  }
  
  /**
   * Set up ResizeObserver and position tracking
   */
  private setupObservers(): void {
    // ResizeObserver for size changes
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this.element) {
          this.handleLayoutChange();
        }
      }
    });
    
    this.resizeObserver.observe(this.element);
    
    // Position tracking via RAF
    this.startPositionTracking();
  }
  
  /**
   * Start tracking position changes
   */
  private startPositionTracking(): void {
    const checkPosition = () => {
      if (!this.isAnimating) {
        const newSnapshot = this.measureElement();
        
        // Check if position changed
        if (
          this.currentSnapshot &&
          (Math.abs(newSnapshot.x - this.currentSnapshot.x) > 0.5 ||
           Math.abs(newSnapshot.y - this.currentSnapshot.y) > 0.5)
        ) {
          this.handleLayoutChange();
        }
      }
      
      this.rafId = requestAnimationFrame(checkPosition);
    };
    
    this.rafId = requestAnimationFrame(checkPosition);
  }
  
  /**
   * Handle layout changes and trigger animations
   */
  private handleLayoutChange(): void {
    if (this.isAnimating) return;
    
    this.previousSnapshot = this.currentSnapshot;
    this.currentSnapshot = this.measureElement();
    
    if (!this.previousSnapshot) return;
    
    const hasChanged = 
      Math.abs(this.currentSnapshot.width - this.previousSnapshot.width) > 0.5 ||
      Math.abs(this.currentSnapshot.height - this.previousSnapshot.height) > 0.5 ||
      Math.abs(this.currentSnapshot.x - this.previousSnapshot.x) > 0.5 ||
      Math.abs(this.currentSnapshot.y - this.previousSnapshot.y) > 0.5;
    
    if (hasChanged) {
      this.animateLayout();
    }
  }
  
  /**
   * Animate the layout change using springs
   */
  private async animateLayout(): Promise<void> {
    if (!this.previousSnapshot || !this.currentSnapshot) return;
    
    this.isAnimating = true;
    this.config.onLayoutAnimationStart(this.element);
    
    const promises: Promise<void>[] = [];
    
    // Animate width
    if (
      this.config.animateWidth &&
      this.widthSpring &&
      Math.abs(this.currentSnapshot.width - this.previousSnapshot.width) > 0.5
    ) {
      const [width, setWidth] = this.widthSpring;
      setWidth(this.previousSnapshot.width, { hard: true });
      promises.push(setWidth(this.currentSnapshot.width));
      
      // Apply width animation
      createEffect(() => {
        if (this.element) {
          this.element.style.width = `${width()}px`;
        }
      });
    }
    
    // Animate height
    if (
      this.config.animateHeight &&
      this.heightSpring &&
      Math.abs(this.currentSnapshot.height - this.previousSnapshot.height) > 0.5
    ) {
      const [height, setHeight] = this.heightSpring;
      setHeight(this.previousSnapshot.height, { hard: true });
      promises.push(setHeight(this.currentSnapshot.height));
      
      // Apply height animation
      createEffect(() => {
        if (this.element) {
          this.element.style.height = `${height()}px`;
        }
      });
    }
    
    // Animate position
    if (
      this.config.animatePosition &&
      this.xSpring &&
      this.ySpring &&
      (Math.abs(this.currentSnapshot.x - this.previousSnapshot.x) > 0.5 ||
       Math.abs(this.currentSnapshot.y - this.previousSnapshot.y) > 0.5)
    ) {
      const [x, setX] = this.xSpring;
      const [y, setY] = this.ySpring;
      
      const deltaX = this.currentSnapshot.x - this.previousSnapshot.x;
      const deltaY = this.currentSnapshot.y - this.previousSnapshot.y;
      
      setX(deltaX, { hard: true });
      setY(deltaY, { hard: true });
      
      promises.push(setX(0));
      promises.push(setY(0));
      
      // Apply position animation using transform
      createEffect(() => {
        if (this.element && this.config.useTransform) {
          const currentX = x();
          const currentY = y();
          this.element.style.transform = `translate(${-currentX}px, ${-currentY}px)`;
        }
      });
    }
    
    // Wait for all animations to complete
    await Promise.all(promises);
    
    // Clean up inline styles after animation
    if (this.element) {
      if (this.config.animateWidth) {
        this.element.style.width = '';
      }
      if (this.config.animateHeight) {
        this.element.style.height = '';
      }
      if (this.config.useTransform) {
        this.element.style.transform = '';
      }
    }
    
    this.isAnimating = false;
    this.config.onLayoutAnimationComplete(this.element);
  }
  
  /**
   * Update the configuration
   */
  public updateConfig(config: Partial<LayoutTransitionConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Clean up observers and animations
   */
  public destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    // Clean up any active animations
    this.isAnimating = false;
    
    // Clear inline styles
    if (this.element) {
      this.element.style.width = '';
      this.element.style.height = '';
      this.element.style.transform = '';
    }
  }
}

/**
 * Create a layout animation engine for an element
 * 
 * @param element The element to animate
 * @param config Layout transition configuration
 * @returns Layout animation engine instance
 */
export function createLayoutAnimation(
  element: Accessor<HTMLElement | undefined>,
  config: LayoutTransitionConfig = {}
): LayoutAnimationEngine | null {
  let engine: LayoutAnimationEngine | null = null;
  
  createEffect(() => {
    const el = element();
    
    if (el && !engine) {
      engine = new LayoutAnimationEngine(el, config);
    }
  });
  
  onCleanup(() => {
    if (engine) {
      engine.destroy();
      engine = null;
    }
  });
  
  return engine;
}

/**
 * Hook for adding layout animations to any element
 * 
 * @param config Layout transition configuration
 * @returns Ref function to attach to element
 * 
 * @example
 * ```tsx
 * const Box = () => {
 *   const [expanded, setExpanded] = createSignal(false);
 *   const layoutRef = useLayoutAnimation({ stiffness: 400, damping: 30 });
 *   
 *   return (
 *     <div ref={layoutRef}>
 *       <button onClick={() => setExpanded(!expanded())}>Toggle</button>
 *       {expanded() && <div>Extra content</div>}
 *     </div>
 *   );
 * };
 * ```
 */
export function useLayoutAnimation(config: LayoutTransitionConfig = {}) {
  const [element, setElement] = createSignal<HTMLElement | undefined>();
  
  createLayoutAnimation(element, config);
  
  return setElement;
}
