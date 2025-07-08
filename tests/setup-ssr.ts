// SSR Test setup file for Node environment
import { vi } from "vitest";

// Polyfill for Node.js environment
if (typeof globalThis.HTMLElement === "undefined") {
  // @ts-ignore
  globalThis.HTMLElement = class HTMLElement {
    style: Record<string, any> = {};
    classList = {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(),
      toggle: vi.fn(),
    };
    setAttribute = vi.fn();
    getAttribute = vi.fn();
    removeAttribute = vi.fn();
  };
}

// Mock document for SSR
if (typeof globalThis.document === "undefined") {
  // Create a proper NodeList-like array for querySelectorAll
  const createMockNodeList = (elements: any[] = []) => {
    const nodeList = Object.assign(elements, {
      item: vi.fn((index: number) => elements[index]),
      length: elements.length,
      forEach: Array.prototype.forEach.bind(elements),
      [Symbol.iterator]: Array.prototype[Symbol.iterator].bind(elements),
    });
    return nodeList;
  };

  // @ts-ignore
  globalThis.document = {
    createElement: vi.fn((tag: string) => ({
      tagName: tag,
      style: {},
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(),
        toggle: vi.fn(),
      },
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      removeAttribute: vi.fn(),
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      querySelectorAll: vi.fn(() => createMockNodeList()),
    })) as any,
    createTextNode: vi.fn((text: string) => ({ nodeValue: text })) as any,
    createComment: vi.fn((text: string) => ({ nodeValue: text })) as any,
    getElementById: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(() => createMockNodeList()) as any,
    head: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    } as any,
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    } as any,
  };
}

// SSR-specific globals
// @ts-ignore
globalThis.isServer = true;
