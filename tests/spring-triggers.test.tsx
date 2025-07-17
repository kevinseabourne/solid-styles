/** @jsxImportSource solid-js */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@solidjs/testing-library";
import { createSignal, onCleanup } from "solid-js";
import { 
  useAnimation, 
  useMountAnimation, 
  useUnmountAnimation,
  useTrigger,
  useHoverTrigger,
  useClickTrigger,
  useFocusTrigger,
  useInViewTrigger,
  useActiveTrigger
} from "../animation/hooks";



// Mock IntersectionObserver for testing
class MockIntersectionObserver {
  callback: (entries: any[]) => void;
  
  constructor(callback: (entries: any[]) => void) {
    this.callback = callback;
  }
  
  observe = vi.fn((element: Element) => {
    // Simulate element being in view immediately (synchronous for fake timers)
    this.callback([{ 
      isIntersecting: true, 
      target: element,
      intersectionRatio: 1,
      boundingClientRect: { top: 0, left: 0, right: 100, bottom: 100, width: 100, height: 100 },
      intersectionRect: { top: 0, left: 0, right: 100, bottom: 100, width: 100, height: 100 },
      rootBounds: { top: 0, left: 0, right: 1000, bottom: 1000, width: 1000, height: 1000 }
    }]);
  });
  
  unobserve = vi.fn();
  disconnect = vi.fn();
}

beforeEach(() => {
  vi.useFakeTimers();
  // Mock IntersectionObserver for testing
  (window as any).IntersectionObserver = MockIntersectionObserver;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("🌊 Spring Animation Triggers", () => {
  
  describe("📦 Mount/Unmount Triggers", () => {
    it("should trigger animation on component mount", async () => {
      let mountAnimationTriggered = false;
      
      const TestComponent = () => {
        const animation = useMountAnimation({
          from: { opacity: 0, x: -20 },
          to: { opacity: 1, x: 0 },
          onStart: () => {
            mountAnimationTriggered = true;
          }
        });

        return (
          <div data-testid="mount-target">
            Opacity: {animation.value().opacity}, X: {animation.value().x}
          </div>
        );
      };

      render(() => <TestComponent />);
      
      // Advance fake timers to trigger mount animation
      vi.advanceTimersByTime(50);
      
      expect(mountAnimationTriggered).toBe(true);
    });

    it("should trigger animation on component unmount", async () => {
      let cleanupCalled = false;
      
      const TestComponent = () => {
        const animation = useUnmountAnimation({
          from: { opacity: 1, scale: 1 },
          to: { opacity: 0, scale: 0.8 }
        });

        onCleanup(() => {
          cleanupCalled = true;
          animation.cleanup();
        });

        return (
          <div data-testid="unmount-target">
            Unmount Animation Component
          </div>
        );
      };

      const [showComponent, setShowComponent] = createSignal(true);
      
      const WrapperComponent = () => {
        return (
          <div>
            {showComponent() && <TestComponent />}
            <button onClick={() => setShowComponent(false)}>Remove</button>
          </div>
        );
      };

      const { container } = render(() => <WrapperComponent />);
      const button = container.querySelector("button");
      
      // Trigger unmount
      fireEvent.click(button!);
      vi.advanceTimersByTime(50);
      
      expect(cleanupCalled).toBe(true);
    });
  });

  describe("🖱️ Mouse Interaction Triggers", () => {
    it("should trigger animation on hover", async () => {
      let hoverTriggered = false;
      
      const TestComponent = () => {
        const [ref, setRef] = createSignal<HTMLElement>();
        const isHovered = useHoverTrigger(ref);
        
        const animation = useAnimation({
          from: { scale: 1 },
          to: { scale: 1.2 },
          when: isHovered,
          onStart: () => {
            hoverTriggered = true;
          }
        });

        return (
          <div 
            ref={setRef}
            data-testid="hover-target"
            style={{ transform: `scale(${animation.value().scale})` }}
          >
            Hover Me - Scale: {animation.value().scale}
          </div>
        );
      };

      const { getByTestId } = render(() => <TestComponent />);
      const target = getByTestId("hover-target");
      
      // Trigger hover
      fireEvent.mouseEnter(target);
      vi.advanceTimersByTime(50);
      
      expect(hoverTriggered).toBe(true);
    });

    it("should trigger animation on click", async () => {
      let clickTriggered = false;
      
      const TestComponent = () => {
        const [ref, setRef] = createSignal<HTMLElement>();
        const isClicked = useClickTrigger(ref, { toggle: true });
        
        const animation = useAnimation({
          from: { rotation: 0 },
          to: { rotation: 180 },
          when: isClicked,
          onStart: () => {
            clickTriggered = true;
          }
        });

        return (
          <div 
            ref={setRef}
            data-testid="click-target"
            style={{ transform: `rotate(${animation.value().rotation}deg)` }}
          >
            Click Me - Rotation: {animation.value().rotation}
          </div>
        );
      };

      const { getByTestId } = render(() => <TestComponent />);
      const target = getByTestId("click-target");
      
      // Trigger click
      fireEvent.click(target);
      vi.advanceTimersByTime(50);
      
      expect(clickTriggered).toBe(true);
    });

    it("should trigger animation on focus", async () => {
      let focusTriggered = false;
      
      const TestComponent = () => {
        const [ref, setRef] = createSignal<HTMLElement>();
        const isFocused = useFocusTrigger(ref);
        
        const animation = useAnimation({
          from: { borderWidth: 1 },
          to: { borderWidth: 3 },
          when: isFocused,
          onStart: () => {
            focusTriggered = true;
          }
        });

        return (
          <input 
            ref={setRef as (el: HTMLInputElement) => void}
            data-testid="focus-target"
            style={{ "border-width": `${animation.value().borderWidth}px` }}
            placeholder="Focus me"
          />
        );
      };

      const { getByTestId } = render(() => <TestComponent />);
      const target = getByTestId("focus-target");
      
      // Trigger focus
      fireEvent.focus(target);
      vi.advanceTimersByTime(50);
      
      expect(focusTriggered).toBe(true);
    });

    it("should trigger animation on active (mousedown)", async () => {
      let activeTriggered = false;
      
      const TestComponent = () => {
        const [ref, setRef] = createSignal<HTMLElement>();
        const isActive = useActiveTrigger(ref);
        
        const animation = useAnimation({
          from: { brightness: 1 },
          to: { brightness: 0.8 },
          when: isActive,
          onStart: () => {
            activeTriggered = true;
          }
        });

        return (
          <button 
            ref={setRef}
            data-testid="active-target"
            style={{ filter: `brightness(${animation.value().brightness})` }}
          >
            Press Me - Brightness: {animation.value().brightness}
          </button>
        );
      };

      const { getByTestId } = render(() => <TestComponent />);
      const target = getByTestId("active-target");
      
      // Trigger mousedown (active state)
      fireEvent.mouseDown(target);
      vi.advanceTimersByTime(50);
      
      expect(activeTriggered).toBe(true);
    });
  });

  describe("👁️ Viewport Interaction Triggers", () => {
    it("should trigger animation when element enters viewport", async () => {
      let inViewTriggered = false;
      
      const TestComponent = () => {
        const [ref, setRef] = createSignal<HTMLElement>();
        const isInView = useInViewTrigger(ref, { threshold: 0.5 });
        
        const animation = useAnimation({
          from: { opacity: 0, y: 50 },
          to: { opacity: 1, y: 0 },
          when: isInView,
          onStart: () => {
            inViewTriggered = true;
          }
        });

        return (
          <div 
            ref={setRef}
            data-testid="inview-target"
            style={{ 
              opacity: animation.value().opacity,
              transform: `translateY(${animation.value().y}px)`
            }}
          >
            In View Animation - Y: {animation.value().y}
          </div>
        );
      };

      render(() => <TestComponent />);
      
      // IntersectionObserver mock will trigger immediately
      vi.advanceTimersByTime(50);
      
      expect(inViewTriggered).toBe(true);
    });
  });

  describe("🔄 Combined Trigger Types", () => {
    it("should handle multiple trigger types with useTrigger", async () => {
      const TestComponent = () => {
        const [ref, setRef] = createSignal<HTMLElement>();
        const isHovered = useTrigger(ref, "hover");
        const isClicked = useTrigger(ref, "click", { toggle: true });
        const isInView = useTrigger(ref, "inView");
        
        return (
          <div 
            ref={setRef}
            data-testid="multi-trigger"
            style={{
              background: isHovered() ? "blue" : "gray",
              transform: isClicked() ? "scale(1.1)" : "scale(1)",
              opacity: isInView() ? 1 : 0.5
            }}
          >
            Multi-Trigger: Hover={isHovered() ? "✓" : "✗"} 
            Click={isClicked() ? "✓" : "✗"} 
            InView={isInView() ? "✓" : "✗"}
          </div>
        );
      };

      const { getByTestId } = render(() => <TestComponent />);
      const target = getByTestId("multi-trigger");
      
      // Test hover trigger
      fireEvent.mouseEnter(target);
      vi.advanceTimersByTime(10);
      expect(target.textContent).toContain("Hover=✓");
      
      // Test click trigger
      fireEvent.click(target);
      vi.advanceTimersByTime(10);
      expect(target.textContent).toContain("Click=✓");
      
      // InView should be triggered by mock observer
      expect(target.textContent).toContain("InView=✓");
    });
  });

  describe("🧹 Cleanup and Memory Management", () => {
    it("should properly cleanup animation listeners on unmount", async () => {
      let cleanupCounter = 0;
      
      const TestComponent = () => {
        const [ref, setRef] = createSignal<HTMLElement>();
        const isHovered = useHoverTrigger(ref);
        
        useAnimation({
          from: { scale: 1 },
          to: { scale: 1.2 },
          when: isHovered
        });

        onCleanup(() => {
          cleanupCounter++;
        });

        return (
          <div ref={setRef} data-testid="cleanup-target">
            Cleanup Test Component
          </div>
        );
      };

      const [showComponent, setShowComponent] = createSignal(true);
      
      const WrapperComponent = () => {
        return (
          <div>
            {showComponent() && <TestComponent />}
            <button onClick={() => setShowComponent(false)}>Remove</button>
          </div>
        );
      };

      const { container } = render(() => <WrapperComponent />);
      const button = container.querySelector("button");
      
      // Trigger unmount
      fireEvent.click(button!);
      vi.advanceTimersByTime(50);
      
      expect(cleanupCounter).toBe(1);
    });

    it("should handle rapid mount/unmount cycles without memory leaks", async () => {
      let mountCount = 0;
      let unmountCount = 0;
      
      const TestComponent = () => {
        useMountAnimation({
          from: { opacity: 0 },
          to: { opacity: 1 },
          onStart: () => {
            mountCount++;
          }
        });

        onCleanup(() => {
          unmountCount++;
        });

        return <div>Rapid Mount/Unmount Test</div>;
      };

      const [showComponent, setShowComponent] = createSignal(false);
      
      const WrapperComponent = () => {
        return (
          <div>
            {showComponent() && <TestComponent />}
          </div>
        );
      };

      render(() => <WrapperComponent />);
      
      // Rapid mount/unmount cycles
      for (let i = 0; i < 5; i++) {
        setShowComponent(true);
        vi.advanceTimersByTime(10);
        setShowComponent(false);
        vi.advanceTimersByTime(10);
      }
      
      expect(mountCount).toBe(5);
      expect(unmountCount).toBe(5);
    });
  });

  describe("🚨 Error Handling", () => {
    it("should handle trigger errors gracefully", async () => {
      const TestComponent = () => {
        // Test with invalid trigger function
        const invalidTrigger = () => {
          throw new Error("Trigger error");
        };
        
        const animation = useAnimation({
          from: { opacity: 0 },
          to: { opacity: 1 },
          when: invalidTrigger,
        });

        return (
          <div data-testid="error-target">
            Error Test - Opacity: {animation.value().opacity}
          </div>
        );
      };

      // Should not throw error
      expect(() => {
        render(() => <TestComponent />);
        vi.advanceTimersByTime(50);
      }).not.toThrow();
    });
  });
});
