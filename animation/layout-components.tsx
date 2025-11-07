/**
 * Layout Animation Components and Directives
 * 
 * Provides easy-to-use components and directives for layout animations
 */

import { JSX, Component, splitProps, children as resolveChildren, createContext, useContext } from "solid-js";
import { Dynamic } from "solid-js/web";
import { LayoutAnimationEngine, LayoutTransitionConfig, useLayoutAnimation } from "./layout-engine";

/**
 * Global layout transition configuration context
 */
const LayoutTransitionContext = createContext<LayoutTransitionConfig | undefined>(undefined);

/**
 * Provider for global layout transition configuration
 * 
 * @example
 * ```tsx
 * // Set global spring settings for all layout animations
 * <LayoutTransitionProvider config={{ stiffness: 400, damping: 30 }}>
 *   <App />
 * </LayoutTransitionProvider>
 * ```
 */
export function LayoutTransitionProvider(props: {
  config: LayoutTransitionConfig;
  children: JSX.Element;
}) {
  return (
    <LayoutTransitionContext.Provider value={props.config}>
      {props.children}
    </LayoutTransitionContext.Provider>
  );
}

/**
 * Hook to get global layout transition configuration
 */
function useGlobalLayoutTransition(): LayoutTransitionConfig | undefined {
  return useContext(LayoutTransitionContext);
}

/**
 * Directive for adding layout animations to any element
 * 
 * @example
 * ```tsx
 * <div use:layoutAnimation={{ stiffness: 400 }}>
 *   Content that will animate when size changes
 * </div>
 * ```
 */
export function layoutAnimation(
  element: HTMLElement,
  accessor: () => LayoutTransitionConfig | boolean
): void {
  let engine: LayoutAnimationEngine | null = null;
  
  // Get config from accessor
  const getConfig = () => {
    const value = accessor();
    return typeof value === "boolean" && value ? {} : (value as LayoutTransitionConfig);
  };
  
  // Initialize engine
  engine = new LayoutAnimationEngine(element, getConfig());
  
  // Cleanup on element removal
  if (element && 'addEventListener' in element) {
    const cleanup = () => {
      if (engine) {
        engine.destroy();
        engine = null;
      }
    };
    
    element.addEventListener('remove', cleanup, { once: true });
  }
}

// Type augmentation for directive
declare module "solid-js" {
  namespace JSX {
    interface Directives {
      layoutAnimation: LayoutTransitionConfig | boolean;
    }
  }
}

/**
 * Props for LayoutAnimated component
 */
export interface LayoutAnimatedProps extends JSX.HTMLAttributes<HTMLElement> {
  /**
   * The element type to render
   * @default 'div'
   */
  as?: keyof JSX.IntrinsicElements | Component<any>;
  
  /**
   * Enable layout animations
   * @default false
   */
  layout?: boolean;
  
  /**
   * Spring configuration for layout animations
   * Only used when layout={true}
   */
  layoutTransition?: LayoutTransitionConfig;
  
  /**
   * Children elements
   */
  children?: JSX.Element;
}

/**
 * Wrapper component that adds layout animations to any element
 * 
 * @example
 * ```tsx
 * // Simple usage with defaults
 * <LayoutAnimated layout>
 *   <button onClick={() => setExpanded(!expanded())}>Toggle</button>
 *   {expanded() && <div>Extra content</div>}
 * </LayoutAnimated>
 * 
 * // Custom spring settings
 * <LayoutAnimated layout layoutTransition={{ stiffness: 400, damping: 30 }}>
 *   <button onClick={() => setExpanded(!expanded())}>Toggle</button>
 *   {expanded() && <div>Extra content</div>}
 * </LayoutAnimated>
 * ```
 */
export function LayoutAnimated(props: LayoutAnimatedProps) {
  const [local, restProps] = splitProps(props, [
    'as',
    'layout',
    'layoutTransition',
    'children'
  ]);
  
  const globalConfig = useGlobalLayoutTransition();
  const resolvedChildren = resolveChildren(() => local.children);
  const component = local.as || 'div';
  
  // Only enable layout animation if layout prop is true
  // Merge global config with local config (local overrides global)
  if (local.layout) {
    const config = { ...globalConfig, ...local.layoutTransition };
    const layoutRef = useLayoutAnimation(config);
    
    return (
      <Dynamic component={component} ref={layoutRef} {...restProps}>
        {resolvedChildren()}
      </Dynamic>
    );
  }
  
  // No layout animation, just render normally
  return (
    <Dynamic component={component} {...restProps}>
      {resolvedChildren()}
    </Dynamic>
  );
}

/**
 * Re-export the hook for convenience
 */
export { useLayoutAnimation } from "./layout-engine";
