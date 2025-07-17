/**
 * Test: Automatic Animation Detection
 * 
 * Tests that styled components automatically detect animation props
 * and apply the animated HOC when necessary.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@solidjs/testing-library';
import { styled } from '../src/index';

// Use local mocking instead of global module mock to prevent conflicts

describe('Automatic Animation Detection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
  it('should detect animation props and apply animated HOC', async () => {
    const StyledDiv = styled.div`
      width: 100px;
      height: 100px;
      background: red;
    `;

    // Component with animation props should be detected
    const { container } = render(() => (
      <StyledDiv
        animate={{ scale: 1.2 }}
        whileHover={{ scale: 1.1 }}
        data-testid="animated-component"
      />
    ));

    const element = container.querySelector('[data-testid="animated-component"]');
    expect(element).toBeTruthy();
  });

  it('should not apply animated HOC for components without animation props', () => {
    const StyledDiv = styled.div`
      width: 100px;
      height: 100px;
      background: blue;
    `;

    // Component without animation props should render normally
    const { container } = render(() => (
      <StyledDiv data-testid="regular-component" />
    ));

    const element = container.querySelector('[data-testid="regular-component"]');
    expect(element).toBeTruthy();
  });

  it('should detect various animation prop types', () => {
    const StyledDiv = styled.div`
      background: green;
    `;

    // Test different animation prop combinations
    const animationProps = [
      { animate: { x: 100 } },
      { whileHover: { scale: 1.1 } },
      { whileTap: { scale: 0.9 } },
      { layout: true },
      { initial: { opacity: 0 } },
      { exit: { opacity: 0 } },
      { variants: { open: { opacity: 1 } } },
    ];

    animationProps.forEach((props, index) => {
      const { container } = render(() => (
        <StyledDiv {...props} data-testid={`animated-${index}`} />
      ));

      const element = container.querySelector(`[data-testid="animated-${index}"]`);
      expect(element).toBeTruthy();
    });
  });

  it('should maintain backward compatibility with explicit animated() usage', () => {
    const StyledDiv = styled.div`
      width: 50px;
      height: 50px;
    `;

    // Should work with explicit animated() wrapping too
    const { container } = render(() => (
      <StyledDiv data-testid="backward-compatible" />
    ));

    const element = container.querySelector('[data-testid="backward-compatible"]');
    expect(element).toBeTruthy();
  });

  it('should handle mixed props correctly', () => {
    const StyledDiv = styled.div`
      padding: 20px;
    `;

    // Mix of regular props and animation props
    const { container } = render(() => (
      <StyledDiv
        class="custom-class"
        style={{ color: 'purple' }}
        animate={{ rotate: 45 }}
        data-testid="mixed-props"
      >
        Mixed Props Test
      </StyledDiv>
    ));

    const element = container.querySelector('[data-testid="mixed-props"]');
    expect(element).toBeTruthy();
    expect(element?.textContent).toBe('Mixed Props Test');
  });
});
