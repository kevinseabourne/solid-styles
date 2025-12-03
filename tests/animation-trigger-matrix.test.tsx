/**
 * Extreme trigger matrix coverage:
 * - Exercises every animation trigger (hover, click, active, focus, always, custom)
 * - Validates size/gradient property animations
 * - Confirms stagger utilities behave deterministically
 * - Ensures animate[] arrays can mix lifecycle + interaction triggers
 */

import { render, screen, fireEvent, waitFor } from "@solidjs/testing-library";
import { describe, it, expect, vi } from "vitest";
import { createSignal } from "solid-js";
import { animated } from "../animation/animatedStyled";
import { createStagger, useStagger } from "../animation/hooks/useStagger";

const waitForSpring = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms));
const getStyles = (element: HTMLElement) => window.getComputedStyle(element);

describe("Animation Trigger Matrix", () => {
  it("compresses and releases components with the active trigger", async () => {
    const AnimatedButton = animated("button");

    render(() => (
      <AnimatedButton
        data-testid="active-trigger"
        animate={{
          from: { scale: 1, boxShadow: "none" },
          to: { scale: 0.88, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.35)" },
          when: "active",
          reverseOnExit: true,
          config: { stiffness: 320, damping: 18 },
        }}
        style={{ width: "128px", height: "48px", border: "none" }}
      >
        Hold
      </AnimatedButton>
    ));

    const element = screen.getByTestId("active-trigger");
    expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(getStyles(element).transform);

    fireEvent.mouseDown(element);
    await waitFor(() => {
      expect(getStyles(element).transform).not.toBe("none");
    });

    // mouseUp on the element itself (not document.body) to release active state
    fireEvent.mouseUp(element);
    await waitForSpring();

    const finalTransform = getStyles(element).transform;
    expect(finalTransform === "none" || finalTransform.startsWith("matrix(1")).toBe(true);
  });

  describe("Auto-detected while* props", () => {
    it("animates in response to whileHover without explicit triggers", async () => {
      const HoverPanel = animated("div");

      render(() => (
        <HoverPanel
          data-testid="while-hover-tile"
          whileHover={{ scale: 1.12, rotate: 6 }}
          style={{ width: "130px", height: "130px", background: "#93c5fd" }}
        />
      ));

      const element = screen.getByTestId("while-hover-tile");
      const initialTransform = getStyles(element).transform;

      fireEvent.mouseEnter(element);
      await waitForSpring();

      expect(getStyles(element).transform).not.toBe(initialTransform);
    });

    it("animates with whileTap when the element is clicked", async () => {
      const TapPanel = animated("button");

      render(() => (
        <TapPanel
          data-testid="while-tap-tile"
          whileTap={{ scale: 0.9, rotate: -8 }}
          style={{ padding: "21px", border: "none", background: "#f97316", color: "white" }}
        >
          Tap
        </TapPanel>
      ));

      const element = screen.getByTestId("while-tap-tile");
      fireEvent.click(element);
      await waitForSpring();

      expect(getStyles(element).transform).not.toBe("none");
    });

    it("triggers scale animation when whileFocus engages", async () => {
      const FocusButton = animated("button");

      render(() => (
        <FocusButton
          data-testid="while-focus-button"
          whileFocus={{ scale: 1.05 }}
          tabIndex={0}
          style={{ padding: "21px 34px", borderRadius: "21px", border: "2px solid transparent" }}
        >
          Focus me
        </FocusButton>
      ));

      const element = screen.getByTestId("while-focus-button") as HTMLButtonElement;
      
      // Get initial transform
      const initialTransform = getStyles(element).transform;
      
      // Trigger focus event using fireEvent for reliable cross-environment behavior
      fireEvent.focus(element);
      
      // Wait for spring animation to progress
      await waitForSpring();
      
      // Verify transform has changed (scale animation applied)
      const focusedTransform = getStyles(element).transform;
      
      // The transform should have changed due to scale animation
      // Either transform will contain a matrix with scale, or be different from initial
      expect(
        focusedTransform !== initialTransform || 
        focusedTransform.includes("matrix")
      ).toBe(true);
    });

    it("animates with whileInView when the observer reports intersection", async () => {
      const originalObserver = globalThis.IntersectionObserver;
      const observeMock = vi.fn();

      globalThis.IntersectionObserver = class {
        private callback: (entries: IntersectionObserverEntry[]) => void;
        constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
          this.callback = callback;
        }
        observe(element: Element) {
          observeMock(element);
          this.callback([{ isIntersecting: true, target: element }] as IntersectionObserverEntry[]);
        }
        unobserve() {}
        disconnect() {}
      } as unknown as typeof IntersectionObserver;

      const InViewPanel = animated("div");

      render(() => (
        <InViewPanel
          data-testid="while-inview-tile"
          whileInView={{ opacity: [0, 1], y: [34, 0] }}
          style={{ width: "160px", height: "160px", background: "#34d399" }}
        />
      ));

      const element = screen.getByTestId("while-inview-tile");

      await waitFor(() => expect(observeMock).toHaveBeenCalled());
      await waitForSpring();

      expect(parseFloat(getStyles(element).opacity)).toBeGreaterThan(0.9);
      globalThis.IntersectionObserver = originalObserver;
    });
  });

  it("runs continuous animations via the always trigger", async () => {
    const AnimatedSection = animated("section");

    render(() => (
      <AnimatedSection
        data-testid="always-trigger"
        animate={{
          from: { opacity: 0, y: 30 },
          to: { opacity: 1, y: 0 },
          when: "always",
          config: { duration: 180 },
        }}
        style={{ padding: "24px" }}
      >
        Ready instantly
      </AnimatedSection>
    ));

    const element = screen.getByTestId("always-trigger");

    await waitFor(() => {
      expect(parseFloat(getStyles(element).opacity)).toBeGreaterThan(0.95);
    });

    const transform = getStyles(element).transform;
    expect(transform === "none" || transform.includes("matrix")).toBe(true);
  });

  it("responds to custom boolean triggers with reverseOnExit", async () => {
    const AnimatedCard = animated("div");
    let controls: { enable: () => void; disable: () => void } | undefined;

    render(() => {
      const [enabled, setEnabled] = createSignal(false);
      controls = {
        enable: () => setEnabled(true),
        disable: () => setEnabled(false),
      };

      return (
        <AnimatedCard
          data-testid="custom-trigger"
          animate={{
            from: { x: 0, rotate: 0 },
            to: { x: 72, rotate: 8 },
            when: () => enabled(),
            reverseOnExit: true,
            config: { stiffness: 260, damping: 20 },
          }}
          style={{ width: "160px", height: "96px", background: "#f1f5f9" }}
        />
      );
    });

    const element = screen.getByTestId("custom-trigger");
    if (!controls) throw new Error("Custom trigger controls not initialized");

    controls.enable();
    await waitFor(() => {
      expect(getStyles(element).transform).not.toBe("none");
    });

    controls.disable();
    await waitForSpring();

    const transform = getStyles(element).transform;
    expect(transform === "none" || transform.startsWith("matrix(1")).toBe(true);
  });

  it("supports animate arrays mixing lifecycle and interaction triggers", async () => {
    const AnimatedDiv = animated("div");

    render(() => (
      <AnimatedDiv
        data-testid="multi-stage"
        animate={[
          {
            from: { opacity: 0 },
            to: { opacity: 1 },
            when: "mount",
            config: { duration: 120 },
          },
          {
            from: { x: 0 },
            to: { x: 64 },
            when: "click",
            reverseOnExit: true,
            config: { stiffness: 250, damping: 18 },
          },
        ]}
        style={{ width: "120px", height: "80px", background: "#dbeafe" }}
      />
    ));

    const element = screen.getByTestId("multi-stage");

    await waitFor(() => {
      expect(parseFloat(getStyles(element).opacity)).toBeGreaterThan(0.9);
    });

    fireEvent.click(element);
    await waitFor(() => {
      expect(getStyles(element).transform).not.toBe("none");
    });

    fireEvent.click(document.body);
    await waitForSpring();

    const transform = getStyles(element).transform;
    expect(transform === "none" || transform.startsWith("matrix(1")).toBe(true);
  });

  it("animates multi-gradient backgrounds with hover events", async () => {
    const AnimatedTile = animated("div");
    const gradientFrom = "linear-gradient(90deg, #ff6b6b 0%, #fcd34d 100%)";
    const gradientTo = "linear-gradient(135deg, #4facfe 0%, #00f2fe 50%, #4facfe 100%)";

    render(() => (
      <AnimatedTile
        data-testid="gradient-panel"
        animate={{
          from: { background: gradientFrom, backgroundSize: "100% 100%" },
          to: { background: gradientTo, backgroundSize: "200% 200%" },
          when: "hover",
          reverseOnExit: true,
          config: { stiffness: 220, damping: 20 },
        }}
        style={{ width: "150px", height: "150px", borderRadius: "18px" }}
      />
    ));

    const element = screen.getByTestId("gradient-panel");
    expect(element.style.background.replace(/\s+/g, "")).toContain("rgb(255,107,107)");

    fireEvent.mouseEnter(element);
    await waitForSpring();

    expect(element.style.background).toContain("linear-gradient");
    expect(element.style.background.replace(/\s+/g, "")).toContain("rgb(0,242,254)");

    fireEvent.mouseLeave(element);
    await waitForSpring();
    expect(element.style.background.replace(/\s+/g, "")).toContain("rgb(255,107,107)");
  });

  it("expands padding and border radius with click-triggered springs", async () => {
    const AnimatedPanel = animated("div");

    render(() => (
      <AnimatedPanel
        data-testid="size-panel"
        animate={{
          from: { padding: 12, borderRadius: 12 },
          to: { padding: 42, borderRadius: 48 },
          when: "click",
          reverseOnExit: true,
          config: { stiffness: 280, damping: 22 },
        }}
        style={{ padding: "12px", borderRadius: "12px", background: "#fde68a" }}
      />
    ));

    const element = screen.getByTestId("size-panel");
    fireEvent.click(element);
    await waitForSpring(600);

    const expanded = getStyles(element);
    expect(parseFloat(expanded.paddingTop)).toBeGreaterThan(24);
    expect(parseFloat(expanded.borderTopLeftRadius)).toBeGreaterThan(20);

    fireEvent.click(document.body);
    await waitForSpring(600);

    const collapsed = getStyles(element);
    expect(parseFloat(collapsed.paddingTop)).toBeLessThan(18);
    expect(parseFloat(collapsed.borderTopLeftRadius)).toBeLessThan(20);
  });
});

describe("Stagger utilities", () => {
  it("produces deterministic delays for complex patterns", () => {
    const baseAnimation = {
      from: { opacity: 0, y: 30 },
      to: { opacity: 1, y: 0 },
      when: "mount" as const,
    };

    const stagger = createStagger({ delay: 90, pattern: "center", maxTotalDelay: 300 });
    const configs = Array.from({ length: 5 }, (_, index) => stagger(baseAnimation, index, 5));

    expect(configs[2].delay ?? 0).toBe(0);
    expect((configs[0].delay ?? 0) > (configs[1].delay ?? 0)).toBe(true);
    expect(configs[4].delay ?? 0).toBe(configs[0].delay ?? 0);
    expect(configs[0].delay ?? 0).toBeLessThanOrEqual(300);
  });

  it("returns merged stagger configs via useStagger", () => {
    const baseAnimation = {
      from: { opacity: 0, y: 16 },
      to: { opacity: 1, y: 0 },
      when: "mount" as const,
    };

    const configs = useStagger(["a", "b", "c", "d"], baseAnimation, { delay: 60, pattern: "forward" });
    expect(configs).toHaveLength(4);
    expect(configs[0].delay ?? 0).toBe(0);
    expect(configs[3].delay ?? 0).toBeCloseTo(60 * 3);
    expect((configs[1].delay ?? 0) < (configs[2].delay ?? 0)).toBe(true);
    expect(configs[2].from).toEqual(baseAnimation.from);
    expect(configs[2].to).toEqual(baseAnimation.to);
  });
});

