// Test setup file for browser environment
import { vi } from "vitest";
import { cleanup } from "@solidjs/testing-library";
import { afterEach } from "vitest";

// Skip Jest-DOM import in browser environment - use native browser APIs instead
// Browser environment has real DOM, so we don't need JSDOM extensions

// Auto cleanup after each test
afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Browser Environment Detection
// ---------------------------------------------------------------------------

const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

// ---------------------------------------------------------------------------
// Module Mocks
// ---------------------------------------------------------------------------

// LightningCSS relies on native bindings that are not available in the browser
// We stub its API surface for browser testing
vi.mock("lightningcss", () => {
  return {
    // Enhanced transform that properly handles Uint8Array and applies basic optimizations
    transform: (options: any) => {
      // Decode the input properly
      let code = typeof options.code === "string" ? options.code : new TextDecoder().decode(options.code);

      // Apply basic minification if requested
      if (options.minify) {
        code = code
          .replace(/\/\*[\s\S]*?\*\//g, "") // Remove comments
          .replace(/\s+/g, " ") // Collapse whitespace
          .replace(/\s*([{}:;,])\s*/g, "$1") // Remove spaces around punctuation
          .trim();
      }

      // Add basic vendor prefixes for user-select in test mode
      if (code.includes("user-select:none")) {
        code = code.replace("user-select:none", "-webkit-user-select:none;-moz-user-select:none;user-select:none");
      }

      return {
        code: code,
        map: null,
      };
    },
    // Re-export enums/constants as empty stubs to keep the API shape intact.
    browserslistToTargets: () => ({}),
    Features: {
      VendorPrefixes: 1,
      Colors: 2,
      Nesting: 4,
      LogicalProperties: 8,
    },
  };
});

// ---------------------------------------------------------------------------
// Browser API Setup (only when in real browser)
// ---------------------------------------------------------------------------

if (isBrowser) {
  // Ensure matchMedia exists for responsive tests
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }

  // Ensure IntersectionObserver exists for animation triggers
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  }

  // Ensure ResizeObserver exists for responsive components
  if (!window.ResizeObserver) {
    window.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  }

  // Performance API enhancements for testing
  if (typeof window.performance === "undefined") {
    window.performance = {
      now: () => Date.now(),
      mark: vi.fn(),
      measure: vi.fn(),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
    } as any;
  }
}

// ---------------------------------------------------------------------------
// Browser-Compatible Custom Matchers
// ---------------------------------------------------------------------------

// Add custom matchers that work in browser environment
import { expect } from "vitest";

// Extend expect with browser-compatible matchers
expect.extend({
  toBeInTheDocument(received) {
    const pass = received && document.body.contains(received);
    return {
      message: () => `expected element ${pass ? "not " : ""}to be in the document`,
      pass,
    };
  },

  toBeVisible(received) {
    if (!received || !document.body.contains(received)) {
      return {
        message: () => "element is not in the document",
        pass: false,
      };
    }

    const computedStyle = window.getComputedStyle(received);
    const pass =
      computedStyle.display !== "none" && computedStyle.visibility !== "hidden" && computedStyle.opacity !== "0";

    return {
      message: () => `expected element ${pass ? "not " : ""}to be visible`,
      pass,
    };
  },

  toHaveStyle(received, style: string | Record<string, any>) {
    if (!received || !document.body.contains(received)) {
      return {
        message: () => "element is not in the document",
        pass: false,
      };
    }

    const computedStyle = window.getComputedStyle(received);
    let pass = true;

    if (typeof style === "string") {
      // Parse CSS string
      const styles = style.split(";").filter((s) => s.trim());
      for (const s of styles) {
        const [prop, value] = s.split(":").map((v) => v.trim());
        if (computedStyle.getPropertyValue(prop) !== value) {
          pass = false;
          break;
        }
      }
    } else {
      // Object format
      for (const [prop, value] of Object.entries(style)) {
        const cssProperty = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
        if (computedStyle.getPropertyValue(cssProperty) !== String(value)) {
          pass = false;
          break;
        }
      }
    }

    return {
      message: () => `expected element ${pass ? "not " : ""}to have style`,
      pass,
    };
  },
});

// Declare the extended matchers for TypeScript
declare module "vitest" {
  interface Assertion<T = any> {
    toBeInTheDocument(): T;
    toBeVisible(): T;
    toHaveStyle(style: string | Record<string, any>): T;
  }
}
