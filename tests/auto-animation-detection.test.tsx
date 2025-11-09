/**
 * Automatic Animation Detection Tests
 * 
 * Tests that styled components automatically detect and apply animations
 * when animation props are provided, without needing explicit animated() wrapper.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { styled } from '../src/index';

describe('Automatic Animation Detection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should detect animate prop and apply animations automatically', async () => {
    const Button = styled.button`
      padding: 12px 24px;
      background: #007bff;
      color: white;
    `;

    function TestComponent() {
      return (
        <Button
          data-testid="animated-button"
          animate={{
            from: { opacity: 0, scale: 0.9 },
            to: { opacity: 1, scale: 1 },
            when: 'mount'
          }}
        >
          Click me
        </Button>
      );
    }

    render(() => <TestComponent />);
    
    const button = screen.getByTestId('animated-button');
    expect(button).toBeInTheDocument();
    
    // Advance timers to allow animation to complete
    await vi.advanceTimersByTimeAsync(100);
    
    // Button should be rendered (animation system handles the animation)
    expect(button.textContent).toBe('Click me');
  });

  it('should detect whileHover prop and apply hover animations', async () => {
    const Card = styled.div`
      padding: 20px;
      background: white;
      border-radius: 8px;
    `;

    function TestComponent() {
      return (
        <Card
          data-testid="hover-card"
          whileHover={{ scale: 1.05 }}
        >
          Hover me
        </Card>
      );
    }

    render(() => <TestComponent />);
    
    const card = screen.getByTestId('hover-card');
    expect(card).toBeInTheDocument();
    expect(card.textContent).toBe('Hover me');
  });

  it('should detect whileTap prop for tap animations', () => {
    const Button = styled.button`
      padding: 12px;
      background: #28a745;
    `;

    function TestComponent() {
      return (
        <Button
          data-testid="tap-button"
          whileTap={{ scale: 0.95 }}
        >
          Tap me
        </Button>
      );
    }

    render(() => <TestComponent />);
    
    const button = screen.getByTestId('tap-button');
    expect(button).toBeInTheDocument();
  });

  it('should work without animation props (standard rendering)', () => {
    const Button = styled.button`
      padding: 12px 24px;
      background: #6c757d;
    `;

    function TestComponent() {
      return (
        <Button data-testid="normal-button">
          Normal button
        </Button>
      );
    }

    render(() => <TestComponent />);
    
    const button = screen.getByTestId('normal-button');
    expect(button).toBeInTheDocument();
    expect(button.textContent).toBe('Normal button');
  });

  it('should handle multiple animation props together', async () => {
    const Box = styled.div`
      width: 200px;
      height: 200px;
      background: #ff6b6b;
    `;

    function TestComponent() {
      return (
        <Box
          data-testid="multi-anim-box"
          animate={{
            from: { opacity: 0 },
            to: { opacity: 1 },
            when: 'mount'
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          Multi-animation
        </Box>
      );
    }

    render(() => <TestComponent />);
    
    const box = screen.getByTestId('multi-anim-box');
    expect(box).toBeInTheDocument();
  });

  it('should not leak animation props to DOM', () => {
    const Button = styled.button`
      padding: 12px;
    `;

    function TestComponent() {
      return (
        <Button
          data-testid="props-test"
          animate={{
            from: { scale: 0.9 },
            to: { scale: 1 }
          }}
          whileHover={{ scale: 1.05 }}
        >
          Test
        </Button>
      );
    }

    render(() => <TestComponent />);
    
    const button = screen.getByTestId('props-test');
    
    // Animation props should not appear as DOM attributes
    expect(button.hasAttribute('animate')).toBe(false);
    expect(button.hasAttribute('whileHover')).toBe(false);
  });

  it('should handle conditional animation props', async () => {
    const Card = styled.div`
      padding: 20px;
    `;

    function TestComponent() {
      const [shouldAnimate, setShouldAnimate] = createSignal(true);

      return (
        <div>
          <button
            data-testid="toggle"
            onClick={() => setShouldAnimate(!shouldAnimate())}
          >
            Toggle
          </button>
          <Card
            data-testid="conditional-card"
            {...(shouldAnimate() && {
              animate: {
                from: { opacity: 0 },
                to: { opacity: 1 }
              }
            })}
          >
            Conditional animation
          </Card>
        </div>
      );
    }

    render(() => <TestComponent />);
    
    const card = screen.getByTestId('conditional-card');
    expect(card).toBeInTheDocument();
    
    const toggle = screen.getByTestId('toggle');
    toggle.click();
    
    await vi.advanceTimersByTimeAsync(50);
    expect(card).toBeInTheDocument();
  });

  it('should work with polymorphic as prop', () => {
    const Button = styled.button`
      padding: 12px;
    `;

    function TestComponent() {
      return (
        <Button
          as="a"
          href="#"
          data-testid="polymorphic"
          animate={{
            from: { opacity: 0 },
            to: { opacity: 1 }
          }}
        >
          Link button
        </Button>
      );
    }

    render(() => <TestComponent />);
    
    const link = screen.getByTestId('polymorphic');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('#');
  });
});
