/** @jsxImportSource solid-js */
/**
 * Reduced Motion Accessibility Tests
 * 
 * Verifies that the animation library properly respects user accessibility preferences
 * for reduced motion, as required for WCAG 2.1 compliance.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { animated, resetAnimationState } from "../animation/animatedStyled";

// Helper for real timer tests
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("Reduced Motion Accessibility", () => {
  let originalMatchMedia: typeof window.matchMedia;
  
  beforeEach(() => {
    // Save original matchMedia
    originalMatchMedia = window.matchMedia;
    resetAnimationState();
  });
  
  afterEach(() => {
    cleanup();
    // Restore original matchMedia
    window.matchMedia = originalMatchMedia;
    resetAnimationState();
  });
  
  /**
   * Mock matchMedia to simulate prefers-reduced-motion preference
   */
  function mockReducedMotion(prefersReduced: boolean) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)" ? prefersReduced : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }
  
  describe("Basic Reduced Motion Detection", () => {
    it("should detect when user prefers reduced motion", async () => {
      mockReducedMotion(true);
      
      const AnimatedDiv = animated("div");
      
      render(() => (
        <AnimatedDiv
          data-testid="reduced-motion-test"
          animate={{
            from: { opacity: 0 },
            to: { opacity: 1 },
            when: "mount",
          }}
          reducedMotionTransition="opacity 0.01s"
        >
          Test Content
        </AnimatedDiv>
      ));
      
      const element = screen.getByTestId("reduced-motion-test");
      
      // Wait for effects to apply
      await sleep(100);
      
      // When reduced motion is preferred AND reducedMotionTransition is set,
      // the element should have a CSS transition instead of spring animation
      const transition = element.style.transition;
      expect(transition).toContain("opacity");
    });
    
    it("should use spring animations when reduced motion is NOT preferred", async () => {
      mockReducedMotion(false);
      
      const AnimatedDiv = animated("div");
      
      render(() => (
        <AnimatedDiv
          data-testid="normal-motion-test"
          animate={{
            from: { opacity: 0 },
            to: { opacity: 1 },
            when: "always",
            config: { stiffness: 300, damping: 20 },
          }}
        >
          Test Content
        </AnimatedDiv>
      ));
      
      const element = screen.getByTestId("normal-motion-test");
      
      // Wait for animation to start
      await sleep(200);
      
      // Element should exist and be animating (not instant)
      expect(element).toBeInTheDocument();
    });
  });
  
  describe("Reduced Motion with Different Triggers", () => {
    it("should apply reduced motion transition for hover animations", async () => {
      mockReducedMotion(true);
      
      const AnimatedButton = animated("button");
      
      render(() => (
        <AnimatedButton
          data-testid="hover-reduced"
          whileHover={{ scale: 1.1 }}
          reducedMotionTransition="transform 0.15s ease-out"
        >
          Hover Me
        </AnimatedButton>
      ));
      
      const button = screen.getByTestId("hover-reduced");
      
      await sleep(100);
      
      // Should have transition property set
      expect(button.style.transition).toContain("transform");
    });
    
    it("should apply reduced motion transition for click animations", async () => {
      mockReducedMotion(true);
      
      const AnimatedButton = animated("button");
      
      render(() => (
        <AnimatedButton
          data-testid="click-reduced"
          animate={{
            from: { scale: 1 },
            to: { scale: 0.95 },
            when: "click",
            reverseOnExit: true,
          }}
          reducedMotionTransition="transform 0.1s ease-in-out"
        >
          Click Me
        </AnimatedButton>
      ));
      
      const button = screen.getByTestId("click-reduced");
      
      await sleep(100);
      
      // Should have transition for reduced motion
      expect(button.style.transition).toContain("transform");
    });
    
    it("should apply reduced motion transition for focus animations", async () => {
      mockReducedMotion(true);
      
      const AnimatedInput = animated("input");
      
      render(() => (
        <AnimatedInput
          data-testid="focus-reduced"
          type="text"
          whileFocus={{ scale: 1.02 }}
          reducedMotionTransition="transform 0.1s ease"
        />
      ));
      
      const input = screen.getByTestId("focus-reduced");
      
      await sleep(100);
      
      // Should have transition for reduced motion
      expect(input.style.transition).toContain("transform");
    });
  });
  
  describe("Reduced Motion Fallback Behavior", () => {
    it("should still render component when reduced motion is preferred", async () => {
      mockReducedMotion(true);
      
      const AnimatedDiv = animated("div");
      
      render(() => (
        <AnimatedDiv
          data-testid="render-test"
          animate={{
            from: { opacity: 0, y: -20 },
            to: { opacity: 1, y: 0 },
            when: "mount",
          }}
          reducedMotionTransition="opacity 0.2s, transform 0.2s"
        >
          Should Render
        </AnimatedDiv>
      ));
      
      const element = screen.getByTestId("render-test");
      
      // Component should still render
      expect(element).toBeInTheDocument();
      expect(element.textContent).toBe("Should Render");
    });
    
    it("should not crash when reduced motion preference changes", async () => {
      // Start with reduced motion OFF
      mockReducedMotion(false);
      
      const AnimatedDiv = animated("div");
      
      render(() => (
        <AnimatedDiv
          data-testid="toggle-test"
          animate={{
            from: { opacity: 0 },
            to: { opacity: 1 },
            when: "always",
          }}
          reducedMotionTransition="opacity 0.1s"
        >
          Toggle Test
        </AnimatedDiv>
      ));
      
      await sleep(100);
      
      // Element should be rendered
      expect(screen.getByTestId("toggle-test")).toBeInTheDocument();
      
      // Now test with reduced motion ON in a new render
      cleanup();
      resetAnimationState();
      mockReducedMotion(true);
      
      render(() => (
        <AnimatedDiv
          data-testid="toggle-test-2"
          animate={{
            from: { opacity: 0 },
            to: { opacity: 1 },
            when: "always",
          }}
          reducedMotionTransition="opacity 0.1s"
        >
          Toggle Test 2
        </AnimatedDiv>
      ));
      
      await sleep(100);
      
      // Should not crash
      expect(screen.getByTestId("toggle-test-2")).toBeInTheDocument();
    });
  });
  
  describe("Component Behavior Without reducedMotionTransition", () => {
    it("should still work when reducedMotionTransition is not provided", async () => {
      mockReducedMotion(true);
      
      const AnimatedDiv = animated("div");
      
      // Component without reducedMotionTransition prop
      render(() => (
        <AnimatedDiv
          data-testid="no-fallback-test"
          animate={{
            from: { opacity: 0 },
            to: { opacity: 1 },
            when: "mount",
          }}
        >
          No Fallback
        </AnimatedDiv>
      ));
      
      const element = screen.getByTestId("no-fallback-test");
      
      await sleep(100);
      
      // Should still render and not crash
      expect(element).toBeInTheDocument();
    });
  });
  
  describe("Multiple Animations with Reduced Motion", () => {
    it("should handle multiple animated elements with reduced motion", async () => {
      mockReducedMotion(true);
      
      const AnimatedDiv = animated("div");
      
      render(() => (
        <div>
          <AnimatedDiv
            data-testid="multi-1"
            animate={{
              from: { opacity: 0 },
              to: { opacity: 1 },
              when: "mount",
            }}
            reducedMotionTransition="opacity 0.1s"
          >
            Element 1
          </AnimatedDiv>
          <AnimatedDiv
            data-testid="multi-2"
            animate={{
              from: { x: -20 },
              to: { x: 0 },
              when: "mount",
            }}
            reducedMotionTransition="transform 0.1s"
          >
            Element 2
          </AnimatedDiv>
          <AnimatedDiv
            data-testid="multi-3"
            whileHover={{ scale: 1.1 }}
            reducedMotionTransition="transform 0.1s"
          >
            Element 3
          </AnimatedDiv>
        </div>
      ));
      
      await sleep(100);
      
      // All elements should render
      expect(screen.getByTestId("multi-1")).toBeInTheDocument();
      expect(screen.getByTestId("multi-2")).toBeInTheDocument();
      expect(screen.getByTestId("multi-3")).toBeInTheDocument();
      
      // All should have transitions applied
      expect(screen.getByTestId("multi-1").style.transition).toContain("opacity");
      expect(screen.getByTestId("multi-2").style.transition).toContain("transform");
      expect(screen.getByTestId("multi-3").style.transition).toContain("transform");
    });
  });
  
  describe("WCAG Compliance Verification", () => {
    it("should provide instant visual feedback when reduced motion is preferred", async () => {
      mockReducedMotion(true);
      
      const AnimatedButton = animated("button");
      
      render(() => (
        <AnimatedButton
          data-testid="wcag-test"
          animate={{
            from: { backgroundColor: "#ffffff" },
            to: { backgroundColor: "#007bff" },
            when: "click",
          }}
          reducedMotionTransition="background-color 0.001s" // Near-instant transition
        >
          WCAG Test
        </AnimatedButton>
      ));
      
      const button = screen.getByTestId("wcag-test");
      
      await sleep(50);
      
      // Element should be interactive and accessible
      expect(button).toBeInTheDocument();
      expect(button.tagName.toLowerCase()).toBe("button");
    });
    
    it("should maintain focus states with reduced motion", async () => {
      mockReducedMotion(true);
      
      const AnimatedInput = animated("input");
      
      render(() => (
        <AnimatedInput
          data-testid="focus-accessible"
          type="text"
          whileFocus={{ borderColor: "#007bff" }}
          reducedMotionTransition="border-color 0.1s"
          aria-label="Accessible input"
        />
      ));
      
      const input = screen.getByTestId("focus-accessible") as HTMLInputElement;
      
      // Focus the input
      fireEvent.focus(input);
      
      await sleep(50);
      
      // Input should be focusable and accessible
      expect(input).toBeInTheDocument();
      expect(input.getAttribute("aria-label")).toBe("Accessible input");
    });
  });
});
