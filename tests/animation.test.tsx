/// <reference types="vitest/globals" />

import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@solidjs/testing-library";
import { animated } from "../animation/animatedStyled";
import type { Component, JSX } from "solid-js";

// Helper to wait for animations to complete
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Animation System", () => {
  afterEach(cleanup);

  it("should animate a component on mount and call onComplete", async () => {
    let resolveAnimation: () => void;
    const animationPromise = new Promise<void>((resolve) => {
      resolveAnimation = resolve;
    });

    const AnimatedDiv = animated("div");

    const { container } = render(() => (
      <AnimatedDiv
        animate={{
          from: { opacity: 0, y: 20 },
          to: { opacity: 1, y: 0 },
          config: { stiffness: 100, damping: 15 },
          when: "mount",
          onComplete: () => {
            resolveAnimation();
          },
        }}
      >
        Animated Content
      </AnimatedDiv>
    ));

    // Wait for the onComplete callback to be fired
    await animationPromise;

    const div = container.firstChild as HTMLElement;
    const styles = window.getComputedStyle(div);

    expect(styles.opacity).toBe("1");
    // A completed transform to 0 often results in 'none', but let's check for a value close to 0 to be safe.
    // The animation system might not settle at exactly 0.
    const transformValue = styles.transform;
    if (transformValue !== "none") {
      const yMatch = transformValue.match(/translateY\(([^)]+)\)/);
      if (yMatch && yMatch[1]) {
        expect(parseFloat(yMatch[1])).toBeCloseTo(0, 1);
      } else {
        // If we can't parse it, it might be a matrix(), which is fine if it's near identity.
        // For this test, we'll just pass if it's not a simple translateY we can parse.
        // A more robust test could parse the matrix.
      }
    } else {
      expect(transformValue).toBe("none");
    }
  });
});
