/**
 * Unmount Animation Test Suite
 * 
 * Tests the unmount portal system for exit animations
 */

import { render, screen, waitFor } from "@solidjs/testing-library";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { animated } from "../animation/animatedStyled";
import { useUnmountPortal, UnmountPortal } from "../animation/hooks/useUnmountPortal";
import { createSignal, Show } from "solid-js";

describe("Unmount Animations", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe("useUnmountPortal hook", () => {
    it("should keep component rendered during unmount animation", async () => {
      function TestComponent() {
        const [show, setShow] = createSignal(true);
        const { shouldRender, isUnmounting } = useUnmountPortal(show, { duration: 300 });
        
        return (
          <div>
            <button data-testid="toggle" onClick={() => setShow(false)}>
              Hide
            </button>
            <Show when={shouldRender()}>
              <div data-testid="content" data-unmounting={isUnmounting()}>
                Content
              </div>
            </Show>
          </div>
        );
      }
      
      render(() => <TestComponent />);
      
      // Content should be visible
      expect(screen.getByTestId("content")).toBeInTheDocument();
      expect(screen.getByTestId("content").getAttribute("data-unmounting")).toBe("false");
      
      // Hide content
      screen.getByTestId("toggle").click();
      await vi.advanceTimersByTimeAsync(10);
      
      // Should still be in DOM but marked as unmounting
      expect(screen.getByTestId("content")).toBeInTheDocument();
      expect(screen.getByTestId("content").getAttribute("data-unmounting")).toBe("true");
      
      // After duration, should be removed
      await vi.advanceTimersByTimeAsync(300);
      await vi.advanceTimersByTimeAsync(10);
      
      expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    });

    it("should cancel unmount if shown again before duration completes", async () => {
      function TestComponent() {
        const [show, setShow] = createSignal(true);
        const { shouldRender, isUnmounting } = useUnmountPortal(show, { duration: 300 });
        
        return (
          <div>
            <button data-testid="toggle" onClick={() => setShow(!show())}>
              Toggle
            </button>
            <Show when={shouldRender()}>
              <div data-testid="content" data-unmounting={isUnmounting()}>
                Content
              </div>
            </Show>
          </div>
        );
      }
      
      render(() => <TestComponent />);
      
      // Hide content
      screen.getByTestId("toggle").click();
      await vi.advanceTimersByTimeAsync(10);
      
      // Should be unmounting
      expect(screen.getByTestId("content").getAttribute("data-unmounting")).toBe("true");
      
      // Show again before duration completes
      await vi.advanceTimersByTimeAsync(150);
      screen.getByTestId("toggle").click();
      await vi.advanceTimersByTimeAsync(10);
      
      // Should no longer be unmounting
      expect(screen.getByTestId("content").getAttribute("data-unmounting")).toBe("false");
      
      // Should still be in DOM after original duration would have passed
      await vi.advanceTimersByTimeAsync(200);
      expect(screen.getByTestId("content")).toBeInTheDocument();
    });

    it("should call onComplete callback when unmount finishes", async () => {
      const onComplete = vi.fn();
      
      function TestComponent() {
        const [show, setShow] = createSignal(true);
        const { shouldRender } = useUnmountPortal(show, { 
          duration: 300,
          onComplete 
        });
        
        return (
          <div>
            <button data-testid="toggle" onClick={() => setShow(false)}>
              Hide
            </button>
            <Show when={shouldRender()}>
              <div data-testid="content">Content</div>
            </Show>
          </div>
        );
      }
      
      render(() => <TestComponent />);
      
      // Hide content
      screen.getByTestId("toggle").click();
      await vi.advanceTimersByTimeAsync(10);
      
      // Callback should not be called yet
      expect(onComplete).not.toHaveBeenCalled();
      
      // After duration, callback should be called
      await vi.advanceTimersByTimeAsync(300);
      await vi.advanceTimersByTimeAsync(10);
      
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe("UnmountPortal component", () => {
    it("should wrap children with unmount animation support", async () => {  
      function TestComponent() {
        const [show, setShow] = createSignal(true);
        
        return (
          <div data-testid="parent">
            <button data-testid="toggle" onClick={() => setShow(false)}>
              Hide
            </button>
            <UnmountPortal when={show()} duration={300}>
              <div data-testid="content">Content</div>
            </UnmountPortal>
          </div>
        );
      }
      
      render(() => <TestComponent />);
      
      // Content should be visible initially
      expect(screen.getByTestId("content")).toBeInTheDocument();
      const parent = screen.getByTestId("parent");
      
      // Count initial children (button + wrapper div)
      const initialChildCount = parent.children.length;
      expect(initialChildCount).toBeGreaterThan(0);
      
      // Hide content
      screen.getByTestId("toggle").click();
      await vi.advanceTimersByTimeAsync(50);
      
      // Should still be in DOM during animation
      expect(screen.getByTestId("content")).toBeInTheDocument();
      
      // After duration, everything should be removed
      await vi.advanceTimersByTimeAsync(300);
      await vi.advanceTimersByTimeAsync(50); // Extra buffer
      
      // Content should be completely gone
      expect(screen.queryByTestId("content")).not.toBeInTheDocument();
      
      // Parent should only have the button now
      const finalChildCount = parent.children.length;
      expect(finalChildCount).toBe(1); // Only button remains
    });
  });

  describe("Integration with animated components", () => {
    it("should animate opacity on unmount", async () => {
      const AnimatedDiv = animated("div");
      
      function TestComponent() {
        const [show, setShow] = createSignal(true);
        const { shouldRender, isUnmounting } = useUnmountPortal(show, { duration: 400 });
        
        return (
          <div>
            <button data-testid="toggle" onClick={() => setShow(false)}>
              Hide
            </button>
            <Show when={shouldRender()}>
              <AnimatedDiv
                data-testid="content"
                animate={{
                  from: { opacity: 0 },
                  to: { opacity: isUnmounting() ? 0 : 1 },
                }}
              >
                Content
              </AnimatedDiv>
            </Show>
          </div>
        );
      }
      
      render(() => <TestComponent />);
      
      const element = screen.getByTestId("content");
      
      // Should start with full opacity (or animating to it)
      await vi.advanceTimersByTimeAsync(300);
      let opacity = parseFloat(window.getComputedStyle(element).opacity);
      expect(opacity).toBeGreaterThan(0.5); // Should be mostly visible
      
      // Hide content - should start fade out animation
      screen.getByTestId("toggle").click();
      await vi.advanceTimersByTimeAsync(10);
      
      // Should still be in DOM
      expect(screen.getByTestId("content")).toBeInTheDocument();
      
      // Opacity should be animating down
      await vi.advanceTimersByTimeAsync(200);
      opacity = parseFloat(window.getComputedStyle(element).opacity);
      expect(opacity).toBeLessThan(0.9); // Should be fading
      
      // After full duration, should be removed
      await vi.advanceTimersByTimeAsync(200);
      await vi.advanceTimersByTimeAsync(10);
      
      expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    });

    it("should animate scale on unmount", async () => {
      const AnimatedDiv = animated("div");
      
      function TestComponent() {
        const [show, setShow] = createSignal(true);
        const { shouldRender, isUnmounting } = useUnmountPortal(show, { duration: 400 });
        
        return (
          <div>
            <button data-testid="toggle" onClick={() => setShow(false)}>
              Hide
            </button>
            <Show when={shouldRender()}>
              <AnimatedDiv
                data-testid="content"
                animate={{
                  from: { scale: 0.8 },
                  to: { scale: isUnmounting() ? 0.8 : 1 },
                }}
              >
                Content
              </AnimatedDiv>
            </Show>
          </div>
        );
      }
      
      render(() => <TestComponent />);
      
      const element = screen.getByTestId("content");
      
      // Should start animating to scale 1
      await vi.advanceTimersByTimeAsync(300);
      const transformBefore = window.getComputedStyle(element).transform;
      expect(transformBefore).toContain("matrix"); // Should have transform
      
      // Hide content - should animate back to scale 0.8
      screen.getByTestId("toggle").click();
      await vi.advanceTimersByTimeAsync(10);
      
      // Should still be in DOM
      expect(screen.getByTestId("content")).toBeInTheDocument();
      
      // After full duration, should be removed
      await vi.advanceTimersByTimeAsync(400);
      await vi.advanceTimersByTimeAsync(10);
      
      expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    });
  });
});
