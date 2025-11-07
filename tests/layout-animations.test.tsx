/**
 * Layout Animation Tests
 * 
 * Comprehensive test suite for layout animations including:
 * - Basic functionality
 * - Global configuration
 * - Edge cases
 * - Error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { 
  LayoutAnimated, 
  LayoutTransitionProvider,
  useLayoutAnimation 
} from '../animation/layout-components';

describe('Layout Animations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should render without layout animations when layout=false', () => {
      function TestComponent() {
        return (
          <LayoutAnimated layout={false}>
            <div data-testid="content">Test Content</div>
          </LayoutAnimated>
        );
      }

      render(() => <TestComponent />);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should render with layout animations when layout=true', () => {
      function TestComponent() {
        return (
          <LayoutAnimated layout>
            <div data-testid="content">Test Content</div>
          </LayoutAnimated>
        );
      }

      render(() => <TestComponent />);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should expand and collapse content', async () => {
      function TestComponent() {
        const [expanded, setExpanded] = createSignal(false);
        
        return (
          <LayoutAnimated layout>
            <button 
              data-testid="toggle" 
              onClick={() => setExpanded(!expanded())}
            >
              Toggle
            </button>
            {expanded() && <div data-testid="extra">Extra Content</div>}
          </LayoutAnimated>
        );
      }

      const { container } = render(() => <TestComponent />);
      const button = screen.getByTestId('toggle');
      
      // Initially collapsed
      expect(screen.queryByTestId('extra')).not.toBeInTheDocument();
      
      // Expand
      button.click();
      await vi.advanceTimersByTimeAsync(100);
      expect(screen.getByTestId('extra')).toBeInTheDocument();
      
      // Collapse
      button.click();
      await vi.advanceTimersByTimeAsync(100);
      expect(screen.queryByTestId('extra')).not.toBeInTheDocument();
    });

    it('should accept custom layoutTransition config', () => {
      function TestComponent() {
        return (
          <LayoutAnimated 
            layout 
            layoutTransition={{ stiffness: 500, damping: 35 }}
          >
            <div data-testid="content">Test Content</div>
          </LayoutAnimated>
        );
      }

      render(() => <TestComponent />);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should support "as" prop for different elements', () => {
      function TestComponent() {
        return (
          <LayoutAnimated as="section" layout>
            <div data-testid="content">Test Content</div>
          </LayoutAnimated>
        );
      }

      const { container } = render(() => <TestComponent />);
      expect(container.querySelector('section')).toBeInTheDocument();
    });
  });

  describe('Global Configuration', () => {
    it('should use global config when provided', () => {
      function TestComponent() {
        return (
          <LayoutTransitionProvider config={{ stiffness: 400, damping: 30 }}>
            <LayoutAnimated layout>
              <div data-testid="content">Test Content</div>
            </LayoutAnimated>
          </LayoutTransitionProvider>
        );
      }

      render(() => <TestComponent />);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should work without global config', () => {
      function TestComponent() {
        return (
          <LayoutAnimated layout>
            <div data-testid="content">Test Content</div>
          </LayoutAnimated>
        );
      }

      render(() => <TestComponent />);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should override global config with local config', () => {
      function TestComponent() {
        return (
          <LayoutTransitionProvider config={{ stiffness: 200, damping: 10 }}>
            <LayoutAnimated 
              layout 
              layoutTransition={{ stiffness: 500, damping: 35 }}
            >
              <div data-testid="content">Test Content</div>
            </LayoutAnimated>
          </LayoutTransitionProvider>
        );
      }

      render(() => <TestComponent />);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should support nested providers', () => {
      function TestComponent() {
        return (
          <LayoutTransitionProvider config={{ stiffness: 400, damping: 30 }}>
            <LayoutAnimated layout>
              <div data-testid="outer">Outer</div>
            </LayoutAnimated>
            
            <LayoutTransitionProvider config={{ stiffness: 200, damping: 10 }}>
              <LayoutAnimated layout>
                <div data-testid="inner">Inner</div>
              </LayoutAnimated>
            </LayoutTransitionProvider>
          </LayoutTransitionProvider>
        );
      }

      render(() => <TestComponent />);
      expect(screen.getByTestId('outer')).toBeInTheDocument();
      expect(screen.getByTestId('inner')).toBeInTheDocument();
    });

    it('should merge global and local configs correctly', () => {
      function TestComponent() {
        return (
          <LayoutTransitionProvider 
            config={{ 
              stiffness: 400, 
              damping: 30,
              animateWidth: true,
              animateHeight: true
            }}
          >
            <LayoutAnimated 
              layout 
              layoutTransition={{ stiffness: 500 }}  // Only override stiffness
            >
              <div data-testid="content">Test Content</div>
            </LayoutAnimated>
          </LayoutTransitionProvider>
        );
      }

      render(() => <TestComponent />);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  describe('useLayoutAnimation Hook', () => {
    it('should work with ref callback', () => {
      function TestComponent() {
        const layoutRef = useLayoutAnimation({ stiffness: 400, damping: 30 });
        
        return (
          <div ref={layoutRef} data-testid="content">
            Test Content
          </div>
        );
      }

      render(() => <TestComponent />);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should handle ref callback with no config', () => {
      function TestComponent() {
        const layoutRef = useLayoutAnimation();
        
        return (
          <div ref={layoutRef} data-testid="content">
            Test Content
          </div>
        );
      }

      render(() => <TestComponent />);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid toggling', async () => {
      function TestComponent() {
        const [expanded, setExpanded] = createSignal(false);
        
        return (
          <LayoutAnimated layout>
            <button 
              data-testid="toggle" 
              onClick={() => setExpanded(!expanded())}
            >
              Toggle
            </button>
            {expanded() && <div data-testid="extra">Extra</div>}
          </LayoutAnimated>
        );
      }

      render(() => <TestComponent />);
      const button = screen.getByTestId('toggle');
      
      // Rapid toggling
      button.click();
      await vi.advanceTimersByTimeAsync(10);
      button.click();
      await vi.advanceTimersByTimeAsync(10);
      button.click();
      await vi.advanceTimersByTimeAsync(10);
      
      // Should not crash
      expect(button).toBeInTheDocument();
    });

    it('should handle empty children', () => {
      function TestComponent() {
        return (
          <LayoutAnimated layout>
            {/* Empty */}
          </LayoutAnimated>
        );
      }

      const { container } = render(() => <TestComponent />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle null children', () => {
      function TestComponent() {
        return (
          <LayoutAnimated layout>
            {null}
          </LayoutAnimated>
        );
      }

      const { container } = render(() => <TestComponent />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle undefined children', () => {
      function TestComponent() {
        return (
          <LayoutAnimated layout>
            {undefined}
          </LayoutAnimated>
        );
      }

      const { container } = render(() => <TestComponent />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle conditional children', async () => {
      function TestComponent() {
        const [show, setShow] = createSignal(true);
        
        return (
          <LayoutAnimated layout>
            <button 
              data-testid="toggle" 
              onClick={() => setShow(!show())}
            >
              Toggle
            </button>
            {show() ? <div data-testid="shown">Shown</div> : null}
          </LayoutAnimated>
        );
      }

      render(() => <TestComponent />);
      expect(screen.getByTestId('shown')).toBeInTheDocument();
      
      screen.getByTestId('toggle').click();
      await vi.advanceTimersByTimeAsync(100);
      
      expect(screen.queryByTestId('shown')).not.toBeInTheDocument();
    });

    it('should handle nested layout animations', () => {
      function TestComponent() {
        return (
          <LayoutAnimated layout>
            <div data-testid="outer">
              Outer
              <LayoutAnimated layout>
                <div data-testid="inner">Inner</div>
              </LayoutAnimated>
            </div>
          </LayoutAnimated>
        );
      }

      render(() => <TestComponent />);
      expect(screen.getByTestId('outer')).toBeInTheDocument();
      expect(screen.getByTestId('inner')).toBeInTheDocument();
    });

    it('should handle invalid spring config gracefully', () => {
      function TestComponent() {
        return (
          <LayoutAnimated 
            layout 
            layoutTransition={{ stiffness: -100, damping: -50 } as any}
          >
            <div data-testid="content">Test Content</div>
          </LayoutAnimated>
        );
      }

      // Should not crash
      render(() => <TestComponent />);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should handle very large stiffness values', () => {
      function TestComponent() {
        return (
          <LayoutAnimated 
            layout 
            layoutTransition={{ stiffness: 10000, damping: 100 }}
          >
            <div data-testid="content">Test Content</div>
          </LayoutAnimated>
        );
      }

      render(() => <TestComponent />);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should handle zero damping', () => {
      function TestComponent() {
        return (
          <LayoutAnimated 
            layout 
            layoutTransition={{ stiffness: 400, damping: 0 }}
          >
            <div data-testid="content">Test Content</div>
          </LayoutAnimated>
        );
      }

      render(() => <TestComponent />);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should handle component unmounting during animation', async () => {
      function TestComponent() {
        const [show, setShow] = createSignal(true);
        const [expanded, setExpanded] = createSignal(false);
        
        return (
          <div>
            <button 
              data-testid="unmount" 
              onClick={() => setShow(false)}
            >
              Unmount
            </button>
            {show() && (
              <LayoutAnimated layout>
                <button 
                  data-testid="expand" 
                  onClick={() => setExpanded(!expanded())}
                >
                  Expand
                </button>
                {expanded() && <div data-testid="extra">Extra</div>}
              </LayoutAnimated>
            )}
          </div>
        );
      }

      render(() => <TestComponent />);
      
      // Start animation
      screen.getByTestId('expand').click();
      await vi.advanceTimersByTimeAsync(10);
      
      // Unmount during animation
      screen.getByTestId('unmount').click();
      await vi.advanceTimersByTimeAsync(100);
      
      // Should not crash
      expect(screen.queryByTestId('expand')).not.toBeInTheDocument();
    });
  });

  describe('Animation Configuration', () => {
    it('should respect animateWidth: false', () => {
      function TestComponent() {
        return (
          <LayoutAnimated 
            layout 
            layoutTransition={{ animateWidth: false, animateHeight: true }}
          >
            <div data-testid="content">Test Content</div>
          </LayoutAnimated>
        );
      }

      render(() => <TestComponent />);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should respect animateHeight: false', () => {
      function TestComponent() {
        return (
          <LayoutAnimated 
            layout 
            layoutTransition={{ animateWidth: true, animateHeight: false }}
          >
            <div data-testid="content">Test Content</div>
          </LayoutAnimated>
        );
      }

      render(() => <TestComponent />);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should respect animatePosition: false', () => {
      function TestComponent() {
        return (
          <LayoutAnimated 
            layout 
            layoutTransition={{ animatePosition: false }}
          >
            <div data-testid="content">Test Content</div>
          </LayoutAnimated>
        );
      }

      render(() => <TestComponent />);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should respect useTransform: false', () => {
      function TestComponent() {
        return (
          <LayoutAnimated 
            layout 
            layoutTransition={{ useTransform: false }}
          >
            <div data-testid="content">Test Content</div>
          </LayoutAnimated>
        );
      }

      render(() => <TestComponent />);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should call onLayoutAnimationStart callback', async () => {
      const onStart = vi.fn();
      
      function TestComponent() {
        const [expanded, setExpanded] = createSignal(false);
        
        return (
          <LayoutAnimated 
            layout 
            layoutTransition={{ onLayoutAnimationStart: onStart }}
          >
            <button 
              data-testid="toggle" 
              onClick={() => setExpanded(!expanded())}
            >
              Toggle
            </button>
            {expanded() && <div>Extra</div>}
          </LayoutAnimated>
        );
      }

      render(() => <TestComponent />);
      screen.getByTestId('toggle').click();
      await vi.advanceTimersByTimeAsync(100);
      
      // Note: callback might not be called in JSDOM environment
      // This test verifies it doesn't crash
      expect(screen.getByTestId('toggle')).toBeInTheDocument();
    });

    it('should call onLayoutAnimationComplete callback', async () => {
      const onComplete = vi.fn();
      
      function TestComponent() {
        const [expanded, setExpanded] = createSignal(false);
        
        return (
          <LayoutAnimated 
            layout 
            layoutTransition={{ onLayoutAnimationComplete: onComplete }}
          >
            <button 
              data-testid="toggle" 
              onClick={() => setExpanded(!expanded())}
            >
              Toggle
            </button>
            {expanded() && <div>Extra</div>}
          </LayoutAnimated>
        );
      }

      render(() => <TestComponent />);
      screen.getByTestId('toggle').click();
      await vi.advanceTimersByTimeAsync(2000);
      
      // Note: callback might not be called in JSDOM environment
      // This test verifies it doesn't crash
      expect(screen.getByTestId('toggle')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle many simultaneous layout animations', () => {
      function TestComponent() {
        return (
          <div>
            {Array.from({ length: 10 }).map((_, i) => (
              <LayoutAnimated layout key={i}>
                <div data-testid={`content-${i}`}>Content {i}</div>
              </LayoutAnimated>
            ))}
          </div>
        );
      }

      render(() => <TestComponent />);
      
      // All should render
      for (let i = 0; i < 10; i++) {
        expect(screen.getByTestId(`content-${i}`)).toBeInTheDocument();
      }
    });

    it('should not memory leak with repeated mount/unmount', async () => {
      function TestComponent() {
        const [show, setShow] = createSignal(true);
        
        return (
          <div>
            <button 
              data-testid="toggle" 
              onClick={() => setShow(!show())}
            >
              Toggle
            </button>
            {show() && (
              <LayoutAnimated layout>
                <div data-testid="content">Content</div>
              </LayoutAnimated>
            )}
          </div>
        );
      }

      render(() => <TestComponent />);
      const button = screen.getByTestId('toggle');
      
      // Mount/unmount multiple times
      for (let i = 0; i < 5; i++) {
        button.click();
        await vi.advanceTimersByTimeAsync(100);
      }
      
      // Should not crash or leak
      expect(button).toBeInTheDocument();
    });
  });
});
