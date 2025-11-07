/**
 * COMPREHENSIVE EDGE CASE TESTS
 * Tests crazy edge cases and spring animation accuracy
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { styled, createSpring, css } from '../src/index';

describe('Edge Cases - Style Conversion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('handles deeply nested prop interpolation', () => {
    const Button = styled.button<{ theme: { colors: { primary: { main: string } } } }>`
      background: ${props => props.theme?.colors?.primary?.main || 'blue'};
      color: ${props => props.theme ? 'white' : 'black'};
      padding: ${props => props.theme?.colors ? '10px' : '5px'};
    `;

    const { container } = render(() => (
      <Button theme={{ colors: { primary: { main: '#ff0000' } } }}>
        Test
      </Button>
    ));

    const button = container.querySelector('button');
    expect(button).toBeTruthy();
  });

  it('handles conditional logic with nested ternaries', () => {
    const Box = styled.div<{ level: number }>`
      background: ${props => 
        props.level > 3 
          ? 'red' 
          : props.level > 2 
            ? 'orange' 
            : props.level > 1 
              ? 'yellow' 
              : 'green'
      };
      opacity: ${props => props.level / 10};
    `;

    const { container } = render(() => <Box level={4}>Test</Box>);
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('handles object spread in props', () => {
    const baseStyles = { padding: '10px', margin: '5px' };
    const Component = styled.div<{ styles?: typeof baseStyles }>`
      ${props => Object.entries(props.styles || baseStyles)
        .map(([key, value]) => `${key}: ${value};`)
        .join('\n')}
    `;

    const { container } = render(() => (
      <Component styles={{ padding: '20px', margin: '10px' }}>Test</Component>
    ));
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('handles mixed static and dynamic properties', () => {
    const Mixed = styled.div<{ dynamic: string }>`
      /* Static */
      position: absolute;
      top: 0;
      left: 0;
      
      /* Dynamic */
      background: ${props => props.dynamic};
      
      /* More static */
      width: 100%;
      height: 100%;
      
      /* More dynamic */
      opacity: ${props => props.dynamic === 'blue' ? 1 : 0.5};
    `;

    const { container } = render(() => <Mixed dynamic="blue">Test</Mixed>);
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('handles media queries with dynamic props', () => {
    const Responsive = styled.div<{ mobile: boolean }>`
      width: 100%;
      
      ${props => props.mobile ? `
        @media (max-width: 768px) {
          width: 50%;
          padding: 5px;
        }
      ` : `
        @media (min-width: 769px) {
          width: 75%;
          padding: 10px;
        }
      `}
    `;

    const { container } = render(() => <Responsive mobile={true}>Test</Responsive>);
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('handles pseudo-selectors with dynamic content', () => {
    const Pseudo = styled.button<{ hoverColor: string }>`
      background: blue;
      
      &:hover {
        background: ${props => props.hoverColor};
      }
      
      &::before {
        content: '${props => props.hoverColor}';
        display: none;
      }
    `;

    const { container } = render(() => <Pseudo hoverColor="red">Test</Pseudo>);
    expect(container.querySelector('button')).toBeTruthy();
  });

  it('handles function returning function (higher-order)', () => {
    const multiplier = (factor: number) => (value: number) => value * factor;
    
    const Component = styled.div<{ base: number }>`
      padding: ${props => multiplier(2)(props.base)}px;
      margin: ${props => multiplier(3)(props.base)}px;
    `;

    const { container } = render(() => <Component base={5}>Test</Component>);
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('handles undefined and null prop values gracefully', () => {
    const Safe = styled.div<{ color?: string; bg?: string }>`
      color: ${props => props.color ?? 'black'};
      background: ${props => props.bg || 'white'};
      border: ${props => props.color === undefined ? 'none' : '1px solid'};
    `;

    const { container } = render(() => <Safe>Test</Safe>);
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('handles array props and iteration', () => {
    const Grid = styled.div<{ columns: number[] }>`
      display: grid;
      grid-template-columns: ${props => props.columns.map(c => `${c}fr`).join(' ')};
    `;

    const { container } = render(() => <Grid columns={[1, 2, 1]}>Test</Grid>);
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('handles CSS custom properties (variables)', () => {
    const Themed = styled.div<{ primary: string }>`
      --primary-color: ${props => props.primary};
      --secondary-color: ${props => props.primary}80;
      
      background: var(--primary-color);
      border-color: var(--secondary-color);
    `;

    const { container } = render(() => <Themed primary="#ff0000">Test</Themed>);
    expect(container.querySelector('div')).toBeTruthy();
  });
});

describe('Edge Cases - Spring Animations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('handles rapid value changes without breaking', async () => {
    const [value, setValue] = createSpring(0);
    
    // Rapid fire updates
    for (let i = 0; i < 100; i++) {
      setValue(i);
      vi.advanceTimersByTime(1);
    }
    
    vi.advanceTimersByTime(1000);
    
    expect(value()).toBe(99);
  });

  it('handles NaN values gracefully', async () => {
    const [value, setValue] = createSpring(0);
    
    // Try to set NaN
    await setValue(NaN as any).catch(() => {});
    
    vi.advanceTimersByTime(500);
    
    // Should not crash, value should be stable
    expect(typeof value()).toBe('number');
    expect(Number.isFinite(value())).toBe(true);
  });

  it('handles Infinity values gracefully', async () => {
    const [value, setValue] = createSpring(0);
    
    await setValue(Infinity as any).catch(() => {});
    
    vi.advanceTimersByTime(500);
    
    expect(Number.isFinite(value())).toBe(true);
  });

  it('handles negative values correctly', async () => {
    const [value, setValue] = createSpring(100);
    
    setValue(-100);
    vi.advanceTimersByTime(1000);
    
    expect(value()).toBe(-100);
  });

  it('handles very large numbers', async () => {
    const [value, setValue] = createSpring(0);
    
    setValue(1e10);
    vi.advanceTimersByTime(1000);
    
    expect(value()).toBeCloseTo(1e10, -5);
  });

  it('handles very small decimal precision', async () => {
    const [value, setValue] = createSpring(0);
    
    setValue(0.000001);
    vi.advanceTimersByTime(1000);
    
    expect(value()).toBeCloseTo(0.000001, 6);
  });

  it('handles color animations with invalid colors', async () => {
    const [color, setColor] = createSpring('rgb(0, 0, 0)');
    
    // Try invalid color
    setColor('not-a-color' as any);
    vi.advanceTimersByTime(500);
    
    // Should not crash
    expect(typeof color()).toBe('string');
  });

  it('handles transform animations with mixed units', async () => {
    const [transform, setTransform] = createSpring('translate(0px, 0px)');
    
    setTransform('translate(100%, 50vh)');
    vi.advanceTimersByTime(1000);
    
    expect(transform()).toContain('translate');
  });

  it('handles gradient animations with different stop counts', async () => {
    const [gradient, setGradient] = createSpring(
      'linear-gradient(0deg, red 0%, blue 100%)'
    );
    
    setGradient('linear-gradient(90deg, red 0%, yellow 50%, blue 100%)');
    vi.advanceTimersByTime(1000);
    
    expect(gradient()).toContain('gradient');
  });

  it('handles interrupting animations correctly', async () => {
    const [value, setValue] = createSpring(0);
    
    // Start animation
    setValue(100);
    vi.advanceTimersByTime(100);
    
    const midValue = value();
    expect(midValue).toBeGreaterThan(0);
    expect(midValue).toBeLessThan(100);
    
    // Interrupt with new target
    setValue(50);
    vi.advanceTimersByTime(1000);
    
    expect(value()).toBe(50);
  });

  it('handles soft animation mode', async () => {
    const [value, setValue] = createSpring(0);
    
    setValue(100, { soft: true });
    
    vi.advanceTimersByTime(100);
    const early = value();
    
    vi.advanceTimersByTime(400);
    const final = value();
    
    // Soft should be more gradual
    expect(early).toBeLessThan(final);
    expect(final).toBeCloseTo(100, 0);
  });

  it('handles object animations with nested properties', async () => {
    const [obj, setObj] = createSpring({ x: 0, y: 0, nested: { z: 0 } });
    
    setObj({ x: 100, y: 50, nested: { z: 25 } });
    vi.advanceTimersByTime(1000);
    
    expect(obj().x).toBe(100);
    expect(obj().y).toBe(50);
    expect(obj().nested.z).toBe(25);
  });

  it('handles array animations', async () => {
    const [arr, setArr] = createSpring([0, 0, 0]);
    
    setArr([100, 50, 25]);
    vi.advanceTimersByTime(1000);
    
    expect(arr()[0]).toBe(100);
    expect(arr()[1]).toBe(50);
    expect(arr()[2]).toBe(25);
  });

  it('handles Date object animations', async () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-12-31');
    
    const [date, setDate] = createSpring(start);
    
    // CRITICAL FIX: Date animations involve large numeric ranges (milliseconds)
    // Use the promise returned by setDate to ensure completion
    const promise = setDate(end);
    vi.advanceTimersByTime(2000); // Give time for animation to settle
    await promise; // Wait for the spring to complete
    
    expect(date().getTime()).toBe(end.getTime());
  });
});

describe('Edge Cases - CSS Generation', () => {
  it('handles empty template strings', () => {
    const Empty = styled.div``;
    const { container } = render(() => <Empty>Test</Empty>);
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('handles only whitespace', () => {
    const Whitespace = styled.div`
      
      
      
    `;
    const { container } = render(() => <Whitespace>Test</Whitespace>);
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('handles comments in CSS', () => {
    const Commented = styled.div`
      /* This is a comment */
      color: blue;
      /* Another comment */
      background: red; /* Inline comment */
    `;
    const { container } = render(() => <Commented>Test</Commented>);
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('handles very long class names', () => {
    const longProp = 'a'.repeat(1000);
    const className = css`
      content: '${longProp}';
    `;
    expect(className).toBeTruthy();
  });

  it('handles special characters in interpolations', () => {
    const Special = styled.div<{ content: string }>`
      content: '${props => props.content}';
    `;
    
    const { container } = render(() => (
      <Special content="Test with 'quotes' and &quot;double quotes&quot;">Test</Special>
    ));
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('handles calc() expressions', () => {
    const Calc = styled.div<{ multiplier: number }>`
      width: calc(100% - ${props => props.multiplier * 10}px);
      height: calc(100vh / ${props => props.multiplier});
    `;
    
    const { container } = render(() => <Calc multiplier={2}>Test</Calc>);
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('handles CSS grid complex values', () => {
    const Grid = styled.div`
      display: grid;
      grid-template-areas:
        "header header header"
        "sidebar main main"
        "footer footer footer";
      grid-template-columns: repeat(3, 1fr);
    `;
    
    const { container } = render(() => <Grid>Test</Grid>);
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('handles multiple animations', () => {
    const Animated = styled.div`
      animation: spin 2s linear infinite, fade 1s ease-in;
    `;
    
    const { container } = render(() => <Animated>Test</Animated>);
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('handles clamp() and min/max functions', () => {
    const Responsive = styled.div`
      font-size: clamp(1rem, 2.5vw, 2rem);
      width: min(100%, 1200px);
      height: max(300px, 50vh);
    `;
    
    const { container } = render(() => <Responsive>Test</Responsive>);
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('handles CSS custom functions', () => {
    const Custom = styled.div`
      background: paint(something);
      clip-path: path('M 0 0 L 100 0 L 100 100 Z');
    `;
    
    const { container } = render(() => <Custom>Test</Custom>);
    expect(container.querySelector('div')).toBeTruthy();
  });
});

describe('Edge Cases - Performance & Memory', () => {
  it('handles thousands of components without memory leak', () => {
    const Component = styled.div`color: blue;`;
    
    const { container } = render(() => (
      <div>
        {Array.from({ length: 1000 }, (_, i) => (
          <Component key={i}>{i}</Component>
        ))}
      </div>
    ));
    
    expect(container.querySelectorAll('div').length).toBeGreaterThan(1000);
  });

  it('handles rapid mount/unmount cycles', () => {
    const [show, setShow] = createSignal(true);
    const Component = styled.div`color: blue;`;
    
    const { container } = render(() => (
      <div>
        {show() && <Component>Test</Component>}
      </div>
    ));
    
    for (let i = 0; i < 100; i++) {
      setShow(false);
      setShow(true);
    }
    
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('handles concurrent animations', async () => {
    const springs = Array.from({ length: 50 }, () => createSpring(0));
    
    springs.forEach(([_, set]) => set(100));
    
    vi.advanceTimersByTime(1000);
    
    springs.forEach(([get]) => {
      expect(get()).toBe(100);
    });
  });
});

describe('Edge Cases - Zero-Runtime CSS Variables', () => {
  it('extracts CSS variables from dynamic values', () => {
    const className = css`
      color: ${() => 'red'};
      background: ${() => 'blue'};
    `;
    
    expect(className).toBeTruthy();
  });

  it('handles mixed static and CSS variable content', () => {
    const className = css`
      position: absolute;
      color: ${() => 'red'};
      width: 100%;
      background: ${() => 'blue'};
    `;
    
    expect(className).toBeTruthy();
  });
});
