/**
 * Critical Bug Fix Tests
 * 
 * Tests for the 3 critical bugs found and fixed in v2.4.0:
 * 1. Delay + reverseOnExit (reverse should not delay)
 * 2. Animation state during delay (should be "pending" not "idle")
 * 3. Unmount portal race condition (rapid toggles)
 */

import { render, screen, fireEvent, cleanup } from "@solidjs/testing-library";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { animated, resetAnimationState } from "../animation/animatedStyled";
import { useUnmountPortal } from "../animation/hooks/useUnmountPortal.tsx";
import { useAnimation } from "../animation/hooks/useAnimation";
import { createSignal, Show } from "solid-js";

describe("Critical Bug Fixes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetAnimationState(); // Clean up global state between tests
  });

  afterEach(() => {
    cleanup(); // Clean up rendered components
    vi.useRealTimers();
    resetAnimationState(); // Clean up global state after test
  });

  describe("BUG #1: Delay + reverseOnExit", () => {
    it("should NOT apply delay to reverse animation", async () => {
      const AnimatedDiv = animated("div");
      
      render(() => (
        <AnimatedDiv
          data-testid="hover-elem"
          animate={{
            from: { scale: 1 },
            to: { scale: 1.5 },
            when: "hover",
            reverseOnExit: true,
            config: { delay: 500, stiffness: 170, damping: 22 }
          }}
        >
          Hover me
        </AnimatedDiv>
      ));
      
      const element = screen.getByTestId("hover-elem");
      
      // Hover in - should wait 500ms before starting
      fireEvent.mouseEnter(element);
      
      await vi.advanceTimersByTimeAsync(100);
      let transform = window.getComputedStyle(element).transform;
      // Should still be at scale 1 (no animation yet) - identity matrix
      expect(transform).toMatch(/matrix\(1,\s*0,\s*0,\s*1,\s*0,\s*0\)/);
      
      // After 500ms delay, animation should start
      await vi.advanceTimersByTimeAsync(450);
      await vi.advanceTimersByTimeAsync(200);
      
      transform = window.getComputedStyle(element).transform;
      // Should now be animating/animated (scale > 1) - not identity matrix anymore
      expect(transform).not.toMatch(/matrix\(1,\s*0,\s*0,\s*1,\s*0,\s*0\)/);
      
      // Hover OUT - should start reversing IMMEDIATELY (no 500ms delay)
      fireEvent.mouseLeave(element);
      
      await vi.advanceTimersByTimeAsync(50);
      const transformAfterHoverOut = window.getComputedStyle(element).transform;
      
      // CRITICAL: Transform should have changed immediately, not waiting for delay
      // If bug exists, transform would be unchanged for 500ms
      await vi.advanceTimersByTimeAsync(100);
      const transformAfter150ms = window.getComputedStyle(element).transform;
      
      // Should be animating back (changing)
      expect(transformAfter150ms).not.toBe(transformAfterHoverOut);
    });

    it("should work with click animations WITHOUT delay first", async () => {
      // IMPORTANT: This test uses real timers to properly test RAF-based animations
      vi.useRealTimers();
      
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      const AnimatedButton = animated("button");
      
      render(() => (
        <AnimatedButton
          data-testid="simple-click-btn"
          animate={{
            from: { opacity: 0.5 },
            to: { opacity: 1 },
            when: "click",
            reverseOnExit: true,
            config: { stiffness: 300, damping: 20 } // Fast animation
          }}
        >
          Click me
        </AnimatedButton>
      ));
      
      const button = screen.getByTestId("simple-click-btn");
      
      // Wait for component to mount and animation to be registered
      await sleep(100);
      
      // Initial opacity should be at 'from' value (0.5)
      const initialOpacity = parseFloat(window.getComputedStyle(button).opacity);
      expect(initialOpacity).toBeCloseTo(0.5, 1);
      
      // Click - should start animating
      fireEvent.click(button);
      
      // Wait for animation to progress
      await sleep(400);
      
      const finalOpacity = parseFloat(window.getComputedStyle(button).opacity);
      // Animation should have progressed past initial value
      expect(finalOpacity).toBeGreaterThan(initialOpacity);
    });

    it("should work with click animations + reverseOnExit + delay", async () => {
      // IMPORTANT: This test uses real timers to properly test RAF-based animations
      vi.useRealTimers();
      
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      const AnimatedButton = animated("button");
      
      render(() => (
        <AnimatedButton
          data-testid="click-btn"
          animate={{
            from: { opacity: 0.5 },
            to: { opacity: 1 },
            when: "click",
            reverseOnExit: true,
            config: { delay: 200, stiffness: 300, damping: 20 }
          }}
        >
          Click me
        </AnimatedButton>
      ));
      
      const button = screen.getByTestId("click-btn");
      
      // Wait for component to mount
      await sleep(100);
      
      // Initial opacity should be at 'from' value
      const initialOpacity = parseFloat(window.getComputedStyle(button).opacity);
      expect(initialOpacity).toBeCloseTo(0.5, 1);
      
      // Click - should wait 200ms delay before starting
      fireEvent.click(button);
      
      // Wait past delay + animation time
      await sleep(600);
      
      const opacityAfterClick = parseFloat(window.getComputedStyle(button).opacity);
      expect(opacityAfterClick).toBeGreaterThan(0.85);
      
      // Click again to toggle off
      fireEvent.click(button);
      
      // Wait for reverse animation (should start immediately, no delay)
      await sleep(400);
      
      const opacityAfterReverse = parseFloat(window.getComputedStyle(button).opacity);
      // Should have reversed toward initial value
      expect(opacityAfterReverse).toBeLessThan(opacityAfterClick);
    });
  });

  describe("BUG #2: Animation state during delay", () => {
    it("should set state to 'pending' during delay, not 'idle'", async () => {
      function TestComponent() {
        const animation = useAnimation({
          from: { opacity: 0 },
          to: { opacity: 1 },
          when: () => true,
          delay: 500
        });
        
        return (
          <div>
            <div data-testid="state">{animation.state()}</div>
            <div data-testid="content">Content</div>
          </div>
        );
      }
      
      render(() => <TestComponent />);
      
      // Initially should be pending (waiting for delay)
      await vi.advanceTimersByTimeAsync(10);
      const stateElem = screen.getByTestId("state");
      
      expect(stateElem.textContent).toBe("pending");
      
      // After 250ms, still pending
      await vi.advanceTimersByTimeAsync(250);
      expect(stateElem.textContent).toBe("pending");
      
      // After 500ms, should start running
      await vi.advanceTimersByTimeAsync(250);
      await vi.advanceTimersByTimeAsync(50);
      
      expect(stateElem.textContent).toBe("running");
    });

    it("should transition from idle → pending → running", async () => {
      function TestComponent() {
        const [start, setStart] = createSignal(false);
        const animation = useAnimation({
          from: { opacity: 0 },
          to: { opacity: 1 },
          when: start,
          delay: 200
        });
        
        return (
          <div>
            <button data-testid="start" onClick={() => setStart(true)}>Start</button>
            <div data-testid="state">{animation.state()}</div>
          </div>
        );
      }
      
      render(() => <TestComponent />);
      
      const stateElem = screen.getByTestId("state");
      
      // Initial state: idle
      expect(stateElem.textContent).toBe("idle");
      
      // Start animation
      fireEvent.click(screen.getByTestId("start"));
      await vi.advanceTimersByTimeAsync(10);
      
      // Should be pending
      expect(stateElem.textContent).toBe("pending");
      
      // After delay
      await vi.advanceTimersByTimeAsync(200);
      await vi.advanceTimersByTimeAsync(50);
      
      // Should be running
      expect(stateElem.textContent).toBe("running");
    });
  });

  describe("BUG #3: Unmount portal race condition", () => {
    it("should handle rapid show/hide/show cycles", async () => {
      function TestComponent() {
        const [show, setShow] = createSignal(true);
        const { shouldRender, isUnmounting } = useUnmountPortal(show, { duration: 300 });
        
        return (
          <div>
            <button data-testid="toggle" onClick={() => setShow(!show())}>Toggle</button>
            <button data-testid="hide" onClick={() => setShow(false)}>Hide</button>
            <button data-testid="show" onClick={() => setShow(true)}>Show</button>
            <Show when={shouldRender()}>
              <div data-testid="content" data-unmounting={isUnmounting()}>
                Content
              </div>
            </Show>
          </div>
        );
      }
      
      render(() => <TestComponent />);
      
      // Initial: visible
      expect(screen.getByTestId("content")).toBeInTheDocument();
      
      // Hide
      fireEvent.click(screen.getByTestId("hide"));
      await vi.advanceTimersByTimeAsync(10);
      
      // Should be unmounting
      expect(screen.getByTestId("content")).toBeInTheDocument();
      expect(screen.getByTestId("content").getAttribute("data-unmounting")).toBe("true");
      
      // Hide AGAIN during unmount animation (rapid double-click scenario)
      fireEvent.click(screen.getByTestId("hide"));
      await vi.advanceTimersByTimeAsync(10);
      
      // Should still be unmounting (not broken)
      expect(screen.getByTestId("content")).toBeInTheDocument();
      expect(screen.getByTestId("content").getAttribute("data-unmounting")).toBe("true");
      
      // Show again mid-animation
      await vi.advanceTimersByTimeAsync(100);
      fireEvent.click(screen.getByTestId("show"));
      await vi.advanceTimersByTimeAsync(10);
      
      // Should cancel unmount and be visible
      expect(screen.getByTestId("content")).toBeInTheDocument();
      expect(screen.getByTestId("content").getAttribute("data-unmounting")).toBe("false");
      
      // Should still be visible after original timeout would have fired
      await vi.advanceTimersByTimeAsync(300);
      expect(screen.getByTestId("content")).toBeInTheDocument();
    });

    it("should handle rapid hide clicks without breaking", async () => {
      function TestComponent() {
        const [show, setShow] = createSignal(true);
        const { shouldRender, isUnmounting } = useUnmountPortal(show, { duration: 200 });
        
        return (
          <div>
            <button data-testid="hide" onClick={() => setShow(false)}>Hide</button>
            <Show when={shouldRender()}>
              <div data-testid="content" data-unmounting={isUnmounting()}>
                Content
              </div>
            </Show>
          </div>
        );
      }
      
      render(() => <TestComponent />);
      
      const hideBtn = screen.getByTestId("hide");
      
      // Rapid clicks
      fireEvent.click(hideBtn);
      await vi.advanceTimersByTimeAsync(5);
      
      fireEvent.click(hideBtn);
      await vi.advanceTimersByTimeAsync(5);
      
      fireEvent.click(hideBtn);
      await vi.advanceTimersByTimeAsync(5);
      
      // Should still be animating out
      expect(screen.getByTestId("content")).toBeInTheDocument();
      expect(screen.getByTestId("content").getAttribute("data-unmounting")).toBe("true");
      
      // After duration, should be removed
      await vi.advanceTimersByTimeAsync(200);
      await vi.advanceTimersByTimeAsync(50);
      
      expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    });

    it("should not leak timeouts on rapid toggles", async () => {
      const onComplete = vi.fn();
      
      function TestComponent() {
        const [show, setShow] = createSignal(true);
        const { shouldRender } = useUnmountPortal(show, { 
          duration: 200,
          onComplete 
        });
        
        return (
          <div>
            <button data-testid="toggle" onClick={() => setShow(!show())}>Toggle</button>
            <Show when={shouldRender()}>
              <div data-testid="content">Content</div>
            </Show>
          </div>
        );
      }
      
      render(() => <TestComponent />);
      
      const toggleBtn = screen.getByTestId("toggle");
      
      // Rapid toggle 5 times
      for (let i = 0; i < 5; i++) {
        fireEvent.click(toggleBtn);
        await vi.advanceTimersByTimeAsync(50);
      }
      
      // Wait for all timeouts to potentially fire
      await vi.advanceTimersByTimeAsync(500);
      
      // onComplete should only be called ONCE (not 5 times - no timeout leaks)
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe("Integration: All fixes together", () => {
    it("should work with unmount animation + delay + reverseOnExit", async () => {
      const AnimatedDiv = animated("div");
      
      function TestComponent() {
        const [show, setShow] = createSignal(true);
        const { shouldRender, isUnmounting } = useUnmountPortal(show, { duration: 500 });
        
        return (
          <div>
            <button data-testid="toggle" onClick={() => setShow(!show())}>Toggle</button>
            <Show when={shouldRender()}>
              <AnimatedDiv
                data-testid="content"
                animate={{
                  from: { opacity: 0, scale: 0.8 },
                  to: { 
                    opacity: isUnmounting() ? 0 : 1, 
                    scale: isUnmounting() ? 0.8 : 1 
                  },
                  config: { delay: 100 }
                }}
              >
                Content
              </AnimatedDiv>
            </Show>
          </div>
        );
      }
      
      render(() => <TestComponent />);
      
      // Should render and animate in with delay
      await vi.advanceTimersByTimeAsync(150);
      await vi.advanceTimersByTimeAsync(200);
      
      expect(screen.getByTestId("content")).toBeInTheDocument();
      
      // Hide - should animate out (no delay) and then remove
      fireEvent.click(screen.getByTestId("toggle"));
      await vi.advanceTimersByTimeAsync(50);
      
      expect(screen.getByTestId("content")).toBeInTheDocument();
      
      // After unmount duration
      await vi.advanceTimersByTimeAsync(500);
      await vi.advanceTimersByTimeAsync(50);
      
      expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    });
  });
});
