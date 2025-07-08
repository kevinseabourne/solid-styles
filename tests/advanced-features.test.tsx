/// <reference types="vitest/globals" />

import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@solidjs/testing-library";
import { styled } from "../src";
import type { Component, JSX } from "solid-js";

describe("Advanced Styled Component Features", () => {
  afterEach(cleanup);

  it("should be able to style a custom SolidJS component", () => {
    // Define a simple custom component
    const CustomComponent: Component<{ class?: string; children?: JSX.Element }> = (props) => {
      return <div class={`custom-base ${props.class || ""}`}>{props.children}</div>;
    };

    // Style the custom component
    const StyledCustom = styled(CustomComponent)`
      color: red;
      font-size: 20px;
    `;

    const { container } = render(() => <StyledCustom>Hello World</StyledCustom>);
    const div = container.querySelector("div");

    expect(div).toBeTruthy();
    // Check for the base class from the original component
    expect(div?.classList.contains("custom-base")).toBe(true);
    // Check for the generated class from Solid Styles
    expect(div?.className).toMatch(/bau/);

    // Check if the styles are applied
    const styles = window.getComputedStyle(div!);
    expect(styles.color).toBe("rgb(255, 0, 0)");
    expect(styles.fontSize).toBe("20px");
  });

  it("should allow extending styles from another styled component", () => {
    const BaseButton = styled.button`
      color: white;
      padding: 10px;
    `;

    const ExtendedButton = styled(BaseButton)`
      background-color: blue;
      border-radius: 5px;
    `;

    const { container } = render(() => <ExtendedButton>Extended</ExtendedButton>);
    const button = container.querySelector("button");
    const styles = window.getComputedStyle(button!);

    // Check for styles from BaseButton
    expect(styles.color).toBe("rgb(255, 255, 255)");
    expect(styles.padding).toBe("10px");

    // Check for styles from ExtendedButton
    expect(styles.backgroundColor).toBe("rgb(0, 0, 255)");
    expect(styles.borderRadius).toBe("5px");
  });

  it("should render a different element using the `as` prop", () => {
    const Button = styled.button`
      font-weight: bold;
    `;

    // Render the Button component but as an 'a' tag
    const { container } = render(() => (
      <Button
        as="a"
        href="#"
      >
        Click as Link
      </Button>
    ));

    // Check that no button element exists
    const buttonEl = container.querySelector("button");
    expect(buttonEl).toBeNull();

    // Check that an 'a' element was rendered instead
    const linkEl = container.querySelector("a");
    expect(linkEl).toBeTruthy();
    expect(linkEl?.textContent).toBe("Click as Link");
    expect(linkEl?.getAttribute("href")).toBe("#");

    // Check that the styles from the Button component were applied to the 'a' tag
    const styles = window.getComputedStyle(linkEl!);
    expect(["bold", "700"]).toContain(styles.fontWeight);
  });
});
