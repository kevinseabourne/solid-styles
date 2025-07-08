/**
 * Animation Trigger Hooks
 *
 * This file contains hooks for creating animation triggers based on common interactions
 * such as hover, focus, click, intersection (in-view), and more.
 */

import { Accessor, createEffect, createSignal, onCleanup, onMount, createMemo } from "solid-js";

// =============================================================================
// Trigger Types
// =============================================================================

/**
 * Animation trigger types supported by the system
 */
export type AnimationTrigger =
  | "mount" // When component mounts
  | "unmount" // When component unmounts
  | "hover" // Mouse hover
  | "focus" // Element receives focus
  | "click" // Mouse click
  | "inView" // Element enters viewport
  | "active" // During active state (mousedown)
  | "always" // Always active (continuous animation)
  | (() => boolean); // Custom function trigger

/**
 * Options for inView trigger
 */
export interface InViewOptions {
  /**
   * Root element to use as viewport
   * Default: browser viewport
   */
  root?: Element | null;

  /**
   * Margin around the root element
   * Default: "0px"
   */
  rootMargin?: string;

  /**
   * Threshold for when element is considered visible
   * Can be a single number or an array of numbers from 0 to 1.0
   * Default: 0 (any part of element visible)
   */
  threshold?: number | number[];

  /**
   * If true, trigger remains active once element enters view
   * Default: false
   */
  once?: boolean;
}

// =============================================================================
// Hover Trigger
// =============================================================================

/**
 * Creates a hover state trigger for animations
 *
 * @param ref Reference to the element to track hover state
 * @returns Boolean signal indicating if element is being hovered
 */
export function useHoverTrigger(ref: Accessor<HTMLElement | null | undefined>) {
  const [isHovered, setIsHovered] = createSignal(false);

  createEffect(() => {
    const element = ref();
    if (!element) return;

    console.log("[ANIM-TRACE] Setting up hover listeners for", element);

    // Mouse enter handler
    const handleMouseEnter = () => {
      console.log("[ANIM-TRACE] Mouse enter event on", element);
      setIsHovered(true);
    };

    // Mouse leave handler
    const handleMouseLeave = () => {
      console.log("[ANIM-TRACE] Mouse leave event on", element);
      setIsHovered(false);
    };

    // Add event listeners
    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);

    // Debug trace
    console.log("[ANIM-TRACE] Hover listeners set up: enter, leave");

    // Test event dispatch (only in development for debugging)
    if (process.env.NODE_ENV !== "production") {
      try {
        // Force a test event to ensure handlers are working
        console.log("[ANIM-TRACE] Forcing test events for verification");

        // Simulate events but don't modify state
        const testEnter = new MouseEvent("mouseenter", { bubbles: true });
        const origDispatch = element.dispatchEvent;
        element.dispatchEvent = (ev) => {
          console.log("[ANIM-TRACE] Test dispatch:", ev.type);
          return true; // Prevent actual event handling
        };

        element.dispatchEvent(testEnter);

        // Restore original dispatch
        element.dispatchEvent = origDispatch;
      } catch (e) {
        console.error("[ANIM-ERROR] Test event failed:", e);
      }
    }

    // Clean up
    onCleanup(() => {
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
      console.log("[ANIM-TRACE] Hover listeners removed");
    });
  });

  // Add more detailed logging
  createEffect(() => {
    console.log("[ANIM-TRACE] Hover state changed:", isHovered());
  });

  return isHovered;
}

// =============================================================================
// Focus Trigger
// =============================================================================

/**
 * Creates a focus state trigger for animations
 *
 * @param ref Reference to the element to track focus state
 * @returns Boolean signal indicating if element has focus
 */
export function useFocusTrigger(ref: Accessor<HTMLElement | null | undefined>) {
  const [isFocused, setIsFocused] = createSignal(false);

  createEffect(() => {
    const element = ref();
    if (!element) return;

    // Focus handler
    const handleFocus = () => setIsFocused(true);

    // Blur handler
    const handleBlur = () => setIsFocused(false);

    // Add event listeners
    element.addEventListener("focus", handleFocus);
    element.addEventListener("blur", handleBlur);

    // Clean up
    onCleanup(() => {
      element.removeEventListener("focus", handleFocus);
      element.removeEventListener("blur", handleBlur);
    });
  });

  return isFocused;
}

// =============================================================================
// Click Trigger
// =============================================================================

/**
 * Creates a click state trigger for animations
 *
 * @param ref Reference to the element to track click state
 * @param options Configuration options
 * @returns Boolean signal indicating if element is clicked
 */
export function useClickTrigger(
  ref: Accessor<HTMLElement | null | undefined>,
  options: { toggle?: boolean; duration?: number; handleClickOutside?: boolean } = {}
) {
  const { toggle = false, duration, handleClickOutside = true } = options;
  const [isClicked, setIsClicked] = createSignal(false);
  let timeout: number | undefined;

  // Force set the clicked state
  const setClicked = (clicked: boolean) => {
    setIsClicked(clicked);

    // If duration is set, automatically reset after duration
    if (duration && clicked) {
      clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        setIsClicked(false);
      }, duration);
    }
  };

  createEffect(() => {
    const element = ref();
    if (!element) return;

    // Click handler
    const handleClick = (e: MouseEvent) => {
      e.stopPropagation(); // Prevent event bubbling

      if (toggle) {
        setIsClicked(!isClicked());
      } else {
        setClicked(true);
      }

      console.log(`[ANIM-DEBUG] Click handler executed, new state: ${isClicked()}`);
    };

    // Handle click outside (if enabled)
    const handleDocumentClick = (e: MouseEvent) => {
      if (!element.contains(e.target as Node)) {
        if (isClicked()) {
          console.log("[ANIM-DEBUG] Click outside detected, resetting state");
          setClicked(false);
        }
      }
    };

    // Add event listeners
    element.addEventListener("click", handleClick);

    // Add document listener for click outside detection
    if (handleClickOutside) {
      document.addEventListener("click", handleDocumentClick);
    }

    // Clean up
    onCleanup(() => {
      element.removeEventListener("click", handleClick);
      if (handleClickOutside) {
        document.removeEventListener("click", handleDocumentClick);
      }
      clearTimeout(timeout);
    });
  });

  // Return only the signal for compatibility with the animation system
  return isClicked;
}

// =============================================================================
// Active (Pressed) Trigger
// =============================================================================

/**
 * Creates an active state trigger for animations (mousedown/touchstart)
 *
 * @param ref Reference to the element to track active state
 * @returns Boolean signal indicating if element is being pressed
 */
export function useActiveTrigger(ref: Accessor<HTMLElement | null | undefined>) {
  const [isActive, setIsActive] = createSignal(false);

  createEffect(() => {
    const element = ref();
    if (!element) return;

    // Mouse down handler
    const handleMouseDown = () => setIsActive(true);

    // Mouse up handler
    const handleMouseUp = () => setIsActive(false);

    // Add event listeners
    element.addEventListener("mousedown", handleMouseDown);
    element.addEventListener("touchstart", handleMouseDown);

    // Add global mouse up to handle cases where mouse is released outside element
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleMouseUp);

    // Clean up
    onCleanup(() => {
      element.removeEventListener("mousedown", handleMouseDown);
      element.removeEventListener("touchstart", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    });
  });

  return isActive;
}

// =============================================================================
// InView (Intersection) Trigger
// =============================================================================

/**
 * Creates an in-view state trigger for animations using IntersectionObserver
 *
 * @param ref Reference to the element to track viewport intersection
 * @param options IntersectionObserver options
 * @returns Boolean signal indicating if element is in viewport
 */
export function useInViewTrigger(ref: Accessor<HTMLElement | null | undefined>, options: InViewOptions = {}) {
  const [isInView, setIsInView] = createSignal(false);

  // Destructure options with improved defaults
  const {
    root = null,
    rootMargin = "0px",
    threshold = 0.1, // Lower threshold to make triggering easier
    once = false,
  } = options;

  createEffect(() => {
    const element = ref();
    if (!element) return;

    console.log("[ANIM-TRACE] Setting up IntersectionObserver for", element);

    // Precompute visibility for SSR and initial state
    const isInitiallyVisible = isElementInViewport(element);
    if (isInitiallyVisible) {
      console.log("[ANIM-TRACE] Element already in viewport on setup");
      setIsInView(true);
    }

    // Create the observer with detailed logging
    const observer = new IntersectionObserver(
      (entries) => {
        // Get the entry for our element
        const entry = entries[0];

        // Log detailed information about the intersection
        console.log(
          `[ANIM-TRACE] Intersection: ratio=${entry.intersectionRatio.toFixed(2)}, isIntersecting=${entry.isIntersecting}`,
          {
            boundingClientRect: entry.boundingClientRect,
            intersectionRect: entry.intersectionRect,
            rootBounds: entry.rootBounds,
          }
        );

        if (entry.isIntersecting) {
          console.log("[ANIM-TRACE] Element entered viewport");
          setIsInView(true);

          // If once=true, disconnect after first intersection
          if (once) {
            console.log("[ANIM-TRACE] Once=true, disconnecting observer");
            observer.disconnect();
          }
        } else {
          // Only set to false if not using 'once' mode
          if (!once) {
            console.log("[ANIM-TRACE] Element left viewport");
            setIsInView(false);
          }
        }
      },
      { root, rootMargin, threshold }
    );

    // Start observing
    observer.observe(element);
    console.log("[ANIM-TRACE] IntersectionObserver started with options:", { root, rootMargin, threshold, once });

    // Clean up
    onCleanup(() => {
      console.log("[ANIM-TRACE] Disconnecting IntersectionObserver");
      observer.disconnect();
    });
  });

  return isInView;
}

/**
 * Helper function to check if an element is in the viewport
 * Useful for initial state and SSR
 */
function isElementInViewport(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();

  return (
    rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.left <= (window.innerWidth || document.documentElement.clientWidth) &&
    rect.bottom >= 0 &&
    rect.right >= 0
  );
}

// =============================================================================
// Combined Trigger
// =============================================================================

/**
 * Creates a trigger based on the specified animation trigger type
 *
 * @param ref Reference to the element
 * @param triggerType Type of trigger to create
 * @param options Additional options for the trigger
 * @returns Boolean signal indicating if trigger is active
 */
export function useTrigger(
  ref: Accessor<HTMLElement | null | undefined>,
  triggerType: AnimationTrigger,
  options: any = {}
): Accessor<boolean> {
  // Handle custom function triggers
  if (typeof triggerType === "function") {
    return createMemo(() => {
      try {
        // Check if the function returns a boolean directly
        const result = triggerType();
        return !!result;
      } catch (err) {
        console.error("[ANIM-ERROR] Custom trigger function error:", err);
        return false;
      }
    });
  }

  // Handle built-in triggers
  switch (triggerType) {
    case "hover":
      return useHoverTrigger(ref);

    case "focus":
      return useFocusTrigger(ref);

    case "click":
      // Updated to match our new implementation
      return useClickTrigger(ref, options);

    case "active":
      return useActiveTrigger(ref);

    case "inView":
      return useInViewTrigger(ref, options);

    case "mount":
      // Mount is always true once the component is mounted
      const [isMounted, setIsMounted] = createSignal(false);
      onMount(() => setIsMounted(true));
      return isMounted;

    case "unmount":
      // For unmount animation, we use a custom approach
      // This will be triggered in the cleanup phase
      return () => false;

    case "always":
      // Always trigger - always returns true
      return () => true;

    default:
      console.warn(`[ANIM-WARN] Unknown animation trigger: ${String(triggerType)}`);
      return () => false;
  }
}
