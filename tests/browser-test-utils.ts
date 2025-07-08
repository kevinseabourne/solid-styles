/**
 * Browser Test Utilities
 * Helper functions for reliable browser-based testing
 */

/**
 * Wait for next browser frame to ensure DOM updates are complete
 */
export const waitForFrame = (): Promise<void> => {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
};

/**
 * Wait for multiple frames for complex operations
 */
export const waitForFrames = (count: number = 3): Promise<void> => {
  let remaining = count;
  return new Promise((resolve) => {
    const tick = () => {
      remaining--;
      if (remaining <= 0) {
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });
};

/**
 * Reliable timing measurement that accounts for browser overhead
 */
export const measureWithTolerance = (
  operation: () => any,
  expectedMin: number,
  expectedMax: number,
  tolerance: number = 0.5
): { result: any; duration: number; withinExpected: boolean } => {
  const start = performance.now();
  const result = operation();
  const duration = performance.now() - start;

  const adjustedMin = expectedMin * (1 - tolerance);
  const adjustedMax = expectedMax * (1 + tolerance);
  const withinExpected = duration >= adjustedMin && duration <= adjustedMax;

  return { result, duration, withinExpected };
};

/**
 * Async timing measurement with tolerance
 */
export const measureAsyncWithTolerance = async (
  operation: () => Promise<any>,
  expectedMin: number,
  expectedMax: number,
  tolerance: number = 0.5
): Promise<{ result: any; duration: number; withinExpected: boolean }> => {
  const start = performance.now();
  const result = await operation();
  const duration = performance.now() - start;

  const adjustedMin = expectedMin * (1 - tolerance);
  const adjustedMax = expectedMax * (1 + tolerance);
  const withinExpected = duration >= adjustedMin && duration <= adjustedMax;

  return { result, duration, withinExpected };
};

/**
 * Reliable sleep that works in browser environment
 */
export const browserSleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Wait for DOM element to be ready for testing
 */
export const waitForElement = (
  container: Element,
  selector: string,
  timeout: number = 1000
): Promise<Element | null> => {
  return new Promise((resolve, reject) => {
    const element = container.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const found = container.querySelector(selector);
      if (found) {
        observer.disconnect();
        resolve(found);
      }
    });

    observer.observe(container, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
};

/**
 * Performance-aware batch operations
 */
export const performBatch = <T>(
  items: T[],
  operation: (item: T, index: number) => void,
  batchSize: number = 100
): Promise<void> => {
  return new Promise((resolve) => {
    let processed = 0;

    const processBatch = () => {
      const end = Math.min(processed + batchSize, items.length);

      for (let i = processed; i < end; i++) {
        operation(items[i], i);
      }

      processed = end;

      if (processed >= items.length) {
        resolve();
      } else {
        // Use setTimeout to prevent blocking
        setTimeout(processBatch, 0);
      }
    };

    processBatch();
  });
};

/**
 * Retry a test operation with exponential backoff
 */
export const retryWithBackoff = async <T>(
  operation: () => Promise<T> | T,
  maxRetries: number = 3,
  baseDelay: number = 100
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await browserSleep(delay);
      }
    }
  }

  throw lastError;
};

/**
 * Check if we're running in a real browser vs test environment
 */
export const isRealBrowser = (): boolean => {
  return (
    typeof window !== "undefined" && typeof window.navigator !== "undefined" && window.navigator.userAgent !== "node.js"
  );
};

/**
 * Get appropriate timing thresholds based on environment
 */
export const getTimingThresholds = (base: number): { min: number; max: number } => {
  const multiplier = isRealBrowser() ? 3 : 1.5; // More lenient in real browser
  return {
    min: base * 0.5,
    max: base * multiplier,
  };
};

/**
 * Browser-safe performance measurement for tests
 */
export class BrowserPerformanceTracker {
  private marks: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();

    if (start === undefined) {
      throw new Error(`Start mark "${startMark}" not found`);
    }

    if (endMark && end === undefined) {
      throw new Error(`End mark "${endMark}" not found`);
    }

    const duration = (end as number) - start;
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  clear(): void {
    this.marks.clear();
  }
}
