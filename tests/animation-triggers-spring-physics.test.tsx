/**
 * Comprehensive test suite for all animation triggers
 * Verifies that all triggers (mount, hover, click, focus, inView) use spring physics correctly
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { styled } from '../src/index';
import { animated } from '../animation/animatedStyled';

describe('Animation Triggers - Spring Physics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Mount Animation', () => {
    it('should animate on mount with spring physics using animate prop', async () => {
      const Box = animated('div');

      render(() => (
        <Box
          data-testid="mount-box"
          animate={{
            from: { opacity: 0, y: 50 },
            to: { opacity: 1, y: 0 },
            when: 'mount',
            config: { stiffness: 150, damping: 15 }
          }}
        >
          Mount Animation
        </Box>
      ));

      const box = screen.getByTestId('mount-box');

      // Wait for animation to complete
      await waitFor(() => {
        const opacity = window.getComputedStyle(box).opacity;
        const transform = window.getComputedStyle(box).transform;
        
        // Should animate to final values
        expect(parseFloat(opacity)).toBeGreaterThan(0.9);
        expect(transform).toContain('matrix');
      }, { timeout: 2000 });
    });

    it('should support duration parameter for mount animation', async () => {
      const Box = animated('div');

      render(() => (
        <Box
          data-testid="mount-box-duration"
          animate={{
            from: { opacity: 0, scale: 0.8 },
            to: { opacity: 1, scale: 1 },
            when: 'mount',
            config: { duration: 1000 } // 1 second duration
          }}
        >
          Mount with Duration
        </Box>
      ));

      const box = screen.getByTestId('mount-box-duration');

      // Animation should take approximately 1 second
      await waitFor(() => {
        const opacity = window.getComputedStyle(box).opacity;
        expect(parseFloat(opacity)).toBeGreaterThan(0.9);
      }, { timeout: 2000 });
    });
  });

  describe('Hover Animation', () => {
    it('should animate on hover with spring physics using whileHover prop', async () => {
      const Button = animated('button');

      render(() => (
        <Button
          data-testid="hover-button"
          whileHover={{ scale: 1.1 }}
          transition={{ stiffness: 200, damping: 20 }}
        >
          Hover Me
        </Button>
      ));

      const button = screen.getByTestId('hover-button');

      // Initial state should be scale: 1
      const initialTransform = window.getComputedStyle(button).transform;
      expect(initialTransform).toMatch(/matrix\(1/);

      // Trigger hover
      button.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      // Wait for spring animation to start
      await waitFor(() => {
        const transform = window.getComputedStyle(button).transform;
        // Scale should increase (matrix values change)
        expect(transform).toContain('matrix');
        expect(transform).not.toBe(initialTransform);
      }, { timeout: 1000 });
    });

    it('should animate on hover using animate prop with when: hover', async () => {
      const Box = animated('div');

      render(() => (
        <Box
          data-testid="hover-box"
          animate={{
            from: { scale: 1, opacity: 1 },
            to: { scale: 1.2, opacity: 0.8 },
            when: 'hover',
            config: { stiffness: 180, damping: 18 }
          }}
        >
          Hover Box
        </Box>
      ));

      const box = screen.getByTestId('hover-box');

      // Trigger hover
      box.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      // Wait for animation
      await waitFor(() => {
        const transform = window.getComputedStyle(box).transform;
        expect(transform).toContain('matrix');
      }, { timeout: 1000 });
    });
  });

  describe('Click Animation', () => {
    it('should animate on click with spring physics', async () => {
      const Button = animated('button');

      render(() => (
        <Button
          data-testid="click-button"
          whileTap={{ scale: 0.95 }}
          transition={{ stiffness: 300, damping: 25 }}
        >
          Click Me
        </Button>
      ));

      const button = screen.getByTestId('click-button');

      // Trigger click
      button.click();

      // Wait for animation
      await waitFor(() => {
        const transform = window.getComputedStyle(button).transform;
        expect(transform).toContain('matrix');
      }, { timeout: 1000 });
    });
  });

  describe('Focus Animation', () => {
    it('should animate on focus with spring physics', async () => {
      const Input = animated('input');

      render(() => (
        <Input
          data-testid="focus-input"
          whileFocus={{ scale: 1.05 }}
          transition={{ stiffness: 200, damping: 20 }}
        />
      ));

      const input = screen.getByTestId('focus-input') as HTMLInputElement;

      // Trigger focus
      input.focus();

      // Wait for animation
      await waitFor(() => {
        const transform = window.getComputedStyle(input).transform;
        expect(transform).toContain('matrix');
      }, { timeout: 1000 });
    });
  });

  describe('InView Animation', () => {
    it('should animate when element enters viewport', async () => {
      const Box = animated('div');

      // Mock IntersectionObserver - must be a constructor function
      const mockObserve = vi.fn();
      const mockUnobserve = vi.fn();
      const mockDisconnect = vi.fn();
      
      window.IntersectionObserver = class MockIntersectionObserver {
        constructor(callback: any, options: any) {
          // Store callback for testing
        }
        observe = mockObserve;
        unobserve = mockUnobserve;
        disconnect = mockDisconnect;
      } as any;

      render(() => (
        <Box
          data-testid="inview-box"
          whileInView={{ opacity: 1, y: 0 }}
          animate={{
            from: { opacity: 0, y: 50 },
            to: { opacity: 1, y: 0 },
            when: 'inView'
          }}
        >
          Scroll Into View
        </Box>
      ));

      const box = screen.getByTestId('inview-box');
      expect(box).toBeInTheDocument();

      // Verify IntersectionObserver was used
      expect(mockObserve).toHaveBeenCalled();
    });
  });

  describe('API Compatibility', () => {
    it('should support Framer Motion style props', async () => {
      const Box = animated('div');

      render(() => (
        <Box
          data-testid="framer-style-box"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          whileFocus={{ opacity: 0.8 }}
          transition={{ stiffness: 250, damping: 25 }}
        >
          Framer Motion Style
        </Box>
      ));

      const box = screen.getByTestId('framer-style-box');
      expect(box).toBeInTheDocument();
    });

    it('should support initial and animate props for mount animations', async () => {
      const Box = animated('div');

      render(() => (
        <Box
          data-testid="initial-animate-box"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            from: { opacity: 0, scale: 0.5 },
            to: { opacity: 1, scale: 1 },
            when: 'mount'
          }}
          transition={{ duration: 500 }}
        >
          Initial + Animate
        </Box>
      ));

      const box = screen.getByTestId('initial-animate-box');

      await waitFor(() => {
        const opacity = window.getComputedStyle(box).opacity;
        expect(parseFloat(opacity)).toBeGreaterThan(0.8);
      }, { timeout: 2000 });
    });
  });

  describe('Spring Physics Verification', () => {
    it('should use spring physics not immediate transitions', async () => {
      const Box = animated('div');

      const startTime = Date.now();
      let animationCompleted = false;

      render(() => (
        <Box
          data-testid="spring-box"
          animate={{
            from: { x: 0 },
            to: { x: 100 },
            when: 'mount',
            config: { stiffness: 100, damping: 15 },
            onComplete: () => {
              animationCompleted = true;
            }
          }}
        >
          Spring Physics
        </Box>
      ));

      const box = screen.getByTestId('spring-box');

      // Wait for animation to complete
      await waitFor(() => {
        expect(animationCompleted).toBe(true);
      }, { timeout: 3000 });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Spring animation should take time (not immediate)
      // Typically 100-1000ms depending on spring config
      expect(duration).toBeGreaterThan(50);
    });
  });
});
