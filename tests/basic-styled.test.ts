import { describe, it, expect } from 'vitest';
import { styled } from '../src/index';

describe('Basic Styled Test', () => {
  it('should have styled function', () => {
    expect(styled).toBeDefined();
    expect(typeof styled).toBe('function');
  });
  
  it('should have styled.button via proxy', () => {
    expect(styled.button).toBeDefined();
    expect(typeof styled.button).toBe('function');
  });
  
  it('should create a styled component', () => {
    const Button = styled.button`
      background: blue;
      color: white;
    `;
    
    expect(Button).toBeDefined();
    expect(typeof Button).toBe('function');
  });
});
