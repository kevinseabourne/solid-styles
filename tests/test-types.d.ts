/// <reference types="solid-js" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Re-export all HTML elements from solid-js
      [elem: string]: any;
    }
  }
}

export {};
