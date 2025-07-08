import { describe, it, expect } from 'vitest';

describe('Minimal Test', () => {
  it('should pass basic math', () => {
    expect(1 + 1).toBe(2);
  });
  
  it('should import styled function', async () => {
    // Dynamic import to test module resolution
    const module = await import('../src/index');
    expect(module.styled).toBeDefined();
    expect(typeof module.styled).toBe('function');
  });
});
