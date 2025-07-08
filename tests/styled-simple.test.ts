import { describe, it, expect } from "vitest";
import { styled } from "../src/index";

describe("Styled Direct Test", () => {
  it("should create styled component directly", () => {
    expect(styled).toBeDefined();
    expect(typeof styled).toBe("function");

    // Test the proxy
    expect(styled.button).toBeDefined();
    expect(typeof styled.button).toBe("function");

    // Test creating a component
    const Button = styled.button`
      background: blue;
    `;

    expect(Button).toBeDefined();
    expect(typeof Button).toBe("function");
  });
});
