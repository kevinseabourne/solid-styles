import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { createRoot } from 'solid-js';
import { styled } from '../src';

describe('Styled Components', () => {
  it('should create a basic styled component', () => {
    const Button = styled.button`
      background: blue;
      color: white;
      padding: 10px;
    `;

    const { container } = render(() => <Button>Click me</Button>);
    const button = container.querySelector('button');
    
    expect(button).toBeTruthy();
    expect(button?.textContent).toBe('Click me');
    expect(button?.className).toMatch(/^bau/);
    
    cleanup();
  });

  it('should handle dynamic props', () => {
    interface ButtonProps {
      primary?: boolean;
    }
    
    const Button = styled.button<ButtonProps>`
      background: ${(props: ButtonProps) => props.primary ? 'blue' : 'gray'};
      color: white;
    `;

    const [isPrimary, setIsPrimary] = createSignal(true);
    const { container } = render(() => <Button primary={isPrimary()}>Primary</Button>);
    const button = container.querySelector('button');
    
    expect(button).toBeTruthy();
    const initialStyle = window.getComputedStyle(button!);
    expect(initialStyle.getPropertyValue('background-color')).toBeTruthy(); // Check if background-color is set
    
    // Test prop change
    setIsPrimary(false);
    const updatedStyle = window.getComputedStyle(button!);
    expect(updatedStyle.getPropertyValue('background-color')).toBeTruthy(); // Check if background-color is set
    expect(updatedStyle).not.toBe(initialStyle);
    
    cleanup();
  });

  it('should work with createRoot pattern', () => {
    createRoot((dispose) => {
      const StyledDiv = styled.div`
        width: 100px;
        height: 100px;
      `;

      const { container } = render(() => <StyledDiv />);
      const div = container.querySelector('div');
      
      expect(div).toBeTruthy();
      expect(div?.className).toMatch(/^bau/);
      
      dispose();
    });
  });
});
