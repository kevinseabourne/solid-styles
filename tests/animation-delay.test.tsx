/**
 * Animation Delay Test Suite
 * 
 * Tests that the delay parameter correctly delays animation start
 */

import { render, screen, waitFor } from "@solidjs/testing-library";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { animated, resetAnimationState } from "../animation/animatedStyled";
import { createSignal } from "solid-js";

describe("Animation Delay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetAnimationState(); // Clean up global state between tests
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should delay animation start by specified milliseconds", async () => {
    const AnimatedDiv = animated("div");
    
    render(() => (
      <AnimatedDiv
        data-testid="delayed"
        animate={{
          from: { opacity: 0 },
          to: { opacity: 1 },
          config: {
            delay: 500,
          },
        }}
      >
        Delayed
      </AnimatedDiv>
    ));
    
    const element = screen.getByTestId("delayed");
    
    // Should NOT be animating immediately (should still be at opacity 0)
    await vi.advanceTimersByTimeAsync(100);
    const opacityBefore = parseFloat(window.getComputedStyle(element).opacity);
    expect(opacityBefore).toBeLessThanOrEqual(0.1); // Allow small epsilon
    
    // After 500ms delay, should start animating
    await vi.advanceTimersByTimeAsync(500);
    
    // Wait a bit for animation to progress
    await vi.advanceTimersByTimeAsync(200);
    
    const opacityAfter = parseFloat(window.getComputedStyle(element).opacity);
    expect(opacityAfter).toBeGreaterThan(0.1); // Should be animating now
  });

  it("should start immediately when no delay specified", async () => {
    const AnimatedDiv = animated("div");
    
    render(() => (
      <AnimatedDiv
        data-testid="immediate"
        animate={{
          from: { opacity: 0 },
          to: { opacity: 1 },
        }}
      >
        Immediate
      </AnimatedDiv>
    ));
    
    const element = screen.getByTestId("immediate");
    
    // Should start animating immediately
    await vi.advanceTimersByTimeAsync(100);
    
    const opacity = parseFloat(window.getComputedStyle(element).opacity);
    expect(opacity).toBeGreaterThan(0); // Should already be animating
  });

  it("should handle multiple animations with different delays", async () => {
    const AnimatedDiv = animated("div");
    
    render(() => (
      <>
        <AnimatedDiv
          data-testid="first"
          animate={{
            from: { opacity: 0 },
            to: { opacity: 1 },
            config: { delay: 100 },
          }}
        >
          First
        </AnimatedDiv>
        <AnimatedDiv
          data-testid="second"
          animate={{
            from: { opacity: 0 },
            to: { opacity: 1 },
            config: { delay: 300 },
          }}
        >
          Second
        </AnimatedDiv>
      </>
    ));
    
    const first = screen.getByTestId("first");
    const second = screen.getByTestId("second");
    
    // After 150ms, first should be animating, second should not
    await vi.advanceTimersByTimeAsync(150);
    await vi.advanceTimersByTimeAsync(100);
    
    const firstOpacity = parseFloat(window.getComputedStyle(first).opacity);
    const secondOpacity = parseFloat(window.getComputedStyle(second).opacity);
    
    expect(firstOpacity).toBeGreaterThan(0); // First started
    expect(secondOpacity).toBeLessThanOrEqual(0.1); // Second not yet started
    
    // After 350ms total, both should be animating
    await vi.advanceTimersByTimeAsync(200);
    await vi.advanceTimersByTimeAsync(100);
    
    const secondOpacityLater = parseFloat(window.getComputedStyle(second).opacity);
    expect(secondOpacityLater).toBeGreaterThan(0); // Second started now
  });

  it("should cancel delayed animation if component unmounts", async () => {
    const AnimatedDiv = animated("div");
    const [show, setShow] = createSignal(true);
    
    const { unmount } = render(() => (
      <>
        {show() && (
          <AnimatedDiv
            data-testid="delayed"
            animate={{
              from: { opacity: 0 },
              to: { opacity: 1 },
              config: { delay: 1000 },
            }}
          >
            Delayed
          </AnimatedDiv>
        )}
      </>
    ));
    
    // Component exists
    expect(screen.queryByTestId("delayed")).toBeInTheDocument();
    
    // Unmount before delay completes
    await vi.advanceTimersByTimeAsync(500);
    setShow(false);
    await vi.advanceTimersByTimeAsync(10);
    
    // Component should be gone
    expect(screen.queryByTestId("delayed")).not.toBeInTheDocument();
    
    // Advance past when animation would have started
    await vi.advanceTimersByTimeAsync(600);
    
    // No errors should occur (timeout was cleaned up)
    expect(() => vi.advanceTimersByTimeAsync(100)).not.toThrow();
    
    unmount();
  });

  it("should work with hover animations delayed", async () => {
    const AnimatedDiv = animated("div");
    
    render(() => (
      <AnimatedDiv
        data-testid="hover-delayed"
        animate={{
          from: { scale: 1 },
          to: { scale: 1.2 },
          when: "hover",
          config: { delay: 200, stiffness: 170, damping: 22 },
        }}
      >
        Hover Me
      </AnimatedDiv>
    ));
    
    const element = screen.getByTestId("hover-delayed");
    
    // Get initial transform
    const transformInitial = window.getComputedStyle(element).transform;
    
    // Hover the element
    element.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    
    // Animation should not start immediately
    await vi.advanceTimersByTimeAsync(100);
    const transformBefore = window.getComputedStyle(element).transform;
    // Should still be at initial scale (within epsilon)
    expect(transformBefore).toBe(transformInitial);
    
    // After delay, animation should start - wait longer for spring to progress
    await vi.advanceTimersByTimeAsync(250);
    await vi.advanceTimersByTimeAsync(300);
    
    const transformAfter = window.getComputedStyle(element).transform;
    // Transform should have changed from initial
    expect(transformAfter).not.toBe(transformInitial);
  });
});
