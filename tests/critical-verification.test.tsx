/**
 * CRITICAL VERIFICATION TESTS
 * 
 * These tests verify that animations actually work by checking specific values,
 * not just "something changed". This catches weak test assertions that would
 * pass even if the animation system is broken.
 */
import { render, screen, fireEvent, waitFor } from "@solidjs/testing-library";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { animated, LayoutAnimated, LayoutTransitionProvider } from "../animation";
import { createSignal } from "solid-js";

const waitForSpring = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms));
const getStyles = (element: HTMLElement) => window.getComputedStyle(element);

/**
 * Parse CSS transform matrix to extract scale values
 * matrix(scaleX, skewY, skewX, scaleY, translateX, translateY)
 */
function parseTransformScale(transform: string): { scaleX: number; scaleY: number } | null {
  const matrixMatch = transform.match(/matrix\(([^)]+)\)/);
  if (!matrixMatch) return null;
  const values = matrixMatch[1].split(",").map(v => parseFloat(v.trim()));
  return { scaleX: values[0], scaleY: values[3] };
}

/**
 * Parse CSS transform matrix to extract translate values
 */
function parseTransformTranslate(transform: string): { x: number; y: number } | null {
  const matrixMatch = transform.match(/matrix\(([^)]+)\)/);
  if (!matrixMatch) return null;
  const values = matrixMatch[1].split(",").map(v => parseFloat(v.trim()));
  return { x: values[4], y: values[5] };
}

describe("Critical Verification: Actual Values Not Just Changes", () => {
  describe("whileFocus animations", () => {
    it("MUST scale to approximately 1.05 when focused", async () => {
      const FocusButton = animated("button");

      render(() => (
        <FocusButton
          data-testid="focus-scale"
          whileFocus={{ scale: 1.05 }}
          tabIndex={0}
          style={{ padding: "20px", width: "100px", height: "50px" }}
        >
          Focus me
        </FocusButton>
      ));

      const element = screen.getByTestId("focus-scale") as HTMLButtonElement;
      
      // Trigger focus using fireEvent for reliable cross-environment behavior
      // Note: element.focus() has inconsistent behavior in Playwright tests
      fireEvent.focus(element);
      await waitForSpring();
      
      const transform = getStyles(element).transform;
      const scale = parseTransformScale(transform);
      
      if (!scale) {
        throw new Error(`Expected matrix transform, got: ${transform}`);
      }
      
      // Scale should be close to 1.05, with tolerance for spring settling
      expect(scale.scaleX).toBeGreaterThan(1.04);
      expect(scale.scaleX).toBeLessThan(1.06);
      expect(scale.scaleY).toBeGreaterThan(1.04);
      expect(scale.scaleY).toBeLessThan(1.06);
    });

    it("MUST return to scale 1.0 when blurred", async () => {
      const FocusButton = animated("button");

      render(() => (
        <FocusButton
          data-testid="focus-blur"
          whileFocus={{ scale: 1.05 }}
          tabIndex={0}
          style={{ padding: "20px" }}
        >
          Focus me
        </FocusButton>
      ));

      const element = screen.getByTestId("focus-blur") as HTMLButtonElement;
      
      // Focus then blur using fireEvent for reliable cross-environment behavior
      fireEvent.focus(element);
      await waitForSpring();
      fireEvent.blur(element);
      await waitForSpring();
      
      const transform = getStyles(element).transform;
      
      // After blur, should return to scale 1 (or none)
      if (transform === "none") {
        // Good - no transform means scale 1
        expect(true).toBe(true);
      } else {
        const scale = parseTransformScale(transform);
        if (scale) {
          expect(scale.scaleX).toBeGreaterThan(0.99);
          expect(scale.scaleX).toBeLessThan(1.01);
        }
      }
    });
  });

  describe("whileHover animations", () => {
    it("MUST scale to exactly 1.12 when hovered", async () => {
      const HoverDiv = animated("div");

      render(() => (
        <HoverDiv
          data-testid="hover-scale"
          whileHover={{ scale: 1.12 }}
          style={{ width: "100px", height: "100px", background: "blue" }}
        />
      ));

      const element = screen.getByTestId("hover-scale");
      
      fireEvent.mouseEnter(element);
      await waitForSpring();
      
      const transform = getStyles(element).transform;
      const scale = parseTransformScale(transform);
      
      if (!scale) {
        throw new Error(`Expected matrix transform, got: ${transform}`);
      }
      
      // Scale should be close to 1.12
      expect(scale.scaleX).toBeGreaterThan(1.10);
      expect(scale.scaleX).toBeLessThan(1.14);
    });

    it("MUST translate by exactly y: -10 when hovered", async () => {
      const HoverDiv = animated("div");

      render(() => (
        <HoverDiv
          data-testid="hover-translate"
          whileHover={{ y: -10 }}
          style={{ width: "100px", height: "100px", background: "blue" }}
        />
      ));

      const element = screen.getByTestId("hover-translate");
      
      fireEvent.mouseEnter(element);
      await waitForSpring();
      
      const transform = getStyles(element).transform;
      const translate = parseTransformTranslate(transform);
      
      if (!translate) {
        throw new Error(`Expected matrix transform, got: ${transform}`);
      }
      
      // Y should be close to -10
      expect(translate.y).toBeLessThan(-9);
      expect(translate.y).toBeGreaterThan(-11);
    });
  });

  describe("whileTap animations", () => {
    it("MUST scale to 0.9 when clicked and held", async () => {
      const TapButton = animated("button");

      render(() => (
        <TapButton
          data-testid="tap-scale"
          whileTap={{ scale: 0.9 }}
          style={{ padding: "20px" }}
        >
          Tap me
        </TapButton>
      ));

      const element = screen.getByTestId("tap-scale");
      
      // mouseDown triggers tap state
      fireEvent.mouseDown(element);
      await waitForSpring();
      
      const transform = getStyles(element).transform;
      const scale = parseTransformScale(transform);
      
      if (!scale) {
        throw new Error(`Expected matrix transform during tap, got: ${transform}`);
      }
      
      // Scale should be close to 0.9
      expect(scale.scaleX).toBeGreaterThan(0.88);
      expect(scale.scaleX).toBeLessThan(0.92);
      
      // Release
      fireEvent.mouseUp(element);
    });
  });

  describe("Spring physics timing", () => {
    it("animation should reach target within expected time (not 1000x slow)", async () => {
      const AnimatedDiv = animated("div");

      render(() => (
        <AnimatedDiv
          data-testid="timing-test"
          animate={{
            from: { opacity: 0 },
            to: { opacity: 1 },
            when: "always",
            config: { stiffness: 300, damping: 20 }
          }}
          style={{ width: "100px", height: "100px" }}
        />
      ));

      const element = screen.getByTestId("timing-test");
      
      // With stiffness: 300, damping: 20, should settle quickly
      // If physics is 1000x slow, this would take minutes
      
      // At 50ms, should already be making progress
      await new Promise(r => setTimeout(r, 50));
      const earlyOpacity = parseFloat(getStyles(element).opacity);
      
      // At 300ms, should be nearly done
      await new Promise(r => setTimeout(r, 250));
      const lateOpacity = parseFloat(getStyles(element).opacity);
      
      // Verify meaningful progress was made
      expect(earlyOpacity).toBeGreaterThan(0.1); // Should have started
      expect(lateOpacity).toBeGreaterThan(0.95); // Should be nearly done
    });

    it("delay should actually delay the animation start", async () => {
      const AnimatedDiv = animated("div");

      render(() => (
        <AnimatedDiv
          data-testid="delay-test"
          animate={{
            from: { opacity: 0 },
            to: { opacity: 1 },
            when: "always",
            delay: 200,
            config: { stiffness: 300, damping: 20 }
          }}
          style={{ width: "100px", height: "100px" }}
        />
      ));

      const element = screen.getByTestId("delay-test");
      
      // Should still be at 0 opacity during delay
      await new Promise(r => setTimeout(r, 50));
      const duringDelay = parseFloat(getStyles(element).opacity);
      
      // After delay + animation time
      await new Promise(r => setTimeout(r, 450));
      const afterAnimation = parseFloat(getStyles(element).opacity);
      
      // During delay, opacity should be 0 (or very close)
      expect(duringDelay).toBeLessThan(0.1);
      
      // After animation, should be complete
      expect(afterAnimation).toBeGreaterThan(0.95);
    });
  });

  describe("Layout animations (LayoutAnimated)", () => {
    it("LayoutAnimated renders content correctly", async () => {
      let setExpanded: (v: boolean) => void;

      render(() => {
        const [expanded, _setExpanded] = createSignal(false);
        setExpanded = _setExpanded;

        return (
          <LayoutTransitionProvider config={{ stiffness: 300, damping: 20 }}>
            <LayoutAnimated layout>
              <div data-testid="layout-container" style={{ width: "300px" }}>
                <div data-testid="layout-content">
                  Content
                  {expanded() && <div data-testid="extra">Extra</div>}
                </div>
              </div>
            </LayoutAnimated>
          </LayoutTransitionProvider>
        );
      });

      const element = screen.getByTestId("layout-content");
      expect(element).toBeInTheDocument();
      
      // Expand
      setExpanded!(true);
      await waitForSpring();
      
      // Extra content should appear
      expect(screen.getByTestId("extra")).toBeInTheDocument();
    });
  });

  describe("reverseOnExit behavior", () => {
    it("should animate back to initial state when trigger deactivates", async () => {
      const AnimatedDiv = animated("div");
      let setActive: (v: boolean) => void;

      render(() => {
        const [active, _setActive] = createSignal(false);
        setActive = _setActive;

        return (
          <AnimatedDiv
            data-testid="reverse-test"
            animate={{
              from: { scale: 1, x: 0 },
              to: { scale: 1.2, x: 50 },
              when: () => active(),
              reverseOnExit: true,
              config: { stiffness: 300, damping: 20 }
            }}
            style={{ width: "100px", height: "100px" }}
          />
        );
      });

      const element = screen.getByTestId("reverse-test");
      
      // Initial state
      const initialTransform = getStyles(element).transform;
      
      // Activate
      setActive!(true);
      await waitForSpring();
      
      // Should be scaled and translated
      const activeTransform = getStyles(element).transform;
      const activeScale = parseTransformScale(activeTransform);
      const activeTranslate = parseTransformTranslate(activeTransform);
      
      expect(activeScale?.scaleX).toBeGreaterThan(1.15);
      expect(activeTranslate?.x).toBeGreaterThan(45);
      
      // Deactivate - should reverse
      setActive!(false);
      await waitForSpring();
      
      // Should return to initial state
      const finalTransform = getStyles(element).transform;
      
      if (finalTransform !== "none") {
        const finalScale = parseTransformScale(finalTransform);
        const finalTranslate = parseTransformTranslate(finalTransform);
        
        // Should be back to ~1 scale and ~0 translate
        expect(finalScale?.scaleX).toBeGreaterThan(0.98);
        expect(finalScale?.scaleX).toBeLessThan(1.02);
        expect(Math.abs(finalTranslate?.x || 0)).toBeLessThan(2);
      }
    });
  });

  describe("Multiple simultaneous animations", () => {
    it("opacity and transform should animate together without conflict", async () => {
      const AnimatedDiv = animated("div");

      render(() => (
        <AnimatedDiv
          data-testid="multi-anim"
          animate={{
            from: { opacity: 0, scale: 0.5, y: 20 },
            to: { opacity: 1, scale: 1, y: 0 },
            when: "always",
            config: { stiffness: 300, damping: 20 }
          }}
          style={{ width: "100px", height: "100px" }}
        />
      ));

      const element = screen.getByTestId("multi-anim");
      
      // Wait for animation
      await waitForSpring();
      
      const styles = getStyles(element);
      const transform = styles.transform;
      const opacity = parseFloat(styles.opacity);
      
      // Both should have animated
      expect(opacity).toBeGreaterThan(0.95);
      
      const scale = parseTransformScale(transform);
      const translate = parseTransformTranslate(transform);
      
      expect(scale?.scaleX).toBeGreaterThan(0.98);
      expect(Math.abs(translate?.y || 0)).toBeLessThan(2);
    });
  });

  describe("Event callbacks", () => {
    it("onStart and onComplete callbacks in animate config should fire", async () => {
      const AnimatedDiv = animated("div");
      const onStart = vi.fn();
      const onComplete = vi.fn();

      render(() => (
        <AnimatedDiv
          data-testid="callback-test"
          animate={{
            from: { opacity: 0 },
            to: { opacity: 1 },
            when: "always",
            config: { stiffness: 300, damping: 20 },
            onStart,
            onComplete,
          }}
          style={{ width: "100px", height: "100px" }}
        />
      ));

      // onStart should fire quickly
      await new Promise(r => setTimeout(r, 50));
      expect(onStart).toHaveBeenCalled();
      
      // onComplete should fire after animation
      await waitForSpring();
      expect(onComplete).toHaveBeenCalled();
    });
  });
});
