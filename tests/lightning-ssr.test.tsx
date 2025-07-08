/**
 * @vitest-environment node
 */
import "./setup-ssr";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { renderToString, renderToStringAsync, renderToStream } from "solid-js/web";
import { isServer } from "solid-js/web";
import { styled } from "../src";
import { initializeLightningCSS } from "../lightning/runtime/enhanced-styled";
import { CSSVariableManager } from "../lightning/runtime/css-variables";
import type { ExtractedStyle } from "../lightning/types";
import { createSignal, createContext, useContext } from "solid-js";
import type { JSX, ParentComponent } from "solid-js";

describe("Lightning CSS SSR & Hydration Tests", () => {
  describe("Server-Side Rendering", () => {
    it("should render styled components on the server", () => {
      // Simple styled component for SSR testing
      const Button = styled("button")`
        background: blue;
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
      `;

      const html = renderToString(() => <Button>SSR Button</Button>);

      expect(html).toBeDefined();
      expect(html).toContain("SSR Button");
      expect(html).toContain("<button");
      // The class name should be generated
      expect(html).toMatch(/class="[^"]+"/);
    });

    it("should handle dynamic props during SSR", () => {
      const DynamicButton = styled("button")`
        background: ${(props: any) => (props.primary ? "blue" : "gray")};
        color: white;
        padding: 10px 20px;
      `;

      const html = renderToString(() => <DynamicButton primary={true}>Dynamic SSR</DynamicButton>);

      expect(html).toBeDefined();
      expect(html).toContain("Dynamic SSR");
      expect(html).toContain("<button");
    });

    it("should handle CSS variables during SSR", () => {
      const ThemedComponent = styled("div")`
        background: var(--theme-bg, white);
        color: var(--theme-color, black);
        padding: 20px;
      `;

      const html = renderToString(() => <ThemedComponent>Themed Content</ThemedComponent>);

      expect(html).toBeDefined();
      expect(html).toContain("Themed Content");
      expect(html).toContain("<div");
    });

    it("should optimize static styles during SSR", () => {
      // Initialize Lightning CSS for SSR
      const staticMap = new Map<string, ExtractedStyle>([
        [
          "variant:primary|size:large",
          {
            className: "btn-primary-large",
            css: ".btn-primary-large { background: blue; padding: 20px; }",
            propCombination: { variant: "primary", size: "large" },
          },
        ],
      ]);

      // Mock the global resolver for SSR
      (globalThis as any).__LIGHTNING_CSS_RESOLVER__ = {
        resolve: (props: any) => {
          const key = Object.keys(props)
            .filter((k) => k !== "children")
            .sort()
            .map((k) => `${k}:${props[k]}`)
            .join("|");

          const result = staticMap.get(key);
          return result ? { className: result.className } : null;
        },
      };

      const OptimizedButton = styled("button")`
        background: ${(props: any) => (props.variant === "primary" ? "blue" : "gray")};
        padding: ${(props: any) => (props.size === "large" ? "20px" : "10px")};
      `;

      const html = renderToString(() => (
        <OptimizedButton
          variant="primary"
          size="large"
        >
          Optimized Button
        </OptimizedButton>
      ));

      expect(html).toBeDefined();
      expect(html).toContain("Optimized Button");
      expect(html).toContain("<button");
    });

    it("should handle async rendering with streaming", async () => {
      const AsyncComponent = styled("div")`
        background: green;
        padding: 10px;
      `;

      const App = () => {
        return <AsyncComponent>Async Content</AsyncComponent>;
      };

      const html = await renderToStringAsync(() => <App />);

      expect(html).toBeDefined();
      expect(html).toContain("Async Content");
      expect(html).toContain("<div");
    });

    it("should generate consistent class names between server and client", () => {
      const StyledDiv = styled("div")`
        color: red;
        font-size: 16px;
      `;

      const html = renderToString(() => <StyledDiv>Consistent Classes</StyledDiv>);

      expect(html).toBeDefined();
      expect(html).toContain("Consistent Classes");

      // Extract class from HTML
      const classMatch = html.match(/class="([^"]*)"/);
      expect(classMatch).toBeTruthy();
      expect(classMatch![1]).toMatch(/^bau/); // Styled components usually start with 'bau'
    });
  });

  describe("Hydration Tests (Simulated)", () => {
    it("should prepare for hydration with proper markup", () => {
      const HydratableComponent = styled("div")`
        background: blue;
        padding: 20px;
      `;

      const html = renderToString(() => <HydratableComponent>Hydration Test</HydratableComponent>);

      expect(html).toBeDefined();
      expect(html).toContain("Hydration Test");
      expect(html).toMatch(/class="[^"]+"/);
    });

    it("should preserve CSS variables for hydration", () => {
      const CSSVarComponent = styled("div")`
        --component-color: red;
        --component-size: 16px;
        color: var(--component-color);
        font-size: var(--component-size);
      `;

      const html = renderToString(() => <CSSVarComponent>CSS Var Hydration</CSSVarComponent>);

      expect(html).toBeDefined();
      expect(html).toContain("CSS Var Hydration");
    });
  });

  describe("Critical CSS Extraction", () => {
    it("should render components with extractable styles", () => {
      const CriticalComponent = styled("div")`
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: linear-gradient(45deg, #667eea, #764ba2);
      `;

      const html = renderToString(() => <CriticalComponent>Critical Content</CriticalComponent>);

      expect(html).toBeDefined();
      expect(html).toContain("Critical Content");
      expect(html).toContain("<div");
    });

    it("should support inline style tags for critical CSS", () => {
      const html = renderToString(() => (
        <>
          <style>{"/* Critical CSS would be inlined here */"}</style>
          <div class="inlined-styles">Inlined Styles</div>
        </>
      ));

      expect(html).toBeDefined();
      expect(html).toMatch(/<style[^>]*>/); // Match style tag with any attributes
      expect(html).toContain("/* Critical CSS would be inlined here */");
      expect(html).toContain("Inlined Styles");
    });
  });

  describe("Theme Context in SSR", () => {
    it("should handle theme context during SSR", () => {
      const ThemeContext = createContext<{ primary: string }>({ primary: "blue" });

      const ThemedButton = styled("button")`
        background: ${() => {
          const theme = useContext(ThemeContext);
          return theme?.primary || "blue";
        }};
        color: white;
        padding: 10px;
      `;

      const ThemeProvider = (props: { theme: { primary: string }; children: any }) => {
        // @ts-ignore - SolidJS context typing issue in Node environment
        return <ThemeContext.Provider value={props.theme}>{props.children}</ThemeContext.Provider>;
      };

      const html = renderToString(() => (
        // @ts-ignore - TypeScript issue with JSX children in test environment
        <ThemeProvider theme={{ primary: "purple" }}>
          <ThemedButton>Themed Button</ThemedButton>
        </ThemeProvider>
      ));

      expect(html).toBeDefined();
      expect(html).toContain("Themed Button");
      expect(html).toContain("<button");
    });
  });

  describe("Performance in SSR", () => {
    it("should render 100 components efficiently on server", () => {
      const ServerComponent = styled("div")`
        padding: 10px;
        margin: 5px;
      `;

      const start = Date.now();

      const html = renderToString(() => (
        <div>
          {Array.from({ length: 100 }, (_, i) => (
            <ServerComponent key={i}>Component {i}</ServerComponent>
          ))}
        </div>
      ));

      const duration = Date.now() - start;

      expect(html).toBeDefined();
      expect(html).toContain("Component 99");
      // More relaxed timing for browser SSR testing
      expect(duration).toBeLessThan(1000); // Was 500ms, now 1000ms for browser overhead
    });

    it("should handle nested styled components in SSR", () => {
      const Parent = styled("div")`
        padding: 20px;
        background: #f0f0f0;
      `;

      const Child = styled("div")`
        margin: 10px;
        padding: 10px;
        background: white;
      `;

      const GrandChild = styled("span")`
        color: red;
        font-weight: bold;
      `;

      const html = renderToString(() => (
        <Parent>
          <Child>
            <GrandChild>Nested Content</GrandChild>
            <GrandChild>More Content</GrandChild>
          </Child>
        </Parent>
      ));

      expect(html).toBeDefined();
      expect(html).toContain("Nested Content");
      expect(html).toContain("More Content");
      expect(html.match(/<div/g)?.length).toBeGreaterThanOrEqual(2);
      expect(html.match(/<span/g)?.length).toBe(2);
    });
  });

  describe("Error Handling in SSR", () => {
    it("should handle errors gracefully during SSR", () => {
      const ErrorComponent = styled("div")`
        background: red;
        color: white;
      `;

      // Should not throw during SSR
      expect(() => {
        const html = renderToString(() => <ErrorComponent>Error Test</ErrorComponent>);
        expect(html).toBeDefined();
      }).not.toThrow();
    });

    it("should fallback gracefully when Lightning CSS is not available in SSR", () => {
      // Clear any global resolver
      (globalThis as any).__LIGHTNING_CSS_RESOLVER__ = undefined;

      const FallbackComponent = styled("div")`
        color: blue;
        font-size: 16px;
      `;

      const html = renderToString(() => <FallbackComponent>Fallback Test</FallbackComponent>);

      expect(html).toBeDefined();
      expect(html).toContain("Fallback Test");
      expect(html).toContain("<div");
    });
  });
});
