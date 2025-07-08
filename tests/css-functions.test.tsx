import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@solidjs/testing-library";
import { css, keyframes, createGlobalStyles } from "../src/index";
import { styled } from "../src/index";

describe("CSS Functions", () => {
  afterEach(() => {
    cleanup();
    // Clean up any global styles
    document.head.querySelectorAll("style").forEach((style) => {
      if (style.textContent?.includes("/* global-styles */")) {
        style.remove();
      }
    });
  });

  describe("css template function", () => {
    it("should process static CSS", () => {
      const styles = css`
        color: red;
        font-size: 16px;
      `;

      expect(styles).toContain("color: red");
      expect(styles).toContain("font-size: 16px");
    });

    it("should interpolate values", () => {
      const color = "blue";
      const size = 20;

      const styles = css`
        color: ${color};
        font-size: ${size}px;
      `;

      expect(styles).toContain("color: blue");
      expect(styles).toContain("font-size: 20px");
    });

    it("should handle nested template literals", () => {
      const baseStyles = css`
        padding: 10px;
        margin: 5px;
      `;

      const styles = css`
        ${baseStyles}
        color: green;
      `;

      expect(styles).toContain("padding: 10px");
      expect(styles).toContain("margin: 5px");
      expect(styles).toContain("color: green");
    });

    it("should handle functions as interpolations", () => {
      const getColor = (isPrimary: boolean) => (isPrimary ? "blue" : "gray");

      const styles = css`
        color: ${getColor(true)};
        background: ${getColor(false)};
      `;

      expect(styles).toContain("color: blue");
      expect(styles).toContain("background: gray");
    });

    it("should handle arrays in interpolations", () => {
      const shadows = ["0 2px 4px rgba(0,0,0,0.1)", "0 4px 8px rgba(0,0,0,0.2)"];

      const styles = css`
        box-shadow: ${shadows.join(", ")};
      `;

      expect(styles).toContain("box-shadow: 0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.2)");
    });

    it("should handle conditional styles", () => {
      const isActive = true;
      const isDisabled = false;

      const styles = css`
        ${isActive &&
        css`
          color: blue;
          font-weight: bold;
        `}
        ${isDisabled &&
        css`
          opacity: 0.5;
          cursor: not-allowed;
        `}
      `;

      expect(styles).toContain("color: blue");
      expect(styles).toContain("font-weight: bold");
      expect(styles).not.toContain("opacity: 0.5");
    });

    it("should work with styled components", () => {
      const Button = styled("button")`
        ${css`
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
        `}
        background: blue;
        color: white;
      `;

      const { container } = render(() => <Button>Click me</Button>);
      const button = container.querySelector("button");

      expect(button).toBeTruthy();
      expect(button?.className).toBeTruthy();
    });

    it("should handle media queries", () => {
      const styles = css`
        width: 100%;

        @media (min-width: 768px) {
          width: 50%;
        }

        @media (min-width: 1024px) {
          width: 33.33%;
        }
      `;

      expect(styles).toContain("width: 100%");
      expect(styles).toContain("@media (min-width: 768px)");
      expect(styles).toContain("@media (min-width: 1024px)");
    });

    it("should handle pseudo-classes and pseudo-elements", () => {
      const styles = css`
        &:hover {
          color: blue;
        }

        &:focus {
          outline: 2px solid blue;
        }

        &::before {
          content: "";
          display: block;
        }

        &:nth-child(2n) {
          background: #f0f0f0;
        }
      `;

      expect(styles).toContain("&:hover");
      expect(styles).toContain("&:focus");
      expect(styles).toContain("&::before");
      expect(styles).toContain("&:nth-child(2n)");
    });

    it("should handle CSS variables", () => {
      const primaryColor = "#007bff";

      const styles = css`
        --primary-color: ${primaryColor};
        color: var(--primary-color);
        background: var(--bg-color, #ffffff);
      `;

      expect(styles).toContain("--primary-color: #007bff");
      expect(styles).toContain("color: var(--primary-color)");
      expect(styles).toContain("background: var(--bg-color, #ffffff)");
    });
  });

  describe("keyframes", () => {
    it("should create basic keyframes", () => {
      const fadeIn = keyframes`
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      `;

      expect(fadeIn).toBeTruthy();
      expect(typeof fadeIn).toBe("string");
      expect(fadeIn).toMatch(/^[a-zA-Z0-9_-]+$/); // Should be a valid CSS identifier
    });

    it("should handle percentage keyframes", () => {
      const pulse = keyframes`
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.05);
        }
        100% {
          transform: scale(1);
        }
      `;

      expect(pulse).toBeTruthy();

      // Check if keyframes are injected into document
      const styleElements = document.querySelectorAll("style");
      const hasKeyframes = Array.from(styleElements).some(
        (style) => style.textContent?.includes("@keyframes") && style.textContent?.includes("transform: scale")
      );

      expect(hasKeyframes).toBe(true);
    });

    it("should support interpolations in keyframes", () => {
      const startColor = "red";
      const endColor = "blue";
      const duration = "2s";

      const colorChange = keyframes`
        from {
          color: ${startColor};
        }
        to {
          color: ${endColor};
        }
      `;

      expect(colorChange).toBeTruthy();

      // Check if interpolated values are in the keyframes
      const styleElements = document.querySelectorAll("style");
      const hasColors = Array.from(styleElements).some(
        (style) => style.textContent?.includes("color: red") && style.textContent?.includes("color: blue")
      );

      expect(hasColors).toBe(true);
    });

    it("should work with animations in styled components", () => {
      const rotate = keyframes`
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      `;

      const Spinner = styled("div")`
        animation: ${rotate} 2s linear infinite;
        width: 50px;
        height: 50px;
      `;

      const { container } = render(() => <Spinner />);
      const spinner = container.querySelector("div");

      expect(spinner).toBeTruthy();
      expect(spinner?.className).toBeTruthy();
    });

    it("should handle complex keyframes", () => {
      const bounce = keyframes`
        0%, 20%, 50%, 80%, 100% {
          transform: translateY(0);
        }
        40% {
          transform: translateY(-30px);
        }
        60% {
          transform: translateY(-15px);
        }
      `;

      expect(bounce).toBeTruthy();

      const styleElements = document.querySelectorAll("style");
      const hasBounce = Array.from(styleElements).some(
        (style) => style.textContent?.includes("translateY(0)") && style.textContent?.includes("translateY(-30px)")
      );

      expect(hasBounce).toBe(true);
    });

    it("should generate unique names for different keyframes", () => {
      const fadeIn = keyframes`
        from { opacity: 0; }
        to { opacity: 1; }
      `;

      const fadeOut = keyframes`
        from { opacity: 1; }
        to { opacity: 0; }
      `;

      expect(fadeIn).not.toBe(fadeOut);
    });

    it("should handle vendor prefixes", () => {
      const transform3d = keyframes`
        from {
          transform: translate3d(0, 0, 0);
          -webkit-transform: translate3d(0, 0, 0);
        }
        to {
          transform: translate3d(100px, 0, 0);
          -webkit-transform: translate3d(100px, 0, 0);
        }
      `;

      expect(transform3d).toBeTruthy();

      const styleElements = document.querySelectorAll("style");
      const hasVendorPrefix = Array.from(styleElements).some((style) =>
        style.textContent?.includes("-webkit-transform")
      );

      expect(hasVendorPrefix).toBe(true);
    });
  });

  describe("createGlobalStyles", () => {
    it("should inject global styles", () => {
      const GlobalStyles = createGlobalStyles`
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
        }
      `;

      render(() => <GlobalStyles />);

      const styleElements = document.querySelectorAll("style");
      const hasGlobalStyles = Array.from(styleElements).some(
        (style) =>
          style.textContent?.includes("body") &&
          style.textContent?.includes("margin: 0") &&
          style.textContent?.includes("font-family: Arial, sans-serif")
      );

      expect(hasGlobalStyles).toBe(true);
    });

    it("should support interpolations", () => {
      const primaryFont = "Helvetica, Arial, sans-serif";
      const baseSize = "16px";

      const GlobalStyles = createGlobalStyles`
        :root {
          --primary-font: ${primaryFont};
          --base-size: ${baseSize};
        }
        
        body {
          font-family: var(--primary-font);
          font-size: var(--base-size);
        }
      `;

      render(() => <GlobalStyles />);

      const styleElements = document.querySelectorAll("style");
      const hasInterpolatedValues = Array.from(styleElements).some(
        (style) =>
          style.textContent?.includes(`--primary-font: ${primaryFont}`) &&
          style.textContent?.includes(`--base-size: ${baseSize}`)
      );

      expect(hasInterpolatedValues).toBe(true);
    });

    it("should handle CSS reset patterns", () => {
      const GlobalReset = createGlobalStyles`
        * {
          box-sizing: border-box;
        }
        
        *::before,
        *::after {
          box-sizing: inherit;
        }
        
        html, body, div, span, h1, h2, h3, h4, h5, h6 {
          margin: 0;
          padding: 0;
        }
      `;

      render(() => <GlobalReset />);

      const styleElements = document.querySelectorAll("style");
      const hasReset = Array.from(styleElements).some(
        (style) =>
          style.textContent?.includes("box-sizing: border-box") &&
          style.textContent?.includes("*::before") &&
          style.textContent?.includes("margin: 0")
      );

      expect(hasReset).toBe(true);
    });

    it("should handle media queries in global styles", () => {
      const GlobalResponsive = createGlobalStyles`
        body {
          font-size: 14px;
        }
        
        @media (min-width: 768px) {
          body {
            font-size: 16px;
          }
        }
        
        @media (min-width: 1024px) {
          body {
            font-size: 18px;
          }
        }
      `;

      render(() => <GlobalResponsive />);

      const styleElements = document.querySelectorAll("style");
      const hasMediaQueries = Array.from(styleElements).some(
        (style) =>
          style.textContent?.includes("@media (min-width: 768px)") &&
          style.textContent?.includes("@media (min-width: 1024px)")
      );

      expect(hasMediaQueries).toBe(true);
    });

    it("should support CSS custom properties", () => {
      const theme = {
        primary: "#007bff",
        secondary: "#6c757d",
        success: "#28a745",
        danger: "#dc3545",
      };

      const GlobalTheme = createGlobalStyles`
        :root {
          --color-primary: ${theme.primary};
          --color-secondary: ${theme.secondary};
          --color-success: ${theme.success};
          --color-danger: ${theme.danger};
        }
        
        .btn-primary {
          background-color: var(--color-primary);
        }
      `;

      render(() => <GlobalTheme />);

      const styleElements = document.querySelectorAll("style");
      const hasThemeVars = Array.from(styleElements).some(
        (style) =>
          style.textContent?.includes(`--color-primary: ${theme.primary}`) &&
          style.textContent?.includes("background-color: var(--color-primary)")
      );

      expect(hasThemeVars).toBe(true);
    });

    it("should handle font-face declarations", () => {
      const GlobalFonts = createGlobalStyles`
        @font-face {
          font-family: 'CustomFont';
          src: url('/fonts/custom.woff2') format('woff2'),
               url('/fonts/custom.woff') format('woff');
          font-weight: 400;
          font-style: normal;
        }
        
        body {
          font-family: 'CustomFont', sans-serif;
        }
      `;

      render(() => <GlobalFonts />);

      const styleElements = document.querySelectorAll("style");
      const hasFontFace = Array.from(styleElements).some(
        (style) => style.textContent?.includes("@font-face") && style.textContent?.includes("font-family: 'CustomFont'")
      );

      expect(hasFontFace).toBe(true);
    });

    it("should remove styles on unmount", () => {
      const GlobalStyles = createGlobalStyles`
        body {
          background: red;
        }
      `;

      const { unmount } = render(() => <GlobalStyles />);

      // Check styles are added
      let hasStyles = Array.from(document.querySelectorAll("style")).some((style) =>
        style.textContent?.includes("background: red")
      );
      expect(hasStyles).toBe(true);

      // Unmount
      unmount();

      // Check styles are removed
      hasStyles = Array.from(document.querySelectorAll("style")).some((style) =>
        style.textContent?.includes("background: red")
      );
      expect(hasStyles).toBe(false);
    });

    it("should handle print styles", () => {
      const GlobalPrint = createGlobalStyles`
        @media print {
          body {
            background: white;
            color: black;
          }
          
          .no-print {
            display: none;
          }
        }
      `;

      render(() => <GlobalPrint />);

      const styleElements = document.querySelectorAll("style");
      const hasPrintStyles = Array.from(styleElements).some(
        (style) => style.textContent?.includes("@media print") && style.textContent?.includes(".no-print")
      );

      expect(hasPrintStyles).toBe(true);
    });

    it("should support CSS Grid and Flexbox utilities", () => {
      const GlobalLayout = createGlobalStyles`
        .container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }
        
        .flex-center {
          display: flex;
          justify-content: center;
          align-items: center;
        }
      `;

      render(() => <GlobalLayout />);

      const styleElements = document.querySelectorAll("style");
      const hasLayoutStyles = Array.from(styleElements).some(
        (style) =>
          style.textContent?.includes("grid-template-columns") && style.textContent?.includes("justify-content: center")
      );

      expect(hasLayoutStyles).toBe(true);
    });
  });

  describe("Integration between css, keyframes, and createGlobalStyles", () => {
    it("should work together in a theme", () => {
      const primaryColor = "#007bff";
      const secondaryColor = "#6c757d";

      // Create animation
      const fadeIn = keyframes`
        from { opacity: 0; }
        to { opacity: 1; }
      `;

      // Create global styles
      const GlobalStyles = createGlobalStyles`
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        
        .theme-primary {
          color: ${primaryColor};
        }
      `;

      // Create component with css helper
      const ThemedButton = styled("button")`
        ${css`
          background: ${primaryColor};
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 4px;
          animation: ${fadeIn} 0.3s ease-in-out;

          &:hover {
            background: ${secondaryColor};
          }
        `}
      `;

      const { container } = render(() => (
        <>
          <GlobalStyles />
          <ThemedButton>Themed Button</ThemedButton>
        </>
      ));

      const button = container.querySelector("button");
      expect(button).toBeTruthy();

      // Check for integrated styles - more robust detection in browser
      const hasIntegratedStyles =
        // Check if button exists and has styles
        button !== null &&
        // Check if global styles are applied (look for style elements)
        document.head.querySelectorAll("style").length > 0 &&
        // Check if button has some styling applied
        (button.style.length > 0 ||
          window.getComputedStyle(button).backgroundColor !== "rgba(0, 0, 0, 0)" ||
          button.className.length > 0);

      expect(hasIntegratedStyles).toBe(true);
    });
  });
});
