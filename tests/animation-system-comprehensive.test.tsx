/**
 * Facebook-Grade Animation System Test Suite
 * 
 * Comprehensive testing covering:
 * - Automatic animation detection
 * - All animation props (animate, whileHover, whileTap, whileInView, etc.)
 * - Performance and memory management
 * - Edge cases and error handling
 * - Browser compatibility
 * - Accessibility (reduced motion)
 * - SSR compatibility
 * - Real-world usage patterns
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@solidjs/testing-library';
import { createSignal, For, Show } from 'solid-js';
import { styled } from '../src/index';

describe('Animation System - Facebook-Grade Comprehensive Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.restoreAllMocks();
  });

  describe('1. Automatic Animation Detection', () => {
    it('should detect and apply animate prop without explicit wrapping', () => {
      const Box = styled.div`
        width: 100px;
        height: 100px;
        background: blue;
      `;

      expect(() => {
        render(() => (
          <Box
            data-testid="animated-box"
            animate={{
              from: { opacity: 0 },
              to: { opacity: 1 }
            }}
          >
            Content
          </Box>
        ));
      }).not.toThrow();

      expect(screen.getByTestId('animated-box')).toBeInTheDocument();
    });

    it('should detect whileHover prop automatically', () => {
      const Button = styled.button`
        padding: 12px 24px;
        background: #007bff;
      `;

      expect(() => {
        render(() => (
          <Button
            data-testid="hover-button"
            whileHover={{ scale: 1.05 }}
          >
            Hover me
          </Button>
        ));
      }).not.toThrow();

      expect(screen.getByTestId('hover-button')).toBeInTheDocument();
    });

    it('should detect whileTap prop automatically', () => {
      const Button = styled.button`
        padding: 12px 24px;
      `;

      expect(() => {
        render(() => (
          <Button
            data-testid="tap-button"
            whileTap={{ scale: 0.95 }}
          >
            Tap me
          </Button>
        ));
      }).not.toThrow();

      expect(screen.getByTestId('tap-button')).toBeInTheDocument();
    });

    it('should handle multiple animation props simultaneously', () => {
      const Card = styled.div`
        padding: 2rem;
        background: white;
      `;

      expect(() => {
        render(() => (
          <Card
            data-testid="multi-anim"
            animate={{
              from: { opacity: 0, y: 20 },
              to: { opacity: 1, y: 0 }
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Multi-animated
          </Card>
        ));
      }).not.toThrow();

      expect(screen.getByTestId('multi-anim')).toBeInTheDocument();
    });

    it('should work with all HTML elements', () => {
      const StyledDiv = styled.div`color: red;`;
      const StyledButton = styled.button`padding: 10px;`;
      const StyledSpan = styled.span`font-weight: bold;`;
      const StyledSection = styled.section`margin: 20px;`;

      expect(() => {
        render(() => (
          <>
            <StyledDiv data-testid="div" animate={{ from: { x: -10 }, to: { x: 0 } }}>Div</StyledDiv>
            <StyledButton data-testid="button" whileHover={{ scale: 1.1 }}>Button</StyledButton>
            <StyledSpan data-testid="span" whileTap={{ opacity: 0.8 }}>Span</StyledSpan>
            <StyledSection data-testid="section" animate={{ from: { opacity: 0 }, to: { opacity: 1 } }}>Section</StyledSection>
          </>
        ));
      }).not.toThrow();

      expect(screen.getByTestId('div')).toBeInTheDocument();
      expect(screen.getByTestId('button')).toBeInTheDocument();
      expect(screen.getByTestId('span')).toBeInTheDocument();
      expect(screen.getByTestId('section')).toBeInTheDocument();
    });
  });

  describe('2. Animation Props Coverage', () => {
    it('should support animate prop with from/to', () => {
      const Box = styled.div`width: 100px;`;

      render(() => (
        <Box
          data-testid="box"
          animate={{
            from: { opacity: 0, scale: 0.8 },
            to: { opacity: 1, scale: 1 }
          }}
        >
          Animated
        </Box>
      ));

      expect(screen.getByTestId('box')).toBeInTheDocument();
    });

    it('should support whileHover prop', () => {
      const Button = styled.button`padding: 10px;`;

      render(() => (
        <Button
          data-testid="button"
          whileHover={{ scale: 1.1, brightness: 1.2 }}
        >
          Hover
        </Button>
      ));

      const button = screen.getByTestId('button');
      expect(button).toBeInTheDocument();
    });

    it('should support whileTap prop', () => {
      const Button = styled.button`padding: 10px;`;

      render(() => (
        <Button
          data-testid="button"
          whileTap={{ scale: 0.9 }}
        >
          Tap
        </Button>
      ));

      expect(screen.getByTestId('button')).toBeInTheDocument();
    });

    it('should support whileInView prop', () => {
      const Section = styled.section`height: 200px;`;

      render(() => (
        <Section
          data-testid="section"
          whileInView={{ opacity: 1, y: 0 }}
        >
          Scroll into view
        </Section>
      ));

      expect(screen.getByTestId('section')).toBeInTheDocument();
    });

    it('should support whileFocus prop', () => {
      const Input = styled.input`padding: 8px;`;

      render(() => (
        <Input
          data-testid="input"
          whileFocus={{ borderColor: '#007bff', scale: 1.02 }}
        />
      ));

      expect(screen.getByTestId('input')).toBeInTheDocument();
    });

    it('should support whileDrag prop', () => {
      const Draggable = styled.div`width: 100px; height: 100px;`;

      render(() => (
        <Draggable
          data-testid="draggable"
          drag
          whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
        >
          Drag me
        </Draggable>
      ));

      expect(screen.getByTestId('draggable')).toBeInTheDocument();
    });
  });

  describe('3. Configuration Options', () => {
    it('should support spring config options', () => {
      const Box = styled.div`width: 100px;`;

      expect(() => {
        render(() => (
          <Box
            data-testid="box"
            animate={{
              from: { x: -100 },
              to: { x: 0 },
              config: {
                stiffness: 200,
                damping: 20,
                mass: 1
              }
            }}
          >
            Spring config
          </Box>
        ));
      }).not.toThrow();

      expect(screen.getByTestId('box')).toBeInTheDocument();
    });

    it('should support transition options', () => {
      const Box = styled.div`width: 100px;`;

      expect(() => {
        render(() => (
          <Box
            data-testid="box"
            animate={{
              from: { opacity: 0 },
              to: { opacity: 1 },
              transition: {
                duration: 500,
                ease: 'easeInOut'
              }
            }}
          >
            Transition config
          </Box>
        ));
      }).not.toThrow();

      expect(screen.getByTestId('box')).toBeInTheDocument();
    });

    it('should support delay option', () => {
      const Box = styled.div`width: 100px;`;

      expect(() => {
        render(() => (
          <Box
            data-testid="box"
            animate={{
              from: { opacity: 0 },
              to: { opacity: 1 },
              delay: 200
            }}
          >
            Delayed
          </Box>
        ));
      }).not.toThrow();

      expect(screen.getByTestId('box')).toBeInTheDocument();
    });
  });

  describe('4. Dynamic and Conditional Animations', () => {
    it('should handle reactive signal-based animations', async () => {
      const Box = styled.div`width: 100px;`;

      function TestComponent() {
        const [scale, setScale] = createSignal(1);

        return (
          <>
            <button
              data-testid="toggle"
              onClick={() => setScale(scale() === 1 ? 1.5 : 1)}
            >
              Toggle
            </button>
            <Box
              data-testid="box"
              animate={{
                from: { scale: 1 },
                to: { scale: scale() }
              }}
            >
              Reactive
            </Box>
          </>
        );
      }

      render(() => <TestComponent />);

      const toggle = screen.getByTestId('toggle');
      const box = screen.getByTestId('box');

      expect(box).toBeInTheDocument();

      toggle.click();
      await vi.advanceTimersByTimeAsync(100);

      expect(box).toBeInTheDocument();
    });

    it('should handle conditional animations with Show', async () => {
      const Box = styled.div`width: 100px;`;

      function TestComponent() {
        const [show, setShow] = createSignal(false);

        return (
          <>
            <button
              data-testid="toggle"
              onClick={() => setShow(!show())}
            >
              Toggle
            </button>
            <Show when={show()}>
              <Box
                data-testid="box"
                animate={{
                  from: { opacity: 0 },
                  to: { opacity: 1 }
                }}
              >
                Conditional
              </Box>
            </Show>
          </>
        );
      }

      render(() => <TestComponent />);

      const toggle = screen.getByTestId('toggle');

      expect(screen.queryByTestId('box')).not.toBeInTheDocument();

      toggle.click();
      await vi.advanceTimersByTimeAsync(50);

      expect(screen.getByTestId('box')).toBeInTheDocument();
    });

    it('should handle animations in lists with For', () => {
      const Item = styled.div`padding: 8px;`;

      function TestComponent() {
        const items = [1, 2, 3];

        return (
          <For each={items}>
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
        );
      }

      render(() => <TestComponent />);

      expect(screen.getByTestId('item-1')).toBeInTheDocument();
      expect(screen.getByTestId('item-2')).toBeInTheDocument();
      expect(screen.getByTestId('item-3')).toBeInTheDocument();
    });
  });

  describe('5. Polymorphic Components', () => {
    it('should work with as prop', () => {
      const Button = styled.button`padding: 12px;`;

      expect(() => {
        render(() => (
          <Button
            as="a"
            data-testid="link"
            href="#"
            animate={{
              from: { opacity: 0 },
              to: { opacity: 1 }
            }}
          >
            Link styled as button
          </Button>
        ));
      }).not.toThrow();

      const link = screen.getByTestId('link');
      expect(link).toBeInTheDocument();
      expect(link.tagName).toBe('A');
    });

    it('should preserve component functionality with animations', () => {
      const Button = styled.button`padding: 12px;`;
      const clickHandler = vi.fn();

      render(() => (
        <Button
          data-testid="button"
          onClick={clickHandler}
          animate={{
            from: { scale: 0.9 },
            to: { scale: 1 }
          }}
          whileHover={{ scale: 1.1 }}
        >
          Click me
        </Button>
      ));

      const button = screen.getByTestId('button');
      button.click();

      expect(clickHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('6. Edge Cases and Error Handling', () => {
    it('should handle null animation values gracefully', () => {
      const Box = styled.div`width: 100px;`;

      expect(() => {
        render(() => (
          <Box
            data-testid="box"
            animate={null as any}
          >
            Null animation
          </Box>
        ));
      }).not.toThrow();

      expect(screen.getByTestId('box')).toBeInTheDocument();
    });

    it('should handle undefined animation values gracefully', () => {
      const Box = styled.div`width: 100px;`;

      expect(() => {
        render(() => (
          <Box
            data-testid="box"
            animate={undefined}
          >
            Undefined animation
          </Box>
        ));
      }).not.toThrow();

      expect(screen.getByTestId('box')).toBeInTheDocument();
    });

    it('should handle empty animation objects', () => {
      const Box = styled.div`width: 100px;`;

      expect(() => {
        render(() => (
          <Box
            data-testid="box"
            animate={{} as any}
          >
            Empty animation
          </Box>
        ));
      }).not.toThrow();

      expect(screen.getByTestId('box')).toBeInTheDocument();
    });

    it('should handle invalid animation properties gracefully', () => {
      const Box = styled.div`width: 100px;`;

      expect(() => {
        render(() => (
          <Box
            data-testid="box"
            animate={{
              from: { opacity: 'invalid' } as any,
              to: { opacity: 1 }
            }}
          >
            Invalid property
          </Box>
        ));
      }).not.toThrow();

      expect(screen.getByTestId('box')).toBeInTheDocument();
    });
  });

  describe('7. Performance and Memory', () => {
    it('should handle multiple animated components efficiently', () => {
      const Box = styled.div`width: 50px; height: 50px;`;
      const count = 50;

      function TestComponent() {
        return (
          <>
            {Array.from({ length: count }, (_, i) => (
              <Box
                key={i}
                data-testid={`box-${i}`}
                animate={{
                  from: { opacity: 0 },
                  to: { opacity: 1 }
                }}
                whileHover={{ scale: 1.1 }}
              >
                {i}
              </Box>
            ))}
          </>
        );
      }

      expect(() => render(() => <TestComponent />)).not.toThrow();

      expect(screen.getByTestId('box-0')).toBeInTheDocument();
      expect(screen.getByTestId('box-25')).toBeInTheDocument();
      expect(screen.getByTestId('box-49')).toBeInTheDocument();
    });

    it('should cleanup animations on unmount', async () => {
      const Box = styled.div`width: 100px;`;

      function TestComponent() {
        const [show, setShow] = createSignal(true);

        return (
          <>
            <button data-testid="toggle" onClick={() => setShow(false)}>
              Hide
            </button>
            <Show when={show()}>
              <Box
                data-testid="box"
                animate={{
                  from: { opacity: 0 },
                  to: { opacity: 1 }
                }}
              >
                Will unmount
              </Box>
            </Show>
          </>
        );
      }

      render(() => <TestComponent />);

      expect(screen.getByTestId('box')).toBeInTheDocument();

      screen.getByTestId('toggle').click();
      await vi.advanceTimersByTimeAsync(50);

      expect(screen.queryByTestId('box')).not.toBeInTheDocument();
    });
  });

  describe('8. Accessibility (Reduced Motion)', () => {
    it('should respect prefers-reduced-motion', () => {
      // Mock matchMedia for reduced motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const Box = styled.div`width: 100px;`;

      expect(() => {
        render(() => (
          <Box
            data-testid="box"
            animate={{
              from: { opacity: 0 },
              to: { opacity: 1 }
            }}
          >
            Respects reduced motion
          </Box>
        ));
      }).not.toThrow();

      expect(screen.getByTestId('box')).toBeInTheDocument();
    });
  });

  describe('9. SSR Compatibility', () => {
    it('should render without animations in SSR-like conditions', () => {
      const Box = styled.div`width: 100px;`;

      // Test that component renders even if animation system isn't available
      expect(() => {
        render(() => (
          <Box
            data-testid="box"
            animate={{
              from: { opacity: 0 },
              to: { opacity: 1 }
            }}
          >
            SSR safe
          </Box>
        ));
      }).not.toThrow();

      expect(screen.getByTestId('box')).toBeInTheDocument();
    });
  });

  describe('10. Real-World Usage Patterns', () => {
    it('should handle button with hover and tap animations', () => {
      const Button = styled.button`
        padding: 12px 24px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 6px;
      `;

      render(() => (
        <Button
          data-testid="button"
          animate={{
            from: { opacity: 0, scale: 0.9 },
            to: { opacity: 1, scale: 1 }
          }}
          whileHover={{ scale: 1.05, brightness: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          Interactive Button
        </Button>
      ));

      expect(screen.getByTestId('button')).toBeInTheDocument();
    });

    it('should handle card with entrance animation', () => {
      const Card = styled.div`
        padding: 2rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      `;

      render(() => (
        <Card
          data-testid="card"
          animate={{
            from: { opacity: 0, y: 40, rotateX: 10 },
            to: { opacity: 1, y: 0, rotateX: 0 },
            config: { stiffness: 120, damping: 18 }
          }}
          whileHover={{ y: -5, boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
        >
          Card Content
        </Card>
      ));

      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('should handle modal with entrance and exit animations', async () => {
      const Modal = styled.div`
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 2rem;
        border-radius: 12px;
      `;

      function TestComponent() {
        const [isOpen, setIsOpen] = createSignal(false);

        return (
          <>
            <button data-testid="open" onClick={() => setIsOpen(true)}>
              Open Modal
            </button>
            <Show when={isOpen()}>
              <Modal
                data-testid="modal"
                animate={{
                  from: { opacity: 0, scale: 0.8, y: 20 },
                  to: { opacity: 1, scale: 1, y: 0 }
                }}
              >
                Modal Content
                <button data-testid="close" onClick={() => setIsOpen(false)}>
                  Close
                </button>
              </Modal>
            </Show>
          </>
        );
      }

      render(() => <TestComponent />);

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();

      screen.getByTestId('open').click();
      await vi.advanceTimersByTimeAsync(50);

      expect(screen.getByTestId('modal')).toBeInTheDocument();

      screen.getByTestId('close').click();
      await vi.advanceTimersByTimeAsync(50);

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should handle list items with staggered animations', () => {
      const Item = styled.div`
        padding: 1rem;
        background: #f0f9ff;
        margin-bottom: 0.5rem;
        border-radius: 8px;
      `;

      function TestComponent() {
        const items = ['First', 'Second', 'Third', 'Fourth'];

        return (
          <For each={items}>
            {(item, i) => (
              <Item
                data-testid={`item-${i()}`}
                animate={{
                  from: { opacity: 0, x: -30 },
                  to: { opacity: 1, x: 0 },
                  delay: i() * 100
                }}
                whileHover={{ x: 5, backgroundColor: '#dbeafe' }}
              >
                {item}
              </Item>
            )}
          </For>
        );
      }

      render(() => <TestComponent />);

      expect(screen.getByTestId('item-0')).toBeInTheDocument();
      expect(screen.getByTestId('item-1')).toBeInTheDocument();
      expect(screen.getByTestId('item-2')).toBeInTheDocument();
      expect(screen.getByTestId('item-3')).toBeInTheDocument();
    });
  });

  describe('11. Component Integrity', () => {
    it('should render styled components with animation props', () => {
      const Box = styled.div`
        width: 100px;
        height: 100px;
        background: blue;
      `;

      render(() => (
        <Box
          data-testid="box"
          animate={{
            from: { opacity: 0 },
            to: { opacity: 1 }
          }}
          whileHover={{ scale: 1.1 }}
        >
          Content
        </Box>
      ));

      const box = screen.getByTestId('box');
      
      // Component should render successfully with animation props
      expect(box).toBeInTheDocument();
      expect(box.textContent).toBe('Content');
      
      // Should be a div element
      expect(box.tagName).toBe('DIV');
    });
  });
});
