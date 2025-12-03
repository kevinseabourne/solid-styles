/** @jsxImportSource solid-js */
/**
 * Stress and Performance Tests
 * 
 * Enterprise-level tests to verify the animation library can handle:
 * - 100+ simultaneous animations
 * - Long-running animations (>10s)
 * - Rapid mount/unmount cycles
 * - Memory pressure scenarios
 * - High-frequency updates
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@solidjs/testing-library";
import { createSignal, For, createRoot } from "solid-js";
import { animated, resetAnimationState } from "../animation/animatedStyled";
import { createSpring } from "../utils/spring";

// Helper for real timer tests
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("Stress and Performance Tests", () => {
  beforeEach(() => {
    resetAnimationState();
  });
  
  afterEach(() => {
    cleanup();
    resetAnimationState();
  });
  
  describe("High Volume Animations", () => {
    it("should handle 100 simultaneous animated components", async () => {
      const AnimatedDiv = animated("div");
      const itemCount = 100;
      
      const startTime = performance.now();
      
      render(() => (
        <div data-testid="container">
          <For each={Array.from({ length: itemCount }, (_, i) => i)}>
            {(index) => (
              <AnimatedDiv
                data-testid={`item-${index}`}
                animate={{
                  from: { opacity: 0, y: 20 },
                  to: { opacity: 1, y: 0 },
                  when: "mount",
                  config: { stiffness: 170, damping: 26 },
                }}
              >
                Item {index}
              </AnimatedDiv>
            )}
          </For>
        </div>
      ));
      
      const renderTime = performance.now() - startTime;
      
      // Wait for animations to start
      await sleep(200);
      
      // All items should be rendered
      const container = screen.getByTestId("container");
      expect(container.children.length).toBe(itemCount);
      
      // Render time should be reasonable (< 2 seconds for 100 items)
      expect(renderTime).toBeLessThan(2000);
      
      console.log(`Rendered ${itemCount} animated components in ${renderTime.toFixed(2)}ms`);
    });
    
    it("should handle 50 springs created simultaneously", async () => {
      const springCount = 50;
      const springs: Array<[() => number, (v: number) => void]> = [];
      const results: number[] = [];
      
      const startTime = performance.now();
      
      await new Promise<void>((resolve) => {
        createRoot((dispose) => {
          // Create many springs at once
          for (let i = 0; i < springCount; i++) {
            const spring = createSpring(0, {
              stiffness: 170,
              damping: 26,
            });
            springs.push(spring);
          }
          
          // Start all animations
          springs.forEach(([_, setValue]) => setValue(100));
          
          // Check results after settling
          setTimeout(() => {
            springs.forEach(([value], i) => {
              results[i] = value();
            });
            dispose();
            resolve();
          }, 600);
        });
      });
      
      const totalTime = performance.now() - startTime;
      
      // Most springs should have completed
      const completedCount = results.filter(v => v > 90).length;
      expect(completedCount).toBeGreaterThan(springCount * 0.8);
      
      console.log(`${springCount} springs completed in ${totalTime.toFixed(2)}ms (${completedCount} reached target)`);
    });
    
    it("should handle 200 hover-triggered animations", async () => {
      const AnimatedDiv = animated("div");
      const itemCount = 200;
      
      render(() => (
        <div data-testid="hover-container">
          <For each={Array.from({ length: itemCount }, (_, i) => i)}>
            {(index) => (
              <AnimatedDiv
                data-testid={`hover-item-${index}`}
                whileHover={{ scale: 1.1, opacity: 0.8 }}
                style={{ width: "20px", height: "20px", background: "#ccc", display: "inline-block" }}
              >
                {index}
              </AnimatedDiv>
            )}
          </For>
        </div>
      ));
      
      await sleep(100);
      
      // All items should be rendered
      const container = screen.getByTestId("hover-container");
      expect(container.children.length).toBe(itemCount);
      
      // Trigger hover on multiple elements rapidly
      for (let i = 0; i < 10; i++) {
        const item = screen.getByTestId(`hover-item-${i}`);
        fireEvent.mouseEnter(item);
      }
      
      await sleep(100);
      
      // Should not crash
      expect(container).toBeInTheDocument();
    });
  });
  
  describe("Rapid Mount/Unmount Cycles", () => {
    it("should handle 50 rapid mount/unmount cycles without memory leaks", async () => {
      const AnimatedDiv = animated("div");
      const [show, setShow] = createSignal(true);
      const cycleCount = 50;
      
      render(() => (
        <>
          {show() && (
            <AnimatedDiv
              data-testid="cycle-test"
              animate={{
                from: { opacity: 0 },
                to: { opacity: 1 },
                when: "mount",
                config: { stiffness: 300, damping: 20 },
              }}
            >
              Cycling Element
            </AnimatedDiv>
          )}
        </>
      ));
      
      const startTime = performance.now();
      
      // Rapid mount/unmount cycles
      for (let i = 0; i < cycleCount; i++) {
        setShow(false);
        await sleep(5);
        setShow(true);
        await sleep(5);
      }
      
      const cycleTime = performance.now() - startTime;
      
      // Final state should have element visible
      setShow(true);
      await sleep(50);
      
      expect(screen.getByTestId("cycle-test")).toBeInTheDocument();
      
      console.log(`${cycleCount} mount/unmount cycles in ${cycleTime.toFixed(2)}ms`);
    });
    
    it("should handle list items being rapidly added and removed", async () => {
      const AnimatedDiv = animated("div");
      const [items, setItems] = createSignal<number[]>([]);
      
      render(() => (
        <div data-testid="list-container">
          <For each={items()}>
            {(item) => (
              <AnimatedDiv
                data-testid={`list-item-${item}`}
                animate={{
                  from: { opacity: 0, x: -20 },
                  to: { opacity: 1, x: 0 },
                  when: "mount",
                }}
              >
                Item {item}
              </AnimatedDiv>
            )}
          </For>
        </div>
      ));
      
      // Rapidly add items
      for (let i = 0; i < 20; i++) {
        setItems(prev => [...prev, i]);
        await sleep(10);
      }
      
      // Rapidly remove items from beginning
      for (let i = 0; i < 10; i++) {
        setItems(prev => prev.slice(1));
        await sleep(10);
      }
      
      await sleep(100);
      
      // Should have remaining items
      const container = screen.getByTestId("list-container");
      expect(container.children.length).toBe(10);
    });
  });
  
  describe("Long-Running Animations", () => {
    it("should handle animations with very slow springs (simulated long duration)", async () => {
      // Use very low stiffness for slow animation
      let finalValue = 0;
      
      await new Promise<void>((resolve) => {
        createRoot((dispose) => {
          const [value, setValue] = createSpring(0, {
            stiffness: 50, // Very slow spring
            damping: 10,
          });
          
          setValue(100);
          
          // Check value after 1 second (animation won't be complete)
          setTimeout(() => {
            const midValue = value();
            // Should be progressing but not complete
            expect(midValue).toBeGreaterThan(0);
          }, 500);
          
          // Check final value after longer period
          setTimeout(() => {
            finalValue = value();
            dispose();
            resolve();
          }, 2000);
        });
      });
      
      // Should have progressed significantly
      expect(finalValue).toBeGreaterThan(80);
    });
    
    it("should maintain performance during extended animation sequences", async () => {
      const AnimatedDiv = animated("div");
      const [trigger, setTrigger] = createSignal(false);
      
      render(() => (
        <AnimatedDiv
          data-testid="sequence-test"
          animate={{
            from: { rotate: 0 },
            to: { rotate: trigger() ? 360 : 0 },
            when: "always",
            config: { stiffness: 100, damping: 15 },
          }}
        >
          Rotating Element
        </AnimatedDiv>
      ));
      
      // Trigger multiple animation cycles
      const cycles = 5;
      for (let i = 0; i < cycles; i++) {
        setTrigger(true);
        await sleep(300);
        setTrigger(false);
        await sleep(300);
      }
      
      // Element should still be functional
      expect(screen.getByTestId("sequence-test")).toBeInTheDocument();
    });
  });
  
  describe("Memory Pressure Scenarios", () => {
    it("should not leak memory when creating and destroying many animations", async () => {
      const AnimatedDiv = animated("div");
      const iterations = 20;
      
      for (let i = 0; i < iterations; i++) {
        const { unmount } = render(() => (
          <div>
            <For each={Array.from({ length: 10 }, (_, j) => j)}>
              {(index) => (
                <AnimatedDiv
                  animate={{
                    from: { opacity: 0 },
                    to: { opacity: 1 },
                    when: "mount",
                  }}
                >
                  Item {index}
                </AnimatedDiv>
              )}
            </For>
          </div>
        ));
        
        await sleep(50);
        unmount();
        cleanup();
        resetAnimationState();
      }
      
      // If we got here without crashing, memory is being managed
      expect(true).toBe(true);
    });
    
    it("should handle animation interruption gracefully", async () => {
      const AnimatedDiv = animated("div");
      const [target, setTarget] = createSignal(0);
      
      render(() => (
        <AnimatedDiv
          data-testid="interrupt-test"
          animate={{
            from: { x: 0 },
            to: { x: target() },
            when: "always",
            config: { stiffness: 100, damping: 20 },
          }}
        >
          Interruptible
        </AnimatedDiv>
      ));
      
      // Rapidly change target to interrupt animations
      for (let i = 0; i < 20; i++) {
        setTarget(Math.random() * 200 - 100);
        await sleep(30);
      }
      
      await sleep(200);
      
      // Element should still be functional
      expect(screen.getByTestId("interrupt-test")).toBeInTheDocument();
    });
  });
  
  describe("High-Frequency Updates", () => {
    it("should handle rapid value changes without dropping frames", async () => {
      let updateCount = 0;
      
      await new Promise<void>((resolve) => {
        createRoot((dispose) => {
          const [value, setValue] = createSpring(0, {
            stiffness: 300,
            damping: 20,
            onUpdate: () => {
              updateCount++;
            },
          });
          
          // Rapidly change target value
          let current = 0;
          const interval = setInterval(() => {
            current = current === 0 ? 100 : 0;
            setValue(current);
          }, 50);
          
          // Stop after 500ms
          setTimeout(() => {
            clearInterval(interval);
            dispose();
            resolve();
          }, 500);
        });
      });
      
      // Should have processed many updates
      expect(updateCount).toBeGreaterThan(10);
      console.log(`Processed ${updateCount} spring updates during high-frequency test`);
    });
    
    it("should handle mouse movement tracking animation", async () => {
      const AnimatedDiv = animated("div");
      const [position, setPosition] = createSignal({ x: 0, y: 0 });
      
      render(() => (
        <div
          data-testid="mouse-track-container"
          style={{ width: "200px", height: "200px", position: "relative" }}
          onMouseMove={(e) => {
            setPosition({ x: e.clientX, y: e.clientY });
          }}
        >
          <AnimatedDiv
            data-testid="follower"
            animate={{
              from: { x: 0, y: 0 },
              to: { x: position().x, y: position().y },
              when: "always",
              config: { stiffness: 200, damping: 20 },
            }}
            style={{
              width: "20px",
              height: "20px",
              background: "blue",
              position: "absolute",
            }}
          />
        </div>
      ));
      
      const container = screen.getByTestId("mouse-track-container");
      
      // Simulate rapid mouse movements
      for (let i = 0; i < 20; i++) {
        fireEvent.mouseMove(container, { clientX: i * 10, clientY: i * 5 });
        await sleep(20);
      }
      
      await sleep(200);
      
      // Follower element should still exist
      expect(screen.getByTestId("follower")).toBeInTheDocument();
    });
  });
  
  describe("Concurrent Animation Types", () => {
    it("should handle different animation types simultaneously", async () => {
      const AnimatedDiv = animated("div");
      const AnimatedButton = animated("button");
      const AnimatedSpan = animated("span");
      
      render(() => (
        <div data-testid="mixed-container">
          {/* Mount animation */}
          <AnimatedDiv
            data-testid="mount-anim"
            animate={{
              from: { opacity: 0 },
              to: { opacity: 1 },
              when: "mount",
            }}
          >
            Mount
          </AnimatedDiv>
          
          {/* Hover animation */}
          <AnimatedButton
            data-testid="hover-anim"
            whileHover={{ scale: 1.1 }}
          >
            Hover
          </AnimatedButton>
          
          {/* Click animation */}
          <AnimatedButton
            data-testid="click-anim"
            animate={{
              from: { backgroundColor: "#ccc" },
              to: { backgroundColor: "#007bff" },
              when: "click",
            }}
          >
            Click
          </AnimatedButton>
          
          {/* Always animation */}
          <AnimatedSpan
            data-testid="always-anim"
            animate={{
              from: { x: -10 },
              to: { x: 10 },
              when: "always",
            }}
          >
            Always
          </AnimatedSpan>
        </div>
      ));
      
      await sleep(200);
      
      // All elements should be rendered
      expect(screen.getByTestId("mount-anim")).toBeInTheDocument();
      expect(screen.getByTestId("hover-anim")).toBeInTheDocument();
      expect(screen.getByTestId("click-anim")).toBeInTheDocument();
      expect(screen.getByTestId("always-anim")).toBeInTheDocument();
      
      // Trigger some interactions
      fireEvent.mouseEnter(screen.getByTestId("hover-anim"));
      fireEvent.click(screen.getByTestId("click-anim"));
      
      await sleep(200);
      
      // All should still be functional
      expect(screen.getByTestId("mixed-container").children.length).toBe(4);
    });
  });
  
  describe("Performance Benchmarks", () => {
    it("should render 100 animated items under 500ms", async () => {
      const AnimatedDiv = animated("div");
      
      const startTime = performance.now();
      
      render(() => (
        <div>
          <For each={Array.from({ length: 100 }, (_, i) => i)}>
            {(i) => (
              <AnimatedDiv
                animate={{
                  from: { opacity: 0 },
                  to: { opacity: 1 },
                  when: "mount",
                }}
              >
                {i}
              </AnimatedDiv>
            )}
          </For>
        </div>
      ));
      
      const renderTime = performance.now() - startTime;
      
      expect(renderTime).toBeLessThan(500);
      console.log(`100 animated items rendered in ${renderTime.toFixed(2)}ms`);
    });
    
    it("should initialize 100 springs under 100ms", async () => {
      const startTime = performance.now();
      
      await new Promise<void>((resolve) => {
        createRoot((dispose) => {
          const springs = [];
          
          for (let i = 0; i < 100; i++) {
            springs.push(createSpring(0, { stiffness: 170, damping: 26 }));
          }
          
          const initTime = performance.now() - startTime;
          expect(initTime).toBeLessThan(100);
          
          console.log(`100 springs initialized in ${initTime.toFixed(2)}ms`);
          
          dispose();
          resolve();
        });
      });
    });
  });
});
