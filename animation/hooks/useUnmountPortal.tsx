/**
 * Unmount Animation Portal
 * 
 * Provides a mechanism to keep components in the DOM during exit animations
 * even when SolidJS would normally remove them immediately.
 * 
 * @jsxImportSource solid-js
 */

import { createSignal, onCleanup, createEffect, JSX } from "solid-js";

export interface UnmountPortalOptions {
  /**
   * Duration to wait for unmount animation to complete (in ms)
   * Default: 300ms
   */
  duration?: number;
  
  /**
   * Callback when unmount animation completes
   */
  onComplete?: () => void;
}

/**
 * Hook to handle unmount animations by keeping the component in a portal
 * during the exit animation
 * 
 * Usage:
 * const [show, setShow] = createSignal(true);
 * const { shouldRender, isUnmounting } = useUnmountPortal(show, { duration: 300 });
 * 
 * <Show when={shouldRender()}>
 *   <Box animate={{ from: ..., to: ..., when: () => !isUnmounting() }} />
 * </Show>
 */
export function useUnmountPortal(
  isVisible: () => boolean,
  options: UnmountPortalOptions = {}
) {
  const { duration = 300, onComplete } = options;
  
  // Track if we're in the unmounting phase
  const [isUnmounting, setIsUnmounting] = createSignal(false);
  
  // Track if component should actually render
  const [shouldRender, setShouldRender] = createSignal(isVisible());
  
  let unmountTimeout: number | undefined;
  
  createEffect(() => {
    const visible = isVisible();
    
    if (visible) {
      // Component is becoming visible
      // CRITICAL FIX: Always clear timeout first to prevent race conditions
      if (unmountTimeout !== undefined) {
        clearTimeout(unmountTimeout);
        unmountTimeout = undefined;
      }
      
      setIsUnmounting(false);
      setShouldRender(true);
    } else {
      // Component is becoming hidden - start unmount animation
      // CRITICAL FIX: Clear any existing timeout to prevent double-scheduling
      if (unmountTimeout !== undefined) {
        clearTimeout(unmountTimeout);
        unmountTimeout = undefined;
      }
      
      // CRITICAL FIX: Always start/restart unmount animation when hide is requested
      // This ensures rapid hide clicks properly reset the timeout
      setIsUnmounting(true);
      
      // Ensure component is rendered during unmount animation
      setShouldRender(true);
      
      // Wait for animation duration before actually removing
      unmountTimeout = window.setTimeout(() => {
        setShouldRender(false);
        setIsUnmounting(false);
        onComplete?.();
        unmountTimeout = undefined;
      }, duration);
    }
  });
  
  // Cleanup timeout on component unmount
  onCleanup(() => {
    if (unmountTimeout !== undefined) {
      clearTimeout(unmountTimeout);
    }
  });
  
  return {
    /** Whether the component should be rendered (kept in DOM during unmount animation) */
    shouldRender,
    /** Whether the component is currently unmounting (for animation triggers) */
    isUnmounting,
  };
}

/**
 * Helper component to wrap content with unmount animation support
 * 
 * Usage:
 * <UnmountPortal 
 *   when={show()} 
 *   duration={300}
 *   onComplete={() => console.log('unmounted')}
 * >
 *   <Box />
 * </UnmountPortal>
 */
export function UnmountPortal(props: {
  when: boolean;
  duration?: number;
  onComplete?: () => void;
  children: JSX.Element;
}) {
  const { shouldRender, isUnmounting } = useUnmountPortal(
    () => props.when,
    { duration: props.duration, onComplete: props.onComplete }
  );
  
  return (
    <>
      {shouldRender() && (
        <div data-unmounting={isUnmounting()}>
          {props.children}
        </div>
      )}
    </>
  );
}
