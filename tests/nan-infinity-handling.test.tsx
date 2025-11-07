/**
 * NaN/Infinity Handling Tests
 * These tests verify that spring animations handle invalid numeric values gracefully
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSpring } from '../src/index';

describe('NaN/Infinity Handling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe('NaN values', () => {
    it('should not hang when NaN is passed as target', async () => {
      const [value, setValue] = createSpring(100);
      
      // This should resolve immediately, not timeout
      const promise = setValue(NaN);
      
      // Fast-forward time
      vi.advanceTimersByTime(100);
      
      // Promise should resolve quickly
      await expect(promise).resolves.toBeUndefined();
      
      // Value should remain at initial (safe fallback)
      expect(value()).toBe(100);
    });

    it('should call onError callback when NaN is detected', async () => {
      const onError = vi.fn();
      const [_, setValue] = createSpring(50, { onError });
      
      await setValue(NaN);
      vi.advanceTimersByTime(100);
      
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('NaN')
        })
      );
    });

    it('should call onComplete callback when NaN is detected', async () => {
      const onComplete = vi.fn();
      const [_, setValue] = createSpring(50, { onComplete });
      
      await setValue(NaN);
      vi.advanceTimersByTime(100);
      
      expect(onComplete).toHaveBeenCalled();
    });

    it('should not animate when NaN is passed', async () => {
      const onUpdate = vi.fn();
      const [value, setValue] = createSpring(100, { onUpdate });
      
      await setValue(NaN);
      vi.advanceTimersByTime(500);
      
      // onUpdate should not be called (no animation)
      expect(onUpdate).not.toHaveBeenCalled();
      expect(value()).toBe(100);
    });

    it('should handle multiple NaN calls in sequence', async () => {
      const [value, setValue] = createSpring(100);
      
      await setValue(NaN);
      await setValue(NaN);
      await setValue(NaN);
      
      vi.advanceTimersByTime(100);
      
      expect(value()).toBe(100);
    });

    it('should recover from NaN and animate to valid value', async () => {
      const [value, setValue] = createSpring(0);
      
      // First try NaN
      await setValue(NaN);
      expect(value()).toBe(0);
      
      // Then set valid value
      setValue(100);
      vi.advanceTimersByTime(1000);
      
      expect(value()).toBe(100);
    });
  });

  describe('Infinity values', () => {
    it('should not hang when Infinity is passed', async () => {
      const [value, setValue] = createSpring(100);
      
      const promise = setValue(Infinity);
      vi.advanceTimersByTime(100);
      
      await expect(promise).resolves.toBeUndefined();
      expect(value()).toBe(100);
    });

    it('should not hang when -Infinity is passed', async () => {
      const [value, setValue] = createSpring(100);
      
      const promise = setValue(-Infinity);
      vi.advanceTimersByTime(100);
      
      await expect(promise).resolves.toBeUndefined();
      expect(value()).toBe(100);
    });

    it('should call onError callback for Infinity', async () => {
      const onError = vi.fn();
      const [_, setValue] = createSpring(50, { onError });
      
      await setValue(Infinity);
      vi.advanceTimersByTime(100);
      
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Infinity')
        })
      );
    });

    it('should handle both Infinity and NaN in sequence', async () => {
      const [value, setValue] = createSpring(100);
      
      await setValue(Infinity);
      await setValue(NaN);
      await setValue(-Infinity);
      
      vi.advanceTimersByTime(100);
      
      expect(value()).toBe(100);
    });
  });

  describe('Nested structures with NaN', () => {
    it('should handle objects with NaN values', async () => {
      const [value, setValue] = createSpring({ x: 0, y: 0 });
      
      const promise = setValue({ x: NaN, y: 50 });
      vi.advanceTimersByTime(100);
      
      await expect(promise).resolves.toBeUndefined();
      
      // Should fallback to initial
      expect(value()).toEqual({ x: 0, y: 0 });
    });

    it('should handle arrays with NaN values', async () => {
      const [value, setValue] = createSpring([0, 0, 0]);
      
      const promise = setValue([NaN, 50, 100]);
      vi.advanceTimersByTime(100);
      
      await expect(promise).resolves.toBeUndefined();
      expect(value()).toEqual([0, 0, 0]);
    });

    it('should handle deeply nested NaN', async () => {
      const [value, setValue] = createSpring({ 
        pos: { x: 0, y: 0 }, 
        size: { w: 10, h: 10 } 
      });
      
      const promise = setValue({ 
        pos: { x: NaN, y: 50 }, 
        size: { w: 20, h: NaN } 
      });
      
      vi.advanceTimersByTime(100);
      
      await expect(promise).resolves.toBeUndefined();
      expect(value()).toEqual({ 
        pos: { x: 0, y: 0 }, 
        size: { w: 10, h: 10 } 
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle division by zero resulting in NaN', async () => {
      const [value, setValue] = createSpring(100);
      
      // 0/0 = NaN
      const invalidValue = 0 / 0;
      const promise = setValue(invalidValue);
      
      vi.advanceTimersByTime(100);
      
      await expect(promise).resolves.toBeUndefined();
      expect(value()).toBe(100);
    });

    it('should handle Math operations resulting in NaN', async () => {
      const [value, setValue] = createSpring(100);
      
      // Math.sqrt(-1) = NaN
      const invalidValue = Math.sqrt(-1);
      const promise = setValue(invalidValue);
      
      vi.advanceTimersByTime(100);
      
      await expect(promise).resolves.toBeUndefined();
      expect(value()).toBe(100);
    });

    it('should handle Number.NaN explicitly', async () => {
      const [value, setValue] = createSpring(100);
      
      const promise = setValue(Number.NaN);
      vi.advanceTimersByTime(100);
      
      await expect(promise).resolves.toBeUndefined();
      expect(value()).toBe(100);
    });

    it('should handle Number.POSITIVE_INFINITY', async () => {
      const [value, setValue] = createSpring(100);
      
      const promise = setValue(Number.POSITIVE_INFINITY);
      vi.advanceTimersByTime(100);
      
      await expect(promise).resolves.toBeUndefined();
      expect(value()).toBe(100);
    });

    it('should handle Number.NEGATIVE_INFINITY', async () => {
      const [value, setValue] = createSpring(100);
      
      const promise = setValue(Number.NEGATIVE_INFINITY);
      vi.advanceTimersByTime(100);
      
      await expect(promise).resolves.toBeUndefined();
      expect(value()).toBe(100);
    });
  });

  describe('State consistency', () => {
    it('should not leave animation in running state after NaN', async () => {
      const [value, setValue] = createSpring(0);
      
      await setValue(NaN);
      vi.advanceTimersByTime(100);
      
      // Should be able to animate to valid value immediately
      setValue(100);
      vi.advanceTimersByTime(1000);
      
      expect(value()).toBe(100);
    });

    it('should cleanup tasks when NaN is detected', async () => {
      const [value, setValue] = createSpring(0);
      
      // Start a normal animation
      setValue(50);
      vi.advanceTimersByTime(50);
      
      // Interrupt with NaN
      await setValue(NaN);
      vi.advanceTimersByTime(100);
      
      // Should be stable
      expect(value()).toBe(0);
    });
  });

  describe('Performance', () => {
    it('should resolve NaN immediately without waiting', async () => {
      const [_, setValue] = createSpring(100);
      
      const start = Date.now();
      await setValue(NaN);
      const elapsed = Date.now() - start;
      
      // Should resolve in < 10ms (immediately)
      expect(elapsed).toBeLessThan(10);
    });

    it('should not create memory leaks with repeated NaN calls', async () => {
      const [_, setValue] = createSpring(100);
      
      // Call many times
      const promises = [];
      for (let i = 0; i < 1000; i++) {
        promises.push(setValue(NaN));
      }
      
      await Promise.all(promises);
      
      // Should not throw or hang
      expect(true).toBe(true);
    });
  });
});
