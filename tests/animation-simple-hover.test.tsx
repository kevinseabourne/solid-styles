/**
 * Simple Hover Animation Test
 * 
 * Minimal test to verify hover animations work at all
 */

import { render } from "solid-js/web";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { animated } from "../animation/animatedStyled";

describe("Simple Hover Animation Test", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("should render element with data-test-id", async () => {
    const AnimatedDiv = animated("div");
    
    render(() => (
      <AnimatedDiv
        data-test-id="simple-test"
        animate={{
          from: { scale: 1 },
          to: { scale: 2 },
          when: "hover",
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

    const element = container.querySelector('[data-test-id="simple-test"]') as HTMLElement;
    
    // Just verify element renders
    expect(element).toBeTruthy();
    expect(element.getAttribute('data-test-id')).toBe('simple-test');
  });

  it("should have event handlers attached", async () => {
    const AnimatedDiv = animated("div");
    
    render(() => (
      <AnimatedDiv
        data-test-id="handler-test"
        animate={{
          from: { scale: 1 },
          to: { scale: 2 },
          when: "hover",
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

    const element = container.querySelector('[data-test-id="handler-test"]') as HTMLElement;
    
    expect(element).toBeTruthy();
    
    // Dispatch mouseenter event
    const event = new MouseEvent('mouseenter', { bubbles: true });
    element.dispatchEvent(event);
    
    // Wait a tiny bit
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Check if hover state data attribute was set
    const hoverState = element.getAttribute('data-hover-state');
    console.log('Hover state attribute:', hoverState);
    
    // Element should have hover state attribute set to "true"
    expect(hoverState).toBe('true');
  });

  it("should apply initial styles", async () => {
    const AnimatedDiv = animated("div");
    
    render(() => (
      <AnimatedDiv
        data-test-id="style-test"
        animate={{
          from: { opacity: 0.5 },
          to: { opacity: 1 },
          when: "hover",
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

    const element = container.querySelector('[data-test-id="style-test"]') as HTMLElement;
    expect(element).toBeTruthy();
    
    // Check computed styles
    const styles = window.getComputedStyle(element);
    console.log('Initial opacity:', styles.opacity);
    console.log('Initial transform:', styles.transform);
    
    // At least check that styles are being computed
    expect(styles.opacity).toBeTruthy();
  });

  it("should change hover state on mouseenter", async () => {
    const AnimatedDiv = animated("div");
    
    render(() => (
      <AnimatedDiv
        data-test-id="hover-state-test"
        animate={{
          from: { scale: 1 },
          to: { scale: 2 },
          when: "hover",
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

    const element = container.querySelector('[data-test-id="hover-state-test"]') as HTMLElement;
    
    // Check initial state
    expect(element.getAttribute('data-hover-state')).toBeFalsy();
    
    // Trigger mouseenter
    element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    
    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should have hover state
    expect(element.getAttribute('data-hover-state')).toBe('true');
    
    // Trigger mouseleave
    element.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    
    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should not have hover state
    expect(element.getAttribute('data-hover-state')).toBe('false');
  });
});
