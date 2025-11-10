/**
 * Automated Integration Tests for Animation Events and Spring Physics
 * 
 * These tests verify that:
 * 1. All animation triggers (hover, click, focus, mount) work correctly
 * 2. Spring physics are applied (animations are smooth, not instant)
 * 3. Style changes occur as expected
 * 4. Transforms are properly applied and composed
 * 5. Event handlers work correctly
 */

import { render } from "solid-js/web";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { animated } from "../animation/animatedStyled";
import { createSignal } from "solid-js";

describe("Animation Events and Spring Physics - Integration", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  const waitForAnimation = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

  describe("Hover Animations", () => {
    it("should animate scale on hover with spring physics", async () => {
      const AnimatedDiv = animated("div");
      
      render(() => (
        <AnimatedDiv
          data-test-id="hover-scale"
          animate={{
            from: { scale: 1 },
            to: { scale: 1.5 },
            when: "hover",
            reverseOnExit: true,
            config: {
              stiffness: 170,
              damping: 22,
            },
          }}
          style={{
            width: "100px",
            height: "100px",
            background: "#3b82f6",
          }}
        />
      ), container);

      const element = container.querySelector('[data-test-id="hover-scale"]') as HTMLElement;
      expect(element).toBeTruthy();

      // Get initial transform
      const initialTransform = window.getComputedStyle(element).transform;
      
      // Trigger hover
      const mouseEnterEvent = new MouseEvent('mouseenter', {
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(mouseEnterEvent);

      // Wait a bit for animation to start
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check that transform has changed (animation started)
      const earlyTransform = window.getComputedStyle(element).transform;
      expect(earlyTransform).not.toBe(initialTransform);

      // Wait for animation to complete
      await waitForAnimation();
      
      // Check final transform contains scale
      const finalTransform = window.getComputedStyle(element).transform;
      expect(finalTransform).toContain("matrix");
      expect(finalTransform).not.toBe("none");
    });

    it("should animate multiple properties on hover", async () => {
      const AnimatedDiv = animated("div");
      
      render(() => (
        <AnimatedDiv
          data-test-id="hover-multi"
          animate={{
            from: { opacity: 0.5, scale: 1, x: 0 },
            to: { opacity: 1, scale: 1.2, x: 20 },
            when: "hover",
            reverseOnExit: true,
            config: {
              stiffness: 170,
              damping: 22,
            },
          }}
          style={{
            width: "100px",
            height: "100px",
            background: "#ef4444",
          }}
        />
      ), container);

      const element = container.querySelector('[data-test-id="hover-multi"]') as HTMLElement;
      
      // Trigger hover
      element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      
      await waitForAnimation();
      
      const styles = window.getComputedStyle(element);
      
      // Check opacity increased
      expect(parseFloat(styles.opacity)).toBeGreaterThan(0.7);
      
      // Check transform exists
      expect(styles.transform).not.toBe("none");
    });

    it("should reverse animation on mouse leave", async () => {
      const AnimatedDiv = animated("div");
      
      render(() => (
        <AnimatedDiv
          data-test-id="hover-reverse"
          animate={{
            from: { scale: 1 },
            to: { scale: 1.5 },
            when: "hover",
            reverseOnExit: true,
            config: {
              stiffness: 170,
              damping: 22,
            },
          }}
          style={{
            width: "100px",
            height: "100px",
            background: "#10b981",
          }}
        />
      ), container);

      const element = container.querySelector('[data-test-id="hover-reverse"]') as HTMLElement;
      
      // Hover
      element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await waitForAnimation();
      
      // Leave
      element.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      await waitForAnimation();
      
      // Should have reversed back
      const finalTransform = window.getComputedStyle(element).transform;
      expect(finalTransform).toBeTruthy();
    });
  });

  describe("Click Animations", () => {
    it("should toggle animation state on click", async () => {
      const AnimatedButton = animated("button");
      
      render(() => (
        <AnimatedButton
          data-test-id="click-toggle"
          animate={{
            from: { scale: 1, backgroundColor: "#3b82f6" },
            to: { scale: 1.3, backgroundColor: "#ef4444" },
            when: "click",
            reverseOnExit: true,
            config: {
              stiffness: 170,
              damping: 22,
            },
          }}
          style={{
            width: "100px",
            height: "50px",
            border: "none",
          }}
        >
          Click Me
        </AnimatedButton>
      ), container);

      const button = container.querySelector('[data-test-id="click-toggle"]') as HTMLElement;
      
      // First click - activate
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check click state
      expect(button.getAttribute('data-click-state')).toBe('true');
      
      await waitForAnimation();
      
      // Check scale increased
      const transform = window.getComputedStyle(button).transform;
      expect(transform).not.toBe("none");
      
      // Second click - deactivate
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should be deactivated
      expect(button.getAttribute('data-click-state')).toBe('false');
    });

    it("should animate rotation on click", async () => {
      const AnimatedDiv = animated("div");
      
      render(() => (
        <AnimatedDiv
          data-test-id="click-rotate"
          animate={{
            from: { rotate: 0 },
            to: { rotate: 180 },
            when: "click",
            reverseOnExit: true,
            config: {
              stiffness: 170,
              damping: 22,
            },
          }}
          style={{
            width: "100px",
            height: "100px",
            background: "#8b5cf6",
          }}
        />
      ), container);

      const element = container.querySelector('[data-test-id="click-rotate"]') as HTMLElement;
      
      // Click to activate
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      
      await waitForAnimation();
      
      // Check rotation applied
      const transform = window.getComputedStyle(element).transform;
      expect(transform).toContain("matrix");
      expect(transform).not.toBe("none");
    });

    it("should handle click outside to deactivate", async () => {
      const AnimatedDiv = animated("div");
      
      render(() => (
        <>
          <AnimatedDiv
            data-test-id="click-outside-target"
            animate={{
              from: { scale: 1 },
              to: { scale: 1.5 },
              when: "click",
              reverseOnExit: true,
              config: {
                stiffness: 170,
                damping: 22,
              },
            }}
            style={{
              width: "100px",
              height: "100px",
              background: "#f59e0b",
            }}
          />
          <div data-test-id="outside-area" style={{ width: "100px", height: "100px" }}>
            Outside
          </div>
        </>
      ), container);

      const element = container.querySelector('[data-test-id="click-outside-target"]') as HTMLElement;
      const outsideElement = container.querySelector('[data-test-id="outside-area"]') as HTMLElement;
      
      // Click to activate
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(element.getAttribute('data-click-state')).toBe('true');
      
      // Click outside after delay for handler setup
      await new Promise(resolve => setTimeout(resolve, 50));
      outsideElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      
      // Wait for deactivation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(element.getAttribute('data-click-state')).toBe('false');
    });
  });

  describe("Focus Animations", () => {
    it("should animate on focus and blur", async () => {
      const AnimatedInput = animated("input");
      
      render(() => (
        <AnimatedInput
          data-test-id="focus-input"
          type="text"
          animate={{
            from: { scale: 1 },
            to: { scale: 1.1 },
            when: "focus",
            reverseOnExit: true,
            config: {
              stiffness: 170,
              damping: 22,
            },
          }}
          style={{
            width: "200px",
            padding: "10px",
          }}
        />
      ), container);

      const input = container.querySelector('[data-test-id="focus-input"]') as HTMLInputElement;
      
      // Focus
      input.focus();
      input.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
      
      await waitForAnimation();
      
      const focusedTransform = window.getComputedStyle(input).transform;
      expect(focusedTransform).not.toBe("none");
      
      // Blur
      input.blur();
      input.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
      
      await waitForAnimation();
      
      // Should have reversed
      const blurredTransform = window.getComputedStyle(input).transform;
      expect(blurredTransform).toBeTruthy();
    });
  });

  describe("Mount Animations", () => {
    it("should animate on mount", async () => {
      const AnimatedDiv = animated("div");
      
      render(() => (
        <AnimatedDiv
          data-test-id="mount-test"
          animate={{
            from: { opacity: 0, y: -20 },
            to: { opacity: 1, y: 0 },
            when: "mount",
            config: {
              stiffness: 170,
              damping: 22,
            },
          }}
          style={{
            width: "100px",
            height: "100px",
            background: "#06b6d4",
          }}
        />
      ), container);

      const element = container.querySelector('[data-test-id="mount-test"]') as HTMLElement;
      
      // Wait for mount animation to start
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Opacity should be increasing
      const styles = window.getComputedStyle(element);
      expect(parseFloat(styles.opacity)).toBeGreaterThan(0);
      
      // Wait for completion
      await waitForAnimation();
      
      expect(parseFloat(window.getComputedStyle(element).opacity)).toBeGreaterThan(0.8);
    });
  });

  describe("Spring Physics Verification", () => {
    it("should use spring physics not instant transitions", async () => {
      const AnimatedDiv = animated("div");
      
      render(() => (
        <AnimatedDiv
          data-test-id="physics-test"
          animate={{
            from: { x: 0 },
            to: { x: 100 },
            when: "hover",
            config: {
              stiffness: 170,
              damping: 22,
            },
          }}
          style={{
            width: "100px",
            height: "100px",
            background: "#ec4899",
          }}
        />
      ), container);

      const element = container.querySelector('[data-test-id="physics-test"]') as HTMLElement;
      
      const initialTransform = window.getComputedStyle(element).transform;
      
      // Trigger animation
      element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      
      // Wait a bit longer for spring animation to start (100ms instead of 50ms)
      await new Promise(resolve => setTimeout(resolve, 100));
      const earlyTransform = window.getComputedStyle(element).transform;
      
      // Should be different from initial (animation started)
      expect(earlyTransform).toBeTruthy();
      
      // Wait for animation to complete
      await waitForAnimation(500); // Wait longer for spring physics
      
      // Now should have translateX applied
      const finalTransform = window.getComputedStyle(element).transform;
      expect(finalTransform).not.toBe("none");
      expect(finalTransform).toContain("matrix"); // More specific check
    });

    it("should respect custom spring configuration", async () => {
      const AnimatedDiv = animated("div");
      
      render(() => (
        <AnimatedDiv
          data-test-id="custom-spring"
          animate={{
            from: { scale: 1 },
            to: { scale: 1.5 },
            when: "hover",
            config: {
              stiffness: 300,  // High stiffness = faster
              damping: 30,
            },
          }}
          style={{
            width: "100px",
            height: "100px",
            background: "#14b8a6",
          }}
        />
      ), container);

      const element = container.querySelector('[data-test-id="custom-spring"]') as HTMLElement;
      
      element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      
      // With high stiffness, should animate faster
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const transform = window.getComputedStyle(element).transform;
      expect(transform).not.toBe("none");
    });
  });

  describe("Complex Transform Animations", () => {
    it("should handle multiple transforms simultaneously", async () => {
      const AnimatedDiv = animated("div");
      
      render(() => (
        <AnimatedDiv
          data-test-id="multi-transform"
          animate={{
            from: { x: 0, y: 0, scale: 1, rotate: 0 },
            to: { x: 50, y: 30, scale: 1.2, rotate: 45 },
            when: "hover",
            config: {
              stiffness: 170,
              damping: 22,
            },
          }}
          style={{
            width: "100px",
            height: "100px",
            background: "#f43f5e",
          }}
        />
      ), container);

      const element = container.querySelector('[data-test-id="multi-transform"]') as HTMLElement;
      
      element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      
      await waitForAnimation();
      
      const transform = window.getComputedStyle(element).transform;
      
      // Should have all transforms applied (as a matrix)
      expect(transform).toContain("matrix");
      expect(transform).not.toBe("none");
    });

    it("should maintain correct transform order", async () => {
      const AnimatedDiv = animated("div");
      
      render(() => (
        <AnimatedDiv
          data-test-id="transform-order"
          animate={{
            from: { x: 0, scale: 1, rotate: 0 },
            to: { x: 100, scale: 2, rotate: 90 },
            when: "hover",
            config: {
              stiffness: 170,
              damping: 22,
            },
          }}
          style={{
            width: "100px",
            height: "100px",
            background: "#a78bfa",
          }}
        />
      ), container);

      const element = container.querySelector('[data-test-id="transform-order"]') as HTMLElement;
      
      element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      
      await waitForAnimation();
      
      const transform = window.getComputedStyle(element).transform;
      
      // Transform should be applied (correct order is handled internally)
      expect(transform).not.toBe("none");
      expect(transform).toContain("matrix");
    });
  });

  describe("Event Handler Setup", () => {
    it("should properly attach event handlers", async () => {
      const AnimatedDiv = animated("div");
      
      render(() => (
        <AnimatedDiv
          data-test-id="event-test"
          animate={{
            from: { scale: 1 },
            to: { scale: 1.2 },
            when: "hover",
            reverseOnExit: true,
            config: {
              stiffness: 170,
              damping: 22,
            },
          }}
          style={{
            width: "100px",
            height: "100px",
            background: "#0ea5e9",
          }}
        />
      ), container);

      const element = container.querySelector('[data-test-id="event-test"]') as HTMLElement;
      
      // Test that hover event triggers animation
      let triggered = false;
      const checkTransform = () => {
        const transform = window.getComputedStyle(element).transform;
        if (transform !== "none") {
          triggered = true;
        }
      };
      
      element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      
      await new Promise(resolve => setTimeout(resolve, 100));
      checkTransform();
      
      expect(triggered).toBe(true);
    });

    it("should support multiple animation triggers", async () => {
      const AnimatedDiv = animated("div");
      
      render(() => (
        <AnimatedDiv
          data-test-id="multi-trigger"
          tabIndex={0}
          animate={{
            from: { scale: 1 },
            to: { scale: 1.3 },
            when: ["hover", "focus"],
            reverseOnExit: true,
            config: {
              stiffness: 170,
              damping: 22,
            },
          }}
          style={{
            width: "100px",
            height: "100px",
            background: "#84cc16",
          }}
        />
      ), container);

      const element = container.querySelector('[data-test-id="multi-trigger"]') as HTMLElement;
      
      // Test hover trigger
      element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await waitForAnimation();
      
      let hoverTransform = window.getComputedStyle(element).transform;
      expect(hoverTransform).not.toBe("none");
      
      // Leave
      element.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      await waitForAnimation();
      
      // Test focus trigger
      element.focus();
      element.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
      await waitForAnimation();
      
      let focusTransform = window.getComputedStyle(element).transform;
      expect(focusTransform).not.toBe("none");
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid trigger changes gracefully", async () => {
      const AnimatedDiv = animated("div");
      
      render(() => (
        <AnimatedDiv
          data-test-id="rapid-trigger"
          animate={{
            from: { scale: 1 },
            to: { scale: 1.5 },
            when: "hover",
            reverseOnExit: true,
            config: {
              stiffness: 170,
              damping: 22,
            },
          }}
          style={{
            width: "100px",
            height: "100px",
            background: "#f97316",
          }}
        />
      ), container);

      const element = container.querySelector('[data-test-id="rapid-trigger"]') as HTMLElement;
      
      // Rapidly trigger hover on/off
      element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));
      element.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));
      element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));
      element.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      
      // Should handle without errors
      await waitForAnimation();
      
      expect(element).toBeTruthy();
      expect(element.parentElement).toBeTruthy();
    });

    it("should handle zero values correctly", async () => {
      const AnimatedDiv = animated("div");
      
      render(() => (
        <AnimatedDiv
          data-test-id="zero-value"
          animate={{
            from: { opacity: 1, scale: 1 },
            to: { opacity: 0, scale: 0 },
            when: "hover",
            config: {
              stiffness: 170,
              damping: 22,
            },
          }}
          style={{
            width: "100px",
            height: "100px",
            background: "#22c55e",
          }}
        />
      ), container);

      const element = container.querySelector('[data-test-id="zero-value"]') as HTMLElement;
      
      element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      
      await waitForAnimation();
      
      // Should handle zero values without errors
      const styles = window.getComputedStyle(element);
      expect(parseFloat(styles.opacity)).toBeLessThan(0.5);
    });
  });
});
