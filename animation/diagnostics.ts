/**
 * Animation System Diagnostics
 * 
 * This module provides diagnostic tools for the animation system
 * to help identify and fix integration issues.
 */

// Track animation instances and their state
const animationRegistry = new Map<string, any>();
let diagnosticsEnabled = false;

/**
 * Enable animation diagnostics globally
 */
export function enableAnimationDiagnostics(): void {
  diagnosticsEnabled = true;
  console.log("[ANIM-DIAG] Animation diagnostics enabled");
}

/**
 * Disable animation diagnostics globally
 */
export function disableAnimationDiagnostics(): void {
  diagnosticsEnabled = false;
  console.log("[ANIM-DIAG] Animation diagnostics disabled");
}

/**
 * Check if animation diagnostics are enabled
 */
export function isAnimationDiagnosticsEnabled(): boolean {
  return diagnosticsEnabled;
}

/**
 * Register an animation instance for tracking
 */
export function registerAnimation(id: string, instance: any): void {
  if (!diagnosticsEnabled) return;
  
  animationRegistry.set(id, instance);
  console.log(`[ANIM-DIAG] Registered animation: ${id}`, instance);
}

/**
 * Unregister an animation instance
 */
export function unregisterAnimation(id: string): void {
  if (!diagnosticsEnabled) return;
  
  if (animationRegistry.has(id)) {
    animationRegistry.delete(id);
    console.log(`[ANIM-DIAG] Unregistered animation: ${id}`);
  }
}

/**
 * Log animation event
 */
export function logAnimationEvent(id: string, event: string, data?: any): void {
  if (!diagnosticsEnabled) return;
  
  console.log(`[ANIM-DIAG] [${id}] ${event}`, data);
}

/**
 * Get all currently registered animations
 */
export function getRegisteredAnimations(): Map<string, any> {
  return new Map(animationRegistry);
}

/**
 * Run diagnostics on the animation system
 */
export function runAnimationDiagnostics(): void {
  console.group("[ANIM-DIAG] Animation System Diagnostics");
  
  console.log("Animation diagnostics enabled:", diagnosticsEnabled);
  console.log("Registered animations:", animationRegistry.size);
  
  animationRegistry.forEach((instance, id) => {
    console.group(`Animation: ${id}`);
    console.log("Instance:", instance);
    
    // Check for state
    if (instance.state) {
      console.log("State:", typeof instance.state === 'function' ? instance.state() : instance.state);
    }
    
    // Check for value
    if (instance.value) {
      console.log("Value:", typeof instance.value === 'function' ? instance.value() : instance.value);
    }
    
    // Check for target element
    if (instance.element) {
      console.log("Element:", instance.element);
      
      // Check computed styles
      if (instance.element instanceof HTMLElement) {
        const styles = window.getComputedStyle(instance.element);
        console.log("Computed styles:", {
          transform: styles.transform,
          transition: styles.transition,
        });
      }
    }
    
    console.groupEnd();
  });
  
  console.groupEnd();
}
