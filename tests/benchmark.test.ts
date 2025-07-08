/**
 * @fileoverview Performance benchmark tests for Solid Styles
 * This file contains dedicated performance benchmarks that can be run separately
 */

import { describe, it, expect } from "vitest";
import { styled, css } from "../src/index";
import { createSpring } from "../utils/spring";
import { createRoot } from "solid-js";

describe("Performance Benchmarks", () => {
  it("should measure styled component creation performance", () => {
    const iterations = 1000;
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      const StyledDiv = styled.div`
        color: red;
        font-size: 16px;
        padding: ${i % 10}px;
      `;
      expect(StyledDiv).toBeDefined();
    }
    
    const end = performance.now();
    const duration = end - start;
    
    // eslint-disable-next-line no-console
    console.log(`Styled component creation: ${duration.toFixed(2)}ms for ${iterations} components`);
    // eslint-disable-next-line no-console
    console.log(`Average: ${(duration / iterations).toFixed(4)}ms per component`);
    
    // Should be reasonably fast - less than 1ms per component
    expect(duration / iterations).toBeLessThan(1);
  });

  it("should measure CSS function performance", () => {
    const iterations = 1000;
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      const styles = css`
        background: linear-gradient(45deg, #${i.toString(16).padStart(6, '0')}, #ffffff);
        transform: rotate(${i % 360}deg);
        opacity: ${i % 100 / 100};
      `;
      expect(styles).toBeDefined();
    }
    
    const end = performance.now();
    const duration = end - start;
    
    // eslint-disable-next-line no-console
    console.log(`CSS function calls: ${duration.toFixed(2)}ms for ${iterations} calls`);
    // eslint-disable-next-line no-console
    console.log(`Average: ${(duration / iterations).toFixed(4)}ms per call`);
    
    // Should be very fast - less than 0.1ms per call
    expect(duration / iterations).toBeLessThan(0.1);
  });

  it("should measure spring animation setup performance", () => {
    const iterations = 100; // Lower for springs since they're more complex
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      createRoot((dispose) => {
        const [value, setValue] = createSpring(0, {
          stiffness: 170 + i,
          damping: 26,
        });
        
        setValue(100);
        expect(value()).toBeDefined();
        dispose();
      });
    }
    
    const end = performance.now();
    const duration = end - start;
    
    // eslint-disable-next-line no-console
    console.log(`Spring animation setup: ${duration.toFixed(2)}ms for ${iterations} springs`);
    // eslint-disable-next-line no-console
    console.log(`Average: ${(duration / iterations).toFixed(4)}ms per spring`);
    
    // Should be reasonably fast - less than 5ms per spring
    expect(duration / iterations).toBeLessThan(5);
  });

  it("should measure memory usage stability", () => {
    const initialMemory = (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0;
    
    // Create and dispose many components
    for (let i = 0; i < 100; i++) {
      const StyledComponent = styled.div`
        color: hsl(${i * 3.6}, 70%, 50%);
        transform: scale(${1 + i * 0.01});
      `;
      
      // Simulate usage
      expect(StyledComponent).toBeDefined();
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;
    
    // eslint-disable-next-line no-console
    console.log(`Memory usage increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    
    // Should not leak excessive memory - less than 10MB increase
    expect(memoryIncrease / 1024 / 1024).toBeLessThan(10);
  });

  it("should measure large style object performance", () => {
    const largeStyleObject: Record<string, string> = {};
    
    // Create large style object
    for (let i = 0; i < 100; i++) {
      largeStyleObject[`property${i}`] = `value${i}`;
    }
    
    const iterations = 50;
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      const StyledComponent = styled.div`
        ${Object.entries(largeStyleObject).map(([key, value]) => `${key}: ${value};`).join(' ')}
      `;
      expect(StyledComponent).toBeDefined();
    }
    
    const end = performance.now();
    const duration = end - start;
    
    // eslint-disable-next-line no-console
    console.log(`Large style object processing: ${duration.toFixed(2)}ms for ${iterations} iterations`);
    // eslint-disable-next-line no-console
    console.log(`Average: ${(duration / iterations).toFixed(4)}ms per iteration`);
    
    // Should handle large objects reasonably - less than 20ms per iteration
    expect(duration / iterations).toBeLessThan(20);
  });
});
