/**
 * Gesture Support with Spring Animations
 * 
 * Handle touch, swipe, pinch, and drag gestures with spring physics
 */

import { createSpring } from '../../utils/spring';
import { Accessor, createSignal, createEffect, onCleanup, createMemo } from 'solid-js';

export interface GestureConfig {
  /**
   * Enable specific gestures
   */
  gestures?: {
    drag?: boolean;
    swipe?: boolean;
    pinch?: boolean;
    rotate?: boolean;
  };

  /**
   * Drag configuration
   */
  drag?: {
    axis?: 'x' | 'y' | 'both';
    bounds?: {
      left?: number;
      right?: number;
      top?: number;
      bottom?: number;
    };
    snapPoints?: Array<{ x: number; y: number }>;
  };

  /**
   * Swipe configuration
   */
  swipe?: {
    threshold?: number;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
  };

  /**
   * Pinch configuration
   */
  pinch?: {
    minScale?: number;
    maxScale?: number;
    onPinch?: (scale: number) => void;
  };

  /**
   * Spring configuration
   */
  spring?: {
    stiffness?: number;
    damping?: number;
    precision?: number;
  };
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  velocity: { x: number; y: number };
}

interface PinchState {
  initialDistance: number;
  currentDistance: number;
  scale: number;
}

/**
 * Hook for gesture support with spring animations
 */
export function useGestures(
  element: Accessor<HTMLElement | undefined>,
  config: GestureConfig = {}
): {
  transformStyles: Accessor<Record<string, string>>;
  isDragging: Accessor<boolean>;
  isPinching: Accessor<boolean>;
} {
  const springConfig = {
    stiffness: config.spring?.stiffness ?? 170,
    damping: config.spring?.damping ?? 26,
    precision: config.spring?.precision ?? 0.01,
  };

  // Spring for position
  const [position, setPosition] = createSpring(
    { x: 0, y: 0 },
    springConfig
  );

  // Spring for scale
  const [scale, setScale] = createSpring(1, springConfig);

  // Spring for rotation
  const [rotation, setRotation] = createSpring(0, springConfig);

  // Gesture states
  const [isDragging, setIsDragging] = createSignal(false);
  const [isPinching, setIsPinching] = createSignal(false);
  const [touchState, setTouchState] = createSignal<TouchState | null>(null);
  const [pinchState, setPinchState] = createSignal<PinchState | null>(null);

  // Track multiple touches for pinch
  const [touches, setTouches] = createSignal<Touch[]>([]);

  /**
   * Calculate distance between two touch points
   */
  const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  /**
   * Apply bounds to position
   */
  const applyBounds = (x: number, y: number): { x: number; y: number } => {
    const bounds = config.drag?.bounds;
    if (!bounds) return { x, y };

    return {
      x: Math.max(bounds.left ?? -Infinity, Math.min(bounds.right ?? Infinity, x)),
      y: Math.max(bounds.top ?? -Infinity, Math.min(bounds.bottom ?? Infinity, y)),
    };
  };

  /**
   * Find nearest snap point
   */
  const findSnapPoint = (x: number, y: number): { x: number; y: number } | null => {
    const snapPoints = config.drag?.snapPoints;
    if (!snapPoints || snapPoints.length === 0) return null;

    let nearestPoint = snapPoints[0];
    let minDistance = Infinity;

    for (const point of snapPoints) {
      const distance = Math.sqrt(
        Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    }

    return nearestPoint;
  };

  createEffect(() => {
    const el = element();
    if (!el) return;

    // Touch start
    const handleTouchStart = (e: TouchEvent) => {
      const touchList = Array.from(e.touches);
      setTouches(touchList);

      if (touchList.length === 1 && config.gestures?.drag !== false) {
        // Single touch - drag
        const touch = touchList[0];
        setTouchState({
          startX: touch.clientX,
          startY: touch.clientY,
          startTime: Date.now(),
          currentX: touch.clientX,
          currentY: touch.clientY,
          deltaX: 0,
          deltaY: 0,
          velocity: { x: 0, y: 0 },
        });
        setIsDragging(true);
      } else if (touchList.length === 2 && config.gestures?.pinch !== false) {
        // Two touches - pinch
        const distance = getTouchDistance(touchList[0], touchList[1]);
        setPinchState({
          initialDistance: distance,
          currentDistance: distance,
          scale: 1,
        });
        setIsPinching(true);
      }
    };

    // Touch move
    const handleTouchMove = (e: TouchEvent) => {
      const touchList = Array.from(e.touches);
      setTouches(touchList);

      if (isDragging() && touchList.length === 1) {
        e.preventDefault();
        const touch = touchList[0];
        const state = touchState();
        if (!state) return;

        const deltaX = touch.clientX - state.startX;
        const deltaY = touch.clientY - state.startY;

        // Apply axis constraint
        const axis = config.drag?.axis ?? 'both';
        const constrainedDelta = {
          x: axis === 'y' ? 0 : deltaX,
          y: axis === 'x' ? 0 : deltaY,
        };

        // Apply bounds
        const pos = position() as { x: number; y: number };
        const bounded = applyBounds(
          constrainedDelta.x,
          constrainedDelta.y
        );

        setPosition(bounded);

        // Update touch state
        setTouchState({
          ...state,
          currentX: touch.clientX,
          currentY: touch.clientY,
          deltaX: bounded.x,
          deltaY: bounded.y,
          velocity: {
            x: (touch.clientX - state.currentX) / (Date.now() - state.startTime),
            y: (touch.clientY - state.currentY) / (Date.now() - state.startTime),
          },
        });
      } else if (isPinching() && touchList.length === 2) {
        e.preventDefault();
        const state = pinchState();
        if (!state) return;

        const currentDistance = getTouchDistance(touchList[0], touchList[1]);
        const scale = currentDistance / state.initialDistance;

        // Apply scale bounds
        const minScale = config.pinch?.minScale ?? 0.5;
        const maxScale = config.pinch?.maxScale ?? 3;
        const boundedScale = Math.max(minScale, Math.min(maxScale, scale));

        setScale(boundedScale);
        setPinchState({
          ...state,
          currentDistance,
          scale: boundedScale,
        });

        // Call pinch callback
        config.pinch?.onPinch?.(boundedScale);
      }
    };

    // Touch end
    const handleTouchEnd = (e: TouchEvent) => {
      const touchList = Array.from(e.touches);
      setTouches(touchList);

      if (isDragging() && touchList.length === 0) {
        const state = touchState();
        if (state) {
          const timeDelta = Date.now() - state.startTime;
          
          // Check for swipe
          if (timeDelta < 300 && config.gestures?.swipe !== false) {
            const threshold = config.swipe?.threshold ?? 50;
            
            if (Math.abs(state.deltaX) > Math.abs(state.deltaY)) {
              // Horizontal swipe
              if (state.deltaX > threshold) {
                config.swipe?.onSwipeRight?.();
              } else if (state.deltaX < -threshold) {
                config.swipe?.onSwipeLeft?.();
              }
            } else {
              // Vertical swipe
              if (state.deltaY > threshold) {
                config.swipe?.onSwipeDown?.();
              } else if (state.deltaY < -threshold) {
                config.swipe?.onSwipeUp?.();
              }
            }
          }

          // Snap to point if configured
          const snapPoint = findSnapPoint(state.deltaX, state.deltaY);
          if (snapPoint) {
            setPosition(snapPoint);
          }
        }

        setIsDragging(false);
        setTouchState(null);
      } else if (isPinching() && touchList.length < 2) {
        setIsPinching(false);
        setPinchState(null);
      }
    };

    // Mouse events for desktop
    const handleMouseDown = (e: MouseEvent) => {
      if (config.gestures?.drag === false) return;
      
      setTouchState({
        startX: e.clientX,
        startY: e.clientY,
        startTime: Date.now(),
        currentX: e.clientX,
        currentY: e.clientY,
        deltaX: 0,
        deltaY: 0,
        velocity: { x: 0, y: 0 },
      });
      setIsDragging(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging()) return;

      const state = touchState();
      if (!state) return;

      const deltaX = e.clientX - state.startX;
      const deltaY = e.clientY - state.startY;

      // Apply axis constraint
      const axis = config.drag?.axis ?? 'both';
      const constrainedDelta = {
        x: axis === 'y' ? 0 : deltaX,
        y: axis === 'x' ? 0 : deltaY,
      };

      // Apply bounds
      const bounded = applyBounds(
        constrainedDelta.x,
        constrainedDelta.y
      );

      setPosition(bounded);

      setTouchState({
        ...state,
        currentX: e.clientX,
        currentY: e.clientY,
        deltaX: bounded.x,
        deltaY: bounded.y,
        velocity: {
          x: (e.clientX - state.currentX) / (Date.now() - state.startTime),
          y: (e.clientY - state.currentY) / (Date.now() - state.startTime),
        },
      });
    };

    const handleMouseUp = () => {
      if (!isDragging()) return;

      const state = touchState();
      if (state) {
        // Snap to point if configured
        const snapPoint = findSnapPoint(state.deltaX, state.deltaY);
        if (snapPoint) {
          setPosition(snapPoint);
        }
      }

      setIsDragging(false);
      setTouchState(null);
    };

    // Add event listeners
    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('mousedown', handleMouseDown);
    
    // Global mouse events
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    onCleanup(() => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    });
  });

  // Transform styles
  const transformStyles = createMemo(() => {
    const pos = position() as { x: number; y: number };
    const scaleValue = scale() as number;
    const rotationValue = rotation() as number;

    return {
      transform: `translate(${pos.x}px, ${pos.y}px) scale(${scaleValue}) rotate(${rotationValue}deg)`,
      'touch-action': 'none',
      'user-select': 'none',
      cursor: isDragging() ? 'grabbing' : 'grab',
    };
  });

  return {
    transformStyles,
    isDragging,
    isPinching,
  };
}

/**
 * Swipeable component wrapper
 */
export function useSwipeable(
  config: {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    threshold?: number;
    spring?: {
      stiffness?: number;
      damping?: number;
    };
  } = {}
): {
  swipeHandlers: {
    onTouchStart: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchEnd: (e: TouchEvent) => void;
  };
  swipeStyles: Accessor<Record<string, string>>;
} {
  const [offset, setOffset] = createSpring(
    { x: 0, y: 0 },
    {
      stiffness: config.spring?.stiffness ?? 300,
      damping: config.spring?.damping ?? 30,
    }
  );

  const [touchStart, setTouchStart] = createSignal<{ x: number; y: number } | null>(null);

  const swipeHandlers = {
    onTouchStart: (e: TouchEvent) => {
      const touch = e.touches[0];
      setTouchStart({ x: touch.clientX, y: touch.clientY });
    },
    
    onTouchMove: (e: TouchEvent) => {
      const start = touchStart();
      if (!start) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;

      setOffset({ x: deltaX * 0.3, y: deltaY * 0.3 });
    },
    
    onTouchEnd: (e: TouchEvent) => {
      const start = touchStart();
      if (!start) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      const threshold = config.threshold ?? 50;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > threshold) {
          config.onSwipeRight?.();
        } else if (deltaX < -threshold) {
          config.onSwipeLeft?.();
        }
      } else {
        // Vertical swipe
        if (deltaY > threshold) {
          config.onSwipeDown?.();
        } else if (deltaY < -threshold) {
          config.onSwipeUp?.();
        }
      }

      setOffset({ x: 0, y: 0 });
      setTouchStart(null);
    },
  };

  const swipeStyles = createMemo(() => {
    const off = offset() as { x: number; y: number };
    return {
      transform: `translate(${off.x}px, ${off.y}px)`,
    };
  });

  return {
    swipeHandlers,
    swipeStyles,
  };
} 