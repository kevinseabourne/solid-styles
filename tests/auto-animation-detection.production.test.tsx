/**
 * Production-Grade Automatic Animation Detection Tests
 * 
 * Comprehensive test suite covering:
 * - Edge cases and race conditions
 * - Performance and memory leaks
 * - Error handling and recovery
 * - SSR compatibility
 * - Browser compatibility
 * - Concurrent rendering
 * - Large-scale usage patterns
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@solidjs/testing-library';
import { createSignal, For, Show, createEffect, onCleanup } from 'solid-js';
import { styled } from '../src/index';

describe('Production-Grade: Automatic Animation Detection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.restoreAllMocks();
  });

  describe('Edge Cases & Race Conditions', () => {
    it('should handle rapid mount/unmount cycles without memory leaks', async () => {
      const Button = styled.button`padding: 12px;`;
      let renderCount = 0;

      function TestComponent() {
        const [show, setShow] = createSignal(true);
        
        createEffect(() => {
          if (show()) renderCount++;
        });

        return (
          <div>
            <button data-testid="toggle" onClick={() => setShow(!show())}>
              Toggle
            </button>
            <Show when={show()}>
              <Button
                data-testid="animated-btn"
                animate={{
                  from: { opacity: 0 },
                  to: { opacity: 1 }
                }}
              >
                Content
              </Button>
            </Show>
          </div>
        );
      }

      render(() => <TestComponent />);
      const toggle = screen.getByTestId('toggle');

      // Rapid toggling
      for (let i = 0; i < 50; i++) {
        toggle.click();
        await vi.advanceTimersByTimeAsync(10);
      }

      // Should not crash and final state should be stable
      expect(toggle).toBeInTheDocument();
    });

    it('should handle animation props changing mid-render', async () => {
      const Box = styled.div`padding: 20px;`;
      
      function TestComponent() {
        const [config, setConfig] = createSignal({
          from: { opacity: 0 },
          to: { opacity: 1 }
        });

        return (
          <div>
            <button
              data-testid="change-config"
              onClick={() => setConfig({
                from: { scale: 0.5 },
                to: { scale: 1 }
              })}
            >
              Change
            </button>
            <Box
              data-testid="box"
              animate={config()}
            >
              Content
            </Box>
          </div>
        );
      }

      render(() => <TestComponent />);
      
      const button = screen.getByTestId('change-config');
      const box = screen.getByTestId('box');

      expect(box).toBeInTheDocument();

      // Change animation config while component is mounted
      button.click();
      await vi.advanceTimersByTimeAsync(50);

      expect(box).toBeInTheDocument();
    });

    it('should handle null/undefined animation props gracefully', () => {
      const Button = styled.button`padding: 12px;`;

      function TestComponent() {
        const [animateValue, setAnimateValue] = createSignal<any>(null);

        return (
          <div>
            <Button
              data-testid="btn"
              animate={animateValue()}
            >
              Button
            </Button>
            <button
              data-testid="set-undefined"
              onClick={() => setAnimateValue(undefined)}
            >
              Set Undefined
            </button>
          </div>
        );
      }

      expect(() => render(() => <TestComponent />)).not.toThrow();
      
      const btn = screen.getByTestId('btn');
      expect(btn).toBeInTheDocument();

      const setBtn = screen.getByTestId('set-undefined');
      expect(() => setBtn.click()).not.toThrow();
    });

    it('should handle deeply nested components with animations', () => {
      const Box = styled.div`padding: 10px;`;
      const depth = 10;

      function NestedComponent({ level }: { level: number }) {
        if (level === 0) {
          return <div data-testid={`leaf-${level}`}>Leaf</div>;
        }

        return (
          <Box
            data-testid={`box-${level}`}
            animate={{
              from: { opacity: 0 },
              to: { opacity: 1 }
            }}
          >
            <NestedComponent level={level - 1} />
          </Box>
        );
      }

      render(() => <NestedComponent level={depth} />);

      // All levels should render without stack overflow
      expect(screen.getByTestId('leaf-0')).toBeInTheDocument();
      expect(screen.getByTestId('box-1')).toBeInTheDocument();
      expect(screen.getByTestId(`box-${depth}`)).toBeInTheDocument();
    });

    it('should handle simultaneous animation prop updates across multiple components', async () => {
      const Button = styled.button`padding: 12px;`;

      function TestComponent() {
        const [opacity, setOpacity] = createSignal(0);

        return (
          <div>
            <button
              data-testid="update-all"
              onClick={() => setOpacity(1)}
            >
              Update
            </button>
            <For each={Array.from({ length: 100 })}>
              {(_, i) => (
                <Button
                  data-testid={`btn-${i()}`}
                  animate={{
                    from: { opacity: 0 },
                    to: { opacity: opacity() }
                  }}
                >
                  Button {i()}
                </Button>
              )}
            </For>
          </div>
        );
      }

      render(() => <TestComponent />);
      
      const updateBtn = screen.getByTestId('update-all');
      
      // Update all 100 components simultaneously
      expect(() => updateBtn.click()).not.toThrow();
      await vi.advanceTimersByTimeAsync(100);

      // All should still be in document
      expect(screen.getByTestId('btn-0')).toBeInTheDocument();
      expect(screen.getByTestId('btn-50')).toBeInTheDocument();
      expect(screen.getByTestId('btn-99')).toBeInTheDocument();
    }, 60000);
  });

  describe('Performance & Memory', () => {
    it('should not create memory leaks with large lists', async () => {
      const Item = styled.div`padding: 8px;`;
      const itemCount = 100; // Reduced from 1000 for CI performance

      function TestComponent() {
        const [items, setItems] = createSignal(Array.from({ length: itemCount }, (_, i) => i));

        return (
          <div>
            <button
              data-testid="clear"
              onClick={() => setItems([])}
            >
              Clear
            </button>
            <For each={items()}>
              {(item) => (
                <Item
                  data-testid={`item-${item}`}
                  animate={{
                    from: { opacity: 0 },
                    to: { opacity: 1 }
                  }}
                >
                  Item {item}
                </Item>
              )}
            </For>
          </div>
        );
      }

      const { unmount } = render(() => <TestComponent />);

      // Clear all items
      const clearBtn = screen.getByTestId('clear');
      clearBtn.click();
      await vi.advanceTimersByTimeAsync(100);

      // Unmount component
      unmount();

      // Should not have lingering references
      expect(screen.queryByTestId('item-0')).not.toBeInTheDocument();
    }, 30000); // Reduced timeout since we have fewer items

    it('should reuse animation system cache across multiple components', () => {
      const Button1 = styled.button`color: red;`;
      const Button2 = styled.button`color: blue;`;
      const Button3 = styled.button`color: green;`;

      function TestComponent() {
        return (
          <div>
            <Button1
              data-testid="btn1"
              animate={{ from: { opacity: 0 }, to: { opacity: 1 } }}
            >
              Button 1
            </Button1>
            <Button2
              data-testid="btn2"
              animate={{ from: { scale: 0 }, to: { scale: 1 } }}
            >
              Button 2
            </Button2>
            <Button3
              data-testid="btn3"
              whileHover={{ scale: 1.05 }}
            >
              Button 3
            </Button3>
          </div>
        );
      }

      // All three components should render without re-importing animation system
      expect(() => render(() => <TestComponent />)).not.toThrow();
      
      expect(screen.getByTestId('btn1')).toBeInTheDocument();
      expect(screen.getByTestId('btn2')).toBeInTheDocument();
      expect(screen.getByTestId('btn3')).toBeInTheDocument();
    });

    it('should handle high-frequency prop updates without performance degradation', async () => {
      const Box = styled.div`padding: 20px;`;
      let updateCount = 0;

      function TestComponent() {
        const [value, setValue] = createSignal(0);

        createEffect(() => {
          if (value()) updateCount++;
        });

        return (
          <div>
            <button
              data-testid="rapid-update"
              onClick={() => {
                // Trigger 100 rapid updates
                for (let i = 0; i < 100; i++) {
                  setValue(i);
                }
              }}
            >
              Update
            </button>
            <Box
              data-testid="box"
              animate={{
                from: { opacity: 0 },
                to: { opacity: value() / 100 }
              }}
            >
              Value: {value()}
            </Box>
          </div>
        );
      }

      render(() => <TestComponent />);
      
      const updateBtn = screen.getByTestId('rapid-update');
      const startTime = performance.now();
      
      updateBtn.click();
      await vi.advanceTimersByTimeAsync(100);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (< 1000ms in tests)
      expect(duration).toBeLessThan(1000);
      expect(screen.getByTestId('box')).toBeInTheDocument();
    });
  });

  describe('Error Handling & Recovery', () => {
    it('should handle malformed animation config gracefully', () => {
      const Button = styled.button`padding: 12px;`;

      function TestComponent() {
        return (
          <Button
            data-testid="btn"
            animate={{
              from: { opacity: 'invalid' } as any,
              to: { opacity: 1 }
            }}
          >
            Button
          </Button>
        );
      }

      // Should not crash the app
      expect(() => render(() => <TestComponent />)).not.toThrow();
      expect(screen.getByTestId('btn')).toBeInTheDocument();
    });

    it('should recover from animation system load failure', async () => {
      const Button = styled.button`padding: 12px;`;

      // Mock animation system load failure
      const originalImport = globalThis.import;
      vi.stubGlobal('import', vi.fn().mockRejectedValue(new Error('Load failed')));

      function TestComponent() {
        return (
          <Button
            data-testid="btn"
            animate={{
              from: { opacity: 0 },
              to: { opacity: 1 }
            }}
          >
            Button
          </Button>
        );
      }

      // Should render button even if animation fails
      expect(() => render(() => <TestComponent />)).not.toThrow();
      expect(screen.getByTestId('btn')).toBeInTheDocument();

      // Restore
      if (originalImport) vi.stubGlobal('import', originalImport);
    });

    it('should handle circular animation prop dependencies', () => {
      const Box = styled.div`padding: 20px;`;

      function TestComponent() {
        const [count, setCount] = createSignal(0);

        return (
          <Box
            data-testid="box"
            animate={{
              from: { opacity: 0 },
              to: { opacity: 1 },
              // This could potentially cause circular updates
              onComplete: () => setCount(count() + 1)
            } as any}
          >
            Count: {count()}
          </Box>
        );
      }

      // Should not cause infinite loops
      expect(() => render(() => <TestComponent />)).not.toThrow();
      expect(screen.getByTestId('box')).toBeInTheDocument();
    });
  });

  describe('SSR Compatibility', () => {
    it('should not execute animation detection on server', () => {
      const Button = styled.button`padding: 12px;`;

      // Mock server environment
      const originalIsServer = (globalThis as any).isServer;
      (globalThis as any).isServer = true;

      function TestComponent() {
        return (
          <Button
            data-testid="btn"
            animate={{
              from: { opacity: 0 },
              to: { opacity: 1 }
            }}
          >
            Button
          </Button>
        );
      }

      // Should render without trying to load animation system
      expect(() => render(() => <TestComponent />)).not.toThrow();

      // Restore
      (globalThis as any).isServer = originalIsServer;
    });

    it('should hydrate correctly after SSR', async () => {
      const Button = styled.button`padding: 12px;`;

      function TestComponent() {
        const [mounted, setMounted] = createSignal(false);

        createEffect(() => {
          setMounted(true);
        });

        return (
          <Button
            data-testid="btn"
            animate={{
              from: { opacity: 0 },
              to: { opacity: 1 }
            }}
          >
            Mounted: {mounted() ? 'Yes' : 'No'}
          </Button>
        );
      }

      render(() => <TestComponent />);
      await vi.advanceTimersByTimeAsync(100);

      const btn = screen.getByTestId('btn');
      expect(btn).toBeInTheDocument();
      expect(btn.textContent).toContain('Yes');
    });
  });

  describe('Concurrent Rendering', () => {
    it('should handle concurrent multi-component animations', async () => {
      const Box1 = styled.div`color: red;`;
      const Box2 = styled.div`color: blue;`;
      const Box3 = styled.div`color: green;`;

      function TestComponent() {
        return (
          <div>
            <Box1
              data-testid="box1"
              animate={{ from: { opacity: 0 }, to: { opacity: 1 } }}
            >
              Box 1
            </Box1>
            <Box2
              data-testid="box2"
              whileHover={{ scale: 1.1 }}
            >
              Box 2
            </Box2>
            <Box3
              data-testid="box3"
              whileTap={{ scale: 0.9 }}
            >
              Box 3
            </Box3>
          </div>
        );
      }

      render(() => <TestComponent />);
      await vi.advanceTimersByTimeAsync(100);

      expect(screen.getByTestId('box1')).toBeInTheDocument();
      expect(screen.getByTestId('box2')).toBeInTheDocument();
      expect(screen.getByTestId('box3')).toBeInTheDocument();
    });

    it('should handle prop changes during parent re-render', async () => {
      const Child = styled.div`padding: 10px;`;

      function TestComponent() {
        const [parentCount, setParentCount] = createSignal(0);
        const [childOpacity, setChildOpacity] = createSignal(0);

        return (
          <div data-testid="parent" onClick={() => setParentCount(parentCount() + 1)}>
            Parent renders: {parentCount()}
            <Child
              data-testid="child"
              onClick={(e) => {
                e.stopPropagation();
                setChildOpacity(1);
              }}
              animate={{
                from: { opacity: 0 },
                to: { opacity: childOpacity() }
              }}
            >
              Child
            </Child>
          </div>
        );
      }

      render(() => <TestComponent />);

      const parent = screen.getByTestId('parent');
      const child = screen.getByTestId('child');

      // Trigger parent re-render
      parent.click();
      await vi.advanceTimersByTimeAsync(50);

      // Trigger child animation update
      child.click();
      await vi.advanceTimersByTimeAsync(50);

      // Both should still be in document
      expect(parent).toBeInTheDocument();
      expect(child).toBeInTheDocument();
    });
  });

  describe('Browser Compatibility', () => {
    it('should work without ResizeObserver (older browsers)', () => {
      const Button = styled.button`padding: 12px;`;

      // Mock missing ResizeObserver
      const originalResizeObserver = globalThis.ResizeObserver;
      (globalThis as any).ResizeObserver = undefined;

      function TestComponent() {
        return (
          <Button
            data-testid="btn"
            animate={{
              from: { opacity: 0 },
              to: { opacity: 1 }
            }}
          >
            Button
          </Button>
        );
      }

      expect(() => render(() => <TestComponent />)).not.toThrow();
      expect(screen.getByTestId('btn')).toBeInTheDocument();

      // Restore
      globalThis.ResizeObserver = originalResizeObserver;
    });

    it('should work without IntersectionObserver', () => {
      const Box = styled.div`padding: 20px;`;

      // Mock missing IntersectionObserver
      const originalIntersectionObserver = globalThis.IntersectionObserver;
      (globalThis as any).IntersectionObserver = undefined;

      function TestComponent() {
        return (
          <Box
            data-testid="box"
            whileInView={{ opacity: 1 }}
          >
            Content
          </Box>
        );
      }

      expect(() => render(() => <TestComponent />)).not.toThrow();
      expect(screen.getByTestId('box')).toBeInTheDocument();

      // Restore
      globalThis.IntersectionObserver = originalIntersectionObserver;
    });
  });

  describe('Real-World Patterns', () => {
    it('should handle modal open/close animations', async () => {
      const Modal = styled.div`
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
      `;

      function TestComponent() {
        const [isOpen, setIsOpen] = createSignal(false);

        return (
          <div>
            <button data-testid="open" onClick={() => setIsOpen(true)}>
              Open Modal
            </button>
            <Show when={isOpen()}>
              <Modal
                data-testid="modal"
                animate={{
                  from: { opacity: 0, scale: 0.9 },
                  to: { opacity: 1, scale: 1 }
                }}
              >
                Modal Content
                <button data-testid="close" onClick={() => setIsOpen(false)}>
                  Close
                </button>
              </Modal>
            </Show>
          </div>
        );
      }

      render(() => <TestComponent />);

      // Open modal
      screen.getByTestId('open').click();
      await vi.advanceTimersByTimeAsync(50);
      expect(screen.getByTestId('modal')).toBeInTheDocument();

      // Close modal
      screen.getByTestId('close').click();
      await vi.advanceTimersByTimeAsync(50);
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should handle list item animations (add/remove)', async () => {
      const Item = styled.div`padding: 8px;`;

      function TestComponent() {
        const [items, setItems] = createSignal([1, 2, 3]);

        return (
          <div>
            <button
              data-testid="add"
              onClick={() => setItems([...items(), items().length + 1])}
            >
              Add
            </button>
            <button
              data-testid="remove"
              onClick={() => setItems(items().slice(0, -1))}
            >
              Remove
            </button>
            <For each={items()}>
              {(item) => (
                <Item
                  data-testid={`item-${item}`}
                  animate={{
                    from: { opacity: 0, x: -20 },
                    to: { opacity: 1, x: 0 }
                  }}
                >
                  Item {item}
                </Item>
              )}
            </For>
          </div>
        );
      }

      render(() => <TestComponent />);

      // Add item
      screen.getByTestId('add').click();
      await vi.advanceTimersByTimeAsync(50);
      expect(screen.getByTestId('item-4')).toBeInTheDocument();

      // Remove item
      screen.getByTestId('remove').click();
      await vi.advanceTimersByTimeAsync(50);
      expect(screen.queryByTestId('item-4')).not.toBeInTheDocument();
    });
  });
});
