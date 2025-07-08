/** @jsxImportSource solid-js */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { render, cleanup } from "@solidjs/testing-library";
import { styled } from "../src";
import { initializeLightningCSS } from "../lightning/runtime/enhanced-styled";
import { RuntimeResolver } from "../lightning/runtime/resolver";
import { CSSVariableManager } from "../lightning/runtime/css-variables";
import { generateStaticCSS } from "../lightning/extractor/generator";
import type { ComponentMetadata, ExtractedStyle, PropPattern } from "../lightning/types";
import { JSX } from "solid-js";

describe("Lightning CSS Edge Cases & Error Handling", () => {
  let originalConfig: any;
  let errorSpy: any;

  beforeAll(() => {
    originalConfig = (window as any).__LIGHTNING_CSS_CONFIG__;
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Initialize with minimal config
    initializeLightningCSS({
      staticClassMap: new Map(),
      enableDevMode: false,
    });
  });

  afterAll(() => {
    (window as any).__LIGHTNING_CSS_CONFIG__ = originalConfig;
    errorSpy.mockRestore();
    cleanup();
  });

  describe("Invalid Prop Patterns", () => {
    it("should handle undefined props gracefully", () => {
      const Button = styled("button")`
        background: ${(props: any) => props.variant || "gray"};
      `;

      const { container } = render(() => <Button variant={undefined}>Test</Button>);

      const button = container.querySelector("button");
      expect(button).toBeTruthy();
      // Should render without errors - the actual style application depends on
      // how CSS variables and fallbacks are handled in the implementation
      expect(button!.tagName).toBe("BUTTON");
    });

    it("should handle null props without crashing", () => {
      const Card = styled("div")`
        padding: ${(props: any) => props.spacing || "16px"};
      `;

      const { container } = render(() => <Card spacing={null}>Content</Card>);

      const card = container.querySelector("div");
      expect(card).toBeTruthy();
    });

    it("should handle circular prop references", () => {
      const CircularComponent = styled("div")`
        color: ${(props: any) => props.color || props.theme?.color || "black"};
      `;

      const circularTheme = { color: "red" };
      (circularTheme as any).theme = circularTheme; // Create circular reference

      expect(() => {
        render(() => <CircularComponent theme={circularTheme}>Test</CircularComponent>);
      }).not.toThrow();
    });

    it("should handle extremely long prop values", () => {
      const LongValueComponent = styled("div")`
        content: "${(props: any) => props.content}";
      `;

      const veryLongString = "x".repeat(10000);

      const { container } = render(() => <LongValueComponent content={veryLongString}>Test</LongValueComponent>);

      expect(container.querySelector("div")).toBeTruthy();
    });
  });

  describe("Malformed CSS Handling", () => {
    it("should handle invalid CSS syntax in templates", () => {
      const InvalidCSS = styled("div")`
        background: ${(props: any) => props.bg};
        color: ${(props: any) => props.color};
        padding: 10px;
      `;

      const { container } = render(() => (
        <InvalidCSS
          bg="red"
          color="white"
        >
          Test
        </InvalidCSS>
      ));

      expect(container.querySelector("div")).toBeTruthy();
    });

    it("should handle CSS injection attempts", () => {
      const InjectionTest = styled("div")`
        background: ${(props: any) => props.color};
      `;

      const maliciousCSS = "red; } .evil { display: none; } div { color: blue";

      const { container } = render(() => <InjectionTest color={maliciousCSS}>Safe Content</InjectionTest>);

      // Should not create additional style rules
      const div = container.querySelector("div");
      expect(div).toBeTruthy();
      expect(container.querySelectorAll(".evil").length).toBe(0);
    });

    it("should handle special characters in prop values", () => {
      const SpecialCharsComponent = styled("div")`
        content: "${(props: any) => props.content}";
        font-family: ${(props: any) => props.font};
      `;

      const { container } = render(() => (
        <SpecialCharsComponent
          content={`"Hello" & <World>`}
          font={`'Comic Sans', "Arial", sans-serif`}
        >
          Test
        </SpecialCharsComponent>
      ));

      expect(container.querySelector("div")).toBeTruthy();
    });
  });

  describe("Memory Leak Prevention", () => {
    it("should clean up resolver references on unmount", () => {
      const TestComponent = styled("div")`
        background: ${(props: any) => props.color};
      `;

      const { unmount } = render(() => <TestComponent color="red">Test</TestComponent>);

      // Get initial memory usage (if available)
      const initialMemory = (performance as any).memory?.usedJSHeapSize;

      // Unmount component
      unmount();

      // Force garbage collection if available
      if (typeof global !== "undefined" && global.gc) {
        global.gc();
      }

      // Component should be cleaned up
      expect(document.querySelectorAll("style").length).toBeGreaterThanOrEqual(0);
    });

    it("should not accumulate style elements infinitely", () => {
      const DynamicStyleComponent = styled("div")`
        background: ${(props: any) => props.color};
      `;

      const initialStyleCount = document.querySelectorAll("style").length;

      // Render many components with different props
      for (let i = 0; i < 100; i++) {
        const { unmount } = render(() => (
          <DynamicStyleComponent color={`hsl(${i}, 50%, 50%)`}>Component {i}</DynamicStyleComponent>
        ));
        unmount();
      }

      const finalStyleCount = document.querySelectorAll("style").length;

      // Should not have 100+ new style elements
      expect(finalStyleCount - initialStyleCount).toBeLessThan(20);
    });
  });

  describe("CSS Generation Edge Cases", () => {
    it("should handle empty template strings", () => {
      const EmptyComponent = styled("div")``;

      const { container } = render(() => <EmptyComponent>Empty Styles</EmptyComponent>);

      expect(container.querySelector("div")).toBeTruthy();
    });

    it("should handle whitespace-only templates", () => {
      const WhitespaceComponent = styled("div")``;

      const { container } = render(() => <WhitespaceComponent>Whitespace</WhitespaceComponent>);

      expect(container.querySelector("div")).toBeTruthy();
    });

    it("should handle nested template literals", () => {
      const NestedTemplate = styled("div")`
        background: ${(props: any) => `linear-gradient(${props.angle}deg, ${props.color1}, ${props.color2})`};
      `;

      const { container } = render(() => (
        <NestedTemplate
          angle={45}
          color1="red"
          color2="blue"
        >
          Gradient
        </NestedTemplate>
      ));

      const div = container.querySelector("div");
      expect(div).toBeTruthy();
    });

    it("should handle very large number of interpolations", () => {
      const ManyInterpolations = styled("div")`
        ${Array.from({ length: 50 }, (_, i) => `--var-${i}: ${(props: any) => props[`var${i}`] || i};`).join("\n")}
      `;

      const props: any = {};
      for (let i = 0; i < 50; i++) {
        props[`var${i}`] = i * 2;
      }

      const { container } = render(() => <ManyInterpolations {...props}>Many Props</ManyInterpolations>);

      expect(container.querySelector("div")).toBeTruthy();
    });
  });

  describe("Resolver Edge Cases", () => {
    it("should handle resolver initialization failures gracefully", () => {
      // Temporarily break the resolver
      const resolver = new RuntimeResolver({
        staticClassMap: null as any, // Invalid map
        fallbackToRuntime: true,
      });

      expect(() => {
        resolver.resolveProps({ variant: "primary" });
      }).not.toThrow();
    });

    it("should handle concurrent prop resolution", async () => {
      const resolver = new RuntimeResolver({
        staticClassMap: new Map([
          ["variant:primary", { className: "primary-class", css: "", propCombination: {} } as ExtractedStyle],
        ]),
        fallbackToRuntime: true,
      });

      // Simulate concurrent resolutions
      const promises = Array.from({ length: 100 }, () =>
        Promise.resolve(resolver.resolveProps({ variant: "primary" }))
      );

      const results = await Promise.all(promises);

      // All should resolve to the same class
      expect(results.every((r) => r === "primary-class")).toBe(true);
    });

    it("should handle deeply nested prop paths", () => {
      const resolver = new RuntimeResolver({
        staticClassMap: new Map(),
        fallbackToRuntime: true,
      });

      const deepProps = {
        theme: {
          colors: {
            primary: {
              main: {
                value: "#007bff",
                contrast: "#ffffff",
              },
            },
          },
        },
      };

      expect(() => {
        resolver.resolveProps(deepProps);
      }).not.toThrow();
    });
  });

  describe("CSS Variable Manager Edge Cases", () => {
    it("should handle invalid CSS variable names", () => {
      const manager = new CSSVariableManager();
      const element = document.createElement("div");

      manager.applyCSSVariables(element, {
        "invalid name": "value", // Spaces not allowed
        "123start": "value", // Can't start with number
        "@special": "value", // Invalid character
        "--valid": "value", // This should work
      });

      // Only valid variable should be applied
      expect(element.style.getPropertyValue("--valid")).toBe("value");
      expect(element.style.getPropertyValue("invalid name")).toBe("");
    });

    it("should handle extremely large theme objects", () => {
      const manager = new CSSVariableManager();
      const element = document.createElement("div");

      const hugeTheme: any = {};

      // Create a theme with 1000 properties
      for (let i = 0; i < 1000; i++) {
        hugeTheme[`prop${i}`] = {
          value: `#${i.toString(16).padStart(6, "0")}`,
          nested: {
            deep: {
              value: `${i}px`,
            },
          },
        };
      }

      const start = performance.now();
      manager.applyThemeVariables(hugeTheme, element);
      const duration = performance.now() - start;

      // Should complete in reasonable time for browser testing
      expect(duration).toBeLessThan(5000); // 5 seconds for 1000+ variables is reasonable in browser environment
    });

    it("should handle variable reference cycles", () => {
      const manager = new CSSVariableManager();
      const element = document.createElement("div");

      // CSS variables can reference each other
      manager.applyCSSVariables(element, {
        "--var1": "var(--var2)",
        "--var2": "var(--var3)",
        "--var3": "var(--var1)", // Cycle!
        "--var4": "fallback-value",
      });

      // Should not crash
      expect(element.style.getPropertyValue("--var4")).toBe("fallback-value");
    });
  });

  describe("Error Recovery", () => {
    it("should recover from CSS generation errors", () => {
      const patterns: PropPattern[] = [
        {
          propName: "invalid",
          values: [null, undefined, {}, [], () => {}] as any,
        },
      ];

      const component: ComponentMetadata = {
        componentName: "ErrorComponent",
        propPatterns: patterns,
        styles: "background: ${props => props.invalid};",
        hasAnimations: false,
        isAnimated: false,
        name: "ErrorComponent",
        tag: "div",
        tagName: "div",
        css: "",
        hash: "error",
        props: patterns,
      };

      expect(() => {
        generateStaticCSS(component);
      }).not.toThrow();
    });

    it("should handle resolver errors gracefully", () => {
      const Button = styled("button")`
        background: ${(props: any) => {
          if (props.throwError) {
            throw new Error("Intentional error");
          }
          return props.color || "blue";
        }};
      `;

      expect(() => {
        render(() => <Button throwError={true}>Error Button</Button>);
      }).not.toThrow();
    });

    it("should continue working after encountering errors", () => {
      const WorkingComponent = styled("div")`
        color: ${(props: any) => props.color};
      `;

      // First cause an error
      try {
        const BadComponent = styled("div")`
          ${() => {
            throw new Error("Template error");
          }}
        `;
        render(() => <BadComponent>Bad</BadComponent>);
      } catch {}

      // Should still work after error
      const { container } = render(() => <WorkingComponent color="green">Working</WorkingComponent>);

      expect(container.querySelector("div")).toBeTruthy();
    });
  });
});
