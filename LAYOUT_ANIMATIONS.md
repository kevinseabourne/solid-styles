# Layout Animations

Framer Motion-style layout animations for solid-styles. Automatically animate size and position changes when elements change due to state updates.

## Overview

Layout animations allow you to smoothly animate size and position changes without manually specifying transitions. Perfect for:
- Expanding/collapsing sections
- Dynamic grids and lists
- Modal dialogs
- Responsive layouts
- Any UI where element dimensions change dynamically

## Quick Start

```tsx
import { LayoutAnimated, useLayoutAnimation } from '@solid-styles/animation';
import { createSignal } from 'solid-js';

// Using the LayoutAnimated component
function ExpandableBox() {
  const [expanded, setExpanded] = createSignal(false);
  
  return (
    <LayoutAnimated layoutTransition={{ stiffness: 400, damping: 30 }}>
      <button onClick={() => setExpanded(!expanded())}>
        Toggle
      </button>
      {expanded() && (
        <div>
          Additional content that animates in smoothly
        </div>
      )}
    </LayoutAnimated>
  );
}

// Using the hook
function CustomBox() {
  const [expanded, setExpanded] = createSignal(false);
  const layoutRef = useLayoutAnimation({ stiffness: 300, damping: 25 });
  
  return (
    <div ref={layoutRef}>
      <button onClick={() => setExpanded(!expanded())}>Toggle</button>
      {expanded() && <div>Extra content</div>}
    </div>
  );
}
```

## Installation

Layout animations are included in the main `solid-styles` package:

```tsx
import { 
  LayoutAnimated, 
  useLayoutAnimation,
  layoutAnimation 
} from 'solid-styles/animation';
```

## API Reference

### LayoutAnimated Component

A wrapper component that adds layout animations to any element.

```tsx
<LayoutAnimated
  as="div"
  layoutTransition={{
    stiffness: 400,
    damping: 30,
    precision: 0.01,
    animateWidth: true,
    animateHeight: true,
    animatePosition: true,
    useTransform: true
  }}
>
  {children}
</LayoutAnimated>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `as` | `string \| Component` | `'div'` | Element type to render |
| `layoutTransition` | `LayoutTransitionConfig` | See below | Animation configuration |
| ...rest | `JSX.HTMLAttributes` | - | Standard HTML attributes |

### useLayoutAnimation Hook

Hook for adding layout animations to any element via a ref.

```tsx
const layoutRef = useLayoutAnimation(config?: LayoutTransitionConfig);

return <div ref={layoutRef}>Content</div>;
```

**Returns**: `(element: HTMLElement) => void` - Ref function to attach to element

### layoutAnimation Directive

Directive for adding layout animations declaratively.

```tsx
import { layoutAnimation } from 'solid-styles/animation';

<div use:layoutAnimation={{ stiffness: 400 }}>
  Content
</div>

// Or just enable with defaults
<div use:layoutAnimation={true}>
  Content
</div>
```

### LayoutTransitionConfig

Configuration object for layout animations.

```typescript
interface LayoutTransitionConfig {
  // Spring physics
  stiffness?: number;      // Default: 300
  damping?: number;        // Default: 30
  precision?: number;      // Default: 0.01
  
  // Animation controls
  animateWidth?: boolean;     // Default: true
  animateHeight?: boolean;    // Default: true
  animatePosition?: boolean;  // Default: true
  useTransform?: boolean;     // Default: true (more performant)
  
  // Callbacks
  onLayoutAnimationStart?: (element: HTMLElement) => void;
  onLayoutAnimationComplete?: (element: HTMLElement) => void;
}
```

## Usage Examples

### Expanding Card

```tsx
import { createSignal } from 'solid-js';
import { LayoutAnimated } from 'solid-styles/animation';
import { styled } from 'solid-styles';

const Card = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

function ExpandableCard() {
  const [expanded, setExpanded] = createSignal(false);
  
  return (
    <LayoutAnimated 
      as={Card}
      layoutTransition={{ stiffness: 400, damping: 30 }}
    >
      <h2>Card Title</h2>
      <button onClick={() => setExpanded(!expanded())}>
        {expanded() ? 'Show Less' : 'Show More'}
      </button>
      
      {expanded() && (
        <div>
          <p>Additional content appears here...</p>
          <p>...and animates smoothly!</p>
        </div>
      )}
    </LayoutAnimated>
  );
}
```

### Dynamic Grid

```tsx
import { createSignal, For } from 'solid-js';
import { LayoutAnimated } from 'solid-styles/animation';
import { styled } from 'solid-styles';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
`;

const GridItem = styled.div`
  background: #f0f0f0;
  padding: 20px;
  border-radius: 8px;
`;

function DynamicGrid() {
  const [items, setItems] = createSignal([1, 2, 3, 4]);
  
  const addItem = () => {
    setItems([...items(), items().length + 1]);
  };
  
  return (
    <div>
      <button onClick={addItem}>Add Item</button>
      <Grid>
        <For each={items()}>
          {(item) => (
            <LayoutAnimated 
              as={GridItem}
              layoutTransition={{ stiffness: 300, damping: 25 }}
            >
              Item {item}
            </LayoutAnimated>
          )}
        </For>
      </Grid>
    </div>
  );
}
```

### Form with Conditional Fields

```tsx
import { createSignal } from 'solid-js';
import { useLayoutAnimation } from 'solid-styles/animation';
import { styled } from 'solid-styles';

const Form = styled.form`
  max-width: 400px;
  padding: 20px;
`;

function DynamicForm() {
  const [showOptional, setShowOptional] = createSignal(false);
  const formRef = useLayoutAnimation({ 
    stiffness: 400, 
    damping: 30,
    animateHeight: true,
    animateWidth: false  // Don't animate width, only height
  });
  
  return (
    <Form ref={formRef}>
      <input type="text" placeholder="Name" />
      <input type="email" placeholder="Email" />
      
      <label>
        <input 
          type="checkbox" 
          checked={showOptional()} 
          onChange={(e) => setShowOptional(e.currentTarget.checked)}
        />
        Show optional fields
      </label>
      
      {showOptional() && (
        <>
          <input type="tel" placeholder="Phone (optional)" />
          <input type="text" placeholder="Company (optional)" />
        </>
      )}
      
      <button type="submit">Submit</button>
    </Form>
  );
}
```

### Sidebar Navigation

```tsx
import { createSignal } from 'solid-js';
import { LayoutAnimated } from 'solid-styles/animation';
import { styled } from 'solid-styles';

const Sidebar = styled.nav`
  background: #2c3e50;
  color: white;
  height: 100vh;
  overflow: hidden;
`;

const NavItem = styled.a`
  display: block;
  padding: 12px 20px;
  color: white;
  text-decoration: none;
  
  &:hover {
    background: #34495e;
  }
`;

function CollapsibleSidebar() {
  const [collapsed, setCollapsed] = createSignal(false);
  
  return (
    <LayoutAnimated 
      as={Sidebar}
      layoutTransition={{
        stiffness: 350,
        damping: 28,
        animateWidth: true,
        animateHeight: false
      }}
      style={{ 
        width: collapsed() ? '60px' : '250px'
      }}
    >
      <button onClick={() => setCollapsed(!collapsed())}>
        {collapsed() ? '→' : '←'}
      </button>
      
      <NavItem href="/">
        {!collapsed() && 'Home'}
      </NavItem>
      <NavItem href="/about">
        {!collapsed() && 'About'}
      </NavItem>
      <NavItem href="/contact">
        {!collapsed() && 'Contact'}
      </NavItem>
    </LayoutAnimated>
  );
}
```

## Advanced Usage

### Custom Spring Configuration

```tsx
// Bouncy animation
<LayoutAnimated layoutTransition={{ 
  stiffness: 200, 
  damping: 10  // Low damping = more bounce
}}>
  {children}
</LayoutAnimated>

// Smooth, gradual animation
<LayoutAnimated layoutTransition={{ 
  stiffness: 100, 
  damping: 40  // High damping = less bounce
}}>
  {children}
</LayoutAnimated>

// Snappy animation
<LayoutAnimated layoutTransition={{ 
  stiffness: 500, 
  damping: 35
}}>
  {children}
</LayoutAnimated>
```

### Animation Callbacks

```tsx
<LayoutAnimated 
  layoutTransition={{
    onLayoutAnimationStart: (element) => {
      console.log('Animation started:', element);
      element.style.opacity = '0.8';
    },
    onLayoutAnimationComplete: (element) => {
      console.log('Animation complete:', element);
      element.style.opacity = '1';
    }
  }}
>
  {children}
</LayoutAnimated>
```

### Selective Animation

```tsx
// Only animate height, not width or position
<LayoutAnimated layoutTransition={{
  animateHeight: true,
  animateWidth: false,
  animatePosition: false
}}>
  {children}
</LayoutAnimated>

// Only animate position, useful for reordering lists
<LayoutAnimated layoutTransition={{
  animateHeight: false,
  animateWidth: false,
  animatePosition: true
}}>
  {children}
</LayoutAnimated>
```

### Using with Styled Components

Layout animations work seamlessly with styled components:

```tsx
const AnimatedBox = styled(LayoutAnimated)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 12px;
  color: white;
`;

function Component() {
  return (
    <AnimatedBox layoutTransition={{ stiffness: 400 }}>
      Content
    </AnimatedBox>
  );
}
```

## Performance Considerations

### Transform vs Width/Height

- **useTransform: true** (default) - Uses CSS `transform` for position animations, which is GPU-accelerated and more performant
- **useTransform: false** - Uses `top`/`left` properties, less performant but may be needed for specific layouts

### Animation Throttling

The engine automatically throttles position checks using `requestAnimationFrame` to maintain 60fps performance.

### Memory Management

- All observers and animations are automatically cleaned up when components unmount
- Springs are reused for efficiency
- No memory leaks even with many animated elements

### Best Practices

1. **Use transforms when possible** - Set `useTransform: true` for better performance
2. **Animate only what changes** - Disable unnecessary animation axes
3. **Adjust precision** - Lower precision (higher value) = smoother but less exact
4. **Batch updates** - Group multiple state changes together to trigger one animation

```tsx
// ✅ Good - Single animation
batch(() => {
  setExpanded(true);
  setContent(newContent);
});

// ❌ Avoid - Multiple separate animations
setExpanded(true);
setContent(newContent);
```

## Browser Support

Layout animations work in all modern browsers that support:
- ResizeObserver (all modern browsers)
- requestAnimationFrame (all browsers)
- CSS transforms (all browsers)

For older browsers, animations will gracefully degrade to immediate changes.

## Comparison with Framer Motion

| Feature | solid-styles | Framer Motion |
|---------|--------------|---------------|
| Auto layout animations | ✅ | ✅ |
| Spring physics | ✅ | ✅ |
| Size changes | ✅ | ✅ |
| Position changes | ✅ | ✅ |
| Performance | 🚀 Excellent | ✅ Good |
| Bundle size | 📦 Small | 📦 Large |
| Framework | SolidJS | React |
| Tree-shaking | ✅ | ✅ |

## Troubleshooting

### Animation not triggering

Make sure the element's size/position is actually changing:

```tsx
// ✅ This works - height changes
{expanded() && <div>Content</div>}

// ❌ This won't work - no size change
{expanded() ? <div>Content</div> : <div>Content</div>}
```

### Jittery animations

Try adjusting the spring physics:

```tsx
// More damping = less jitter
<LayoutAnimated layoutTransition={{ damping: 40 }}>
```

### Performance issues

- Reduce the number of simultaneously animated elements
- Use `useTransform: true` (default)
- Increase `precision` value for less frequent updates

## TypeScript Support

Full TypeScript support with type inference:

```typescript
import { LayoutAnimated, useLayoutAnimation, LayoutTransitionConfig } from 'solid-styles/animation';

const config: LayoutTransitionConfig = {
  stiffness: 400,
  damping: 30,
  onLayoutAnimationComplete: (element: HTMLElement) => {
    console.log('Done!', element);
  }
};

const layoutRef = useLayoutAnimation(config);
```

## Contributing

Found a bug or have a feature request? [Open an issue](https://github.com/your-repo/issues) or submit a pull request!

## License

MIT
