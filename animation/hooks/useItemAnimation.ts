import { Accessor, createMemo, createSignal } from "solid-js";
import { AnimationConfig, SpringTarget } from "../spring-bridge";
import { useAnimation, AnimationResult } from "./useAnimation";

/**
 * A global registry to track active items across components
 * This enables coordination between different lists and components
 */
export type ItemRegistry = {
  [namespace: string]: {
    activeId: Accessor<any>;
    setActiveId: (id: any) => void;
  };
};

// Global registry for active items
const itemRegistries: ItemRegistry = {};

/**
 * Get or create a registry for a namespace
 *
 * @param namespace Namespace to identify the registry
 * @returns The registry's active ID accessor and setter
 */
export function getItemRegistry(namespace: string = "default") {
  if (!itemRegistries[namespace]) {
    const [activeId, setActiveId] = createSignal<any>(null);
    itemRegistries[namespace] = { activeId, setActiveId };
  }

  return itemRegistries[namespace];
}

/**
 * Hook to create an animation that activates when an item is active
 * (e.g., when hovered, selected, focused)
 *
 * @param config Animation configuration
 * @param itemId ID of the current item
 * @param namespace Optional namespace for the registry (to separate different lists)
 * @returns Animation result
 */
export function useItemAnimation<T extends SpringTarget, ID>(
  config: any,
  itemId: ID,
  namespace: string = "default"
): AnimationResult<T> {
  // Get the registry for this namespace
  const { activeId } = getItemRegistry(namespace);

  // Create condition based on active ID
  const isActive = createMemo(() => activeId() === itemId);

  // Create animation with this condition
  return useAnimation({
    ...config,
    condition: isActive,
  });
}

/**
 * Hook to create handlers for item interactions
 *
 * @param itemId ID of the current item
 * @param namespace Optional namespace for the registry
 * @returns Object with event handlers
 */
export function useItemHandlers<ID>(itemId: ID, namespace: string = "default") {
  const { setActiveId, activeId } = getItemRegistry(namespace);

  return {
    // Activate this item
    onMouseEnter: () => setActiveId(itemId),
    onFocus: () => setActiveId(itemId),
    // Deactivate only if this item is active
    onMouseLeave: () => {
      if (activeId() === itemId) {
        setActiveId(null);
      }
    },
    onBlur: () => {
      if (activeId() === itemId) {
        setActiveId(null);
      }
    },
    // Set active via click (useful for mobile)
    onClick: () => {
      if (activeId() === itemId) {
        setActiveId(null);
      } else {
        setActiveId(itemId);
      }
    },
    // Check if this item is active
    isActive: () => activeId() === itemId,
  };
}

/**
 * Hook to easily create item animations with all necessary handlers
 *
 * @param config Animation configuration
 * @param itemId ID of the current item
 * @param namespace Optional namespace for registry
 * @returns Animation result and event handlers
 */
export function useAnimatedItem<T extends SpringTarget, ID>(
  config: AnimationConfig<T>,
  itemId: ID,
  namespace: string = "default"
) {
  const animation = useItemAnimation(config, itemId, namespace);
  const handlers = useItemHandlers(itemId, namespace);

  return {
    animation,
    handlers,
  };
}
