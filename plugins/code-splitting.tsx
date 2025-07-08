/**
 * Code Splitting for Styled Components
 *
 * Enables lazy loading of styled components and their styles
 * to reduce initial bundle size
 */

import { Component, lazy, createResource, Accessor } from "solid-js";

export interface CodeSplitOptions {
  /**
   * Whether to preload the component
   * @default false
   */
  preload?: boolean;

  /**
   * Whether to prefetch the component
   * @default false
   */
  prefetch?: boolean;

  /**
   * Loading component to show while loading
   */
  fallback?: Component;

  /**
   * Error boundary component
   */
  errorBoundary?: Component<{ error: Error }>;

  /**
   * Retry attempts for failed loads
   * @default 3
   */
  retryAttempts?: number;

  /**
   * Retry delay in milliseconds
   * @default 1000
   */
  retryDelay?: number;

  /**
   * Timeout for component loading in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Whether to extract CSS separately
   * @default true
   */
  extractCSS?: boolean;

  /**
   * CSS loading strategy
   * @default 'async'
   */
  cssStrategy?: "async" | "sync" | "inline";
}

interface SplitComponentResult<T extends Record<string, any>> {
  /**
   * The lazy loaded component
   */
  Component: Component<T>;

  /**
   * Preload the component and its styles
   */
  preload: () => Promise<void>;

  /**
   * Prefetch the component (lower priority than preload)
   */
  prefetch: () => void;

  /**
   * Whether the component is loaded
   */
  isLoaded: () => boolean;

  /**
   * Whether the component is loading
   */
  isLoading: () => boolean;

  /**
   * Loading error if any
   */
  error: () => Error | null;
}

/**
 * Create a code-split styled component
 */
export function splitStyledComponent<T extends Record<string, any> = any>(
  importFn: () => Promise<{ default: Component<T> }>,
  options: CodeSplitOptions = {}
): SplitComponentResult<T> {
  const {
    preload = false,
    prefetch = false,
    fallback,
    errorBoundary,
    retryAttempts = 3,
    retryDelay = 1000,
    timeout = 30000,
    extractCSS = true,
    cssStrategy = "async",
  } = options;

  let loadPromise: Promise<void> | null = null;
  let isLoaded = false;
  let loadError: Error | null = null;
  let retryCount = 0;

  // Create a wrapped import function with retry logic
  const importWithRetry = async (): Promise<{ default: Component<T> }> => {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Component loading timeout")), timeout);
      });

      const module = await Promise.race([importFn(), timeoutPromise]);

      // Extract and load CSS if enabled
      if (extractCSS && (module as any).__cssModuleId) {
        await loadComponentCSS((module as any).__cssModuleId, cssStrategy);
      }

      isLoaded = true;
      loadError = null;
      return module as { default: Component<T> };
    } catch (error) {
      if (retryCount < retryAttempts) {
        retryCount++;
        await new Promise((resolve) => setTimeout(resolve, retryDelay * retryCount));
        return importWithRetry();
      }
      loadError = error as Error;
      throw error;
    }
  };

  // Create the lazy component
  const LazyComponent = lazy(importWithRetry);

  // Preload function
  const preloadComponent = async (): Promise<void> => {
    if (isLoaded || loadPromise) return;

    loadPromise = (async () => {
      try {
        await importWithRetry();
      } catch (error) {
        console.error("Failed to preload component:", error);
      }
    })();

    return loadPromise;
  };

  // Prefetch function (uses requestIdleCallback for lower priority)
  const prefetchComponent = (): void => {
    if (isLoaded || loadPromise) return;

    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => preloadComponent(), { timeout: 2000 });
    } else {
      setTimeout(() => preloadComponent(), 100);
    }
  };

  // Auto-preload/prefetch if enabled
  if (preload) {
    preloadComponent();
  } else if (prefetch) {
    prefetchComponent();
  }

  // Create wrapper component with error boundary and fallback
  const WrappedComponent: Component<T> = (props) => {
    if (errorBoundary && loadError) {
      const ErrorComponent = errorBoundary;
      return <ErrorComponent error={loadError} />;
    }

    if (fallback && !isLoaded) {
      const FallbackComponent = fallback;
      return <FallbackComponent />;
    }

    return <LazyComponent {...props} />;
  };

  return {
    Component: WrappedComponent,
    preload: preloadComponent,
    prefetch: prefetchComponent,
    isLoaded: () => isLoaded,
    isLoading: () => !!loadPromise && !isLoaded,
    error: () => loadError,
  };
}

/**
 * Load component CSS based on strategy
 */
async function loadComponentCSS(moduleId: string, strategy: "async" | "sync" | "inline"): Promise<void> {
  const cssUrl = `/css/components/${moduleId}.css`;

  switch (strategy) {
    case "async":
      return loadCSSAsync(cssUrl);
    case "sync":
      return loadCSSSync(cssUrl);
    case "inline":
      return loadCSSInline(cssUrl);
  }
}

/**
 * Load CSS asynchronously
 */
function loadCSSAsync(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.media = "print"; // Load without blocking

    link.onload = () => {
      link.media = "all"; // Apply styles
      resolve();
    };

    link.onerror = () => {
      reject(new Error(`Failed to load CSS: ${url}`));
    };

    document.head.appendChild(link);
  });
}

/**
 * Load CSS synchronously (blocking)
 */
function loadCSSSync(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;

    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));

    document.head.appendChild(link);
  });
}

/**
 * Load CSS inline (fetch and inject)
 */
async function loadCSSInline(url: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const css = await response.text();
    const style = document.createElement("style");
    style.textContent = css;
    style.dataset.moduleId = url;
    document.head.appendChild(style);
  } catch (error) {
    throw new Error(`Failed to load CSS inline: ${error}`);
  }
}

/**
 * Route-based code splitting helper
 */
export interface RouteConfig<T extends Record<string, any> = any> {
  path: string;
  component: () => Promise<{ default: Component<T> }>;
  options?: CodeSplitOptions;
}

/**
 * Create route-based code splitting
 */
export function createRouteSplitting<T extends Record<string, any> = Record<string, any>>(
  routes: RouteConfig<T>[]
): Map<string, SplitComponentResult<T>> {
  const splitRoutes = new Map<string, SplitComponentResult<T>>();

  routes.forEach((route) => {
    const splitComponent = splitStyledComponent(
      route.component as () => Promise<{ default: Component<Record<string, any>> }>,
      route.options
    );

    splitRoutes.set(route.path, splitComponent as SplitComponentResult<T>);
  });

  return splitRoutes;
}

/**
 * Intersection Observer based lazy loading
 */
export interface LazyLoadOptions extends CodeSplitOptions {
  /**
   * Root margin for intersection observer
   * @default '50px'
   */
  rootMargin?: string;

  /**
   * Threshold for intersection observer
   * @default 0.01
   */
  threshold?: number | number[];

  /**
   * Whether to unobserve after loading
   * @default true
   */
  unobserveAfterLoad?: boolean;
}

/**
 * Create a lazy loaded component based on viewport visibility
 */
export function lazyLoadOnVisible<T extends Record<string, any> = any>(
  importFn: () => Promise<{ default: Component<T> }>,
  options: LazyLoadOptions = {}
): Component<T> {
  const { rootMargin = "50px", threshold = 0.01, unobserveAfterLoad = true, ...splitOptions } = options;

  const splitComponent = splitStyledComponent(importFn, splitOptions);
  let observer: IntersectionObserver | null = null;

  return (props) => {
    let elementRef: HTMLElement | null = null;

    const setupObserver = (el: HTMLElement) => {
      elementRef = el;

      if (!observer && "IntersectionObserver" in window) {
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                splitComponent.preload();

                if (unobserveAfterLoad && observer && elementRef) {
                  observer.unobserve(elementRef);
                }
              }
            });
          },
          { rootMargin, threshold }
        );

        observer.observe(el);
      }
    };

    const cleanup = () => {
      if (observer && elementRef) {
        observer.unobserve(elementRef);
      }
    };

    // Return wrapper with ref
    return (
      <div
        ref={setupObserver}
        onCleanup={cleanup}
      >
        <splitComponent.Component {...props} />
      </div>
    );
  };
}

/**
 * Bundle analysis helper
 */
export interface BundleStats {
  /**
   * Component name
   */
  name: string;

  /**
   * Bundle size in bytes
   */
  size: number;

  /**
   * Gzipped size in bytes
   */
  gzipSize: number;

  /**
   * CSS size in bytes
   */
  cssSize: number;

  /**
   * Load time in milliseconds
   */
  loadTime: number;

  /**
   * Dependencies
   */
  dependencies: string[];
}

/**
 * Analyze bundle for code splitting opportunities
 */
export async function analyzeBundleForSplitting(bundlePath: string): Promise<{
  totalSize: number;
  components: BundleStats[];
  recommendations: string[];
}> {
  // This would integrate with webpack-bundle-analyzer or similar
  // For now, return mock data structure
  return {
    totalSize: 0,
    components: [],
    recommendations: [
      "Consider splitting large components over 50KB",
      "Extract common dependencies into shared chunks",
      "Use route-based splitting for page components",
      "Lazy load below-the-fold components",
    ],
  };
}

/**
 * Preload strategies
 */
export const PreloadStrategies = {
  /**
   * Preload on hover
   */
  onHover: (component: SplitComponentResult<any>) => ({
    onMouseEnter: () => component.prefetch(),
    onFocus: () => component.prefetch(),
  }),

  /**
   * Preload on interaction intent
   */
  onIntent: (component: SplitComponentResult<any>) => ({
    onMouseMove: () => component.prefetch(),
    onTouchStart: () => component.prefetch(),
  }),

  /**
   * Preload when idle
   */
  whenIdle: (component: SplitComponentResult<any>) => {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => component.prefetch());
    } else {
      setTimeout(() => component.prefetch(), 1000);
    }
  },

  /**
   * Preload based on network speed
   */
  adaptivePreload: (component: SplitComponentResult<any>) => {
    const connection = (navigator as any).connection;
    if (connection && connection.effectiveType === "4g") {
      component.prefetch();
    }
  },
};

/**
 * Export helpers for Vite/Webpack integration
 */
export const codeSplittingPlugin = {
  name: "styled-components-code-splitting",

  transform(code: string, id: string) {
    // Add module ID to styled components for CSS extraction
    if (id.includes("styled") && !id.includes("node_modules")) {
      const moduleId = createModuleId(id);
      return {
        code: code.replace(/export\s+default\s+/g, `$&Object.assign(`) + `, { __cssModuleId: '${moduleId}' })`,
        map: null,
      };
    }
    return null;
  },
};

/**
 * Create a unique module ID for CSS extraction
 */
function createModuleId(filePath: string): string {
  const hash =
    filePath
      .split("/")
      .pop()
      ?.replace(/\.[^.]+$/, "") || "unknown";

  return `styled-${hash}-${Date.now().toString(36)}`;
}
