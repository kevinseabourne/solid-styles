# Global Layout Transition Configuration

Set spring settings once for your entire app, then just use `layout` everywhere!

## Quick Start

### 1. Wrap your app with `LayoutTransitionProvider`

```tsx
// index.tsx
import { render } from 'solid-js/web';
import { LayoutTransitionProvider } from 'solid-styles/animation';
import App from './App';

render(
  () => (
    <LayoutTransitionProvider 
      config={{ 
        stiffness: 400,
        damping: 30
      }}
    >
      <App />
    </LayoutTransitionProvider>
  ),
  document.getElementById('root')!
);
```

### 2. Use `layout` anywhere in your app

```tsx
// MyComponent.tsx
import { LayoutAnimated } from 'solid-styles/animation';
import { createSignal } from 'solid-js';

function MyComponent() {
  const [expanded, setExpanded] = createSignal(false);
  
  return (
    <LayoutAnimated layout>  {/* Uses global config! */}
      <button onClick={() => setExpanded(!expanded())}>Toggle</button>
      {expanded() && <div>Content animates smoothly!</div>}
    </LayoutAnimated>
  );
}
```

That's it! No need to repeat `layoutTransition={{...}}` everywhere.

## Benefits

✅ **Set once, use everywhere** - Configure spring settings in one place  
✅ **Consistent animations** - All layout animations feel the same  
✅ **Easy to change** - Update global config to change entire app  
✅ **Local overrides** - Can still customize specific components  
✅ **Nestable** - Different sections can have different configs  

## Usage Patterns

### Pattern 1: Global Config Only

```tsx
// index.tsx - Set global config
<LayoutTransitionProvider config={{ stiffness: 400, damping: 30 }}>
  <App />
</LayoutTransitionProvider>

// Anywhere in your app - just use layout
<LayoutAnimated layout>
  <YourContent />
</LayoutAnimated>
```

### Pattern 2: Global Config + Local Override

```tsx
// Most components use global config
<LayoutAnimated layout>
  <NormalContent />
</LayoutAnimated>

// Special component overrides for bouncy effect
<LayoutAnimated 
  layout 
  layoutTransition={{ stiffness: 200, damping: 10 }}
>
  <BouncyContent />
</LayoutAnimated>
```

### Pattern 3: Nested Providers (Different Sections)

```tsx
<LayoutTransitionProvider config={{ stiffness: 400, damping: 30 }}>
  <App>
    {/* Main app uses default config */}
    <MainContent />
    
    {/* Admin section uses snappier animations */}
    <LayoutTransitionProvider config={{ stiffness: 500, damping: 35 }}>
      <AdminPanel />
    </LayoutTransitionProvider>
    
    {/* User section uses smoother animations */}
    <LayoutTransitionProvider config={{ stiffness: 200, damping: 40 }}>
      <UserDashboard />
    </LayoutTransitionProvider>
  </App>
</LayoutTransitionProvider>
```

## Spring Presets

### Bouncy (iOS-like)
```tsx
<LayoutTransitionProvider config={{ stiffness: 200, damping: 10 }}>
```

### Smooth (No Bounce)
```tsx
<LayoutTransitionProvider config={{ stiffness: 100, damping: 40 }}>
```

### Snappy (Fast)
```tsx
<LayoutTransitionProvider config={{ stiffness: 500, damping: 35 }}>
```

### Framer Motion Default
```tsx
<LayoutTransitionProvider config={{ stiffness: 300, damping: 30 }}>
```

### Default (Balanced)
```tsx
<LayoutTransitionProvider config={{ stiffness: 400, damping: 30 }}>
```

## Full Configuration Options

```tsx
<LayoutTransitionProvider 
  config={{
    // Spring physics
    stiffness: 400,
    damping: 30,
    precision: 0.01,
    
    // Animation controls
    animateWidth: true,
    animateHeight: true,
    animatePosition: true,
    useTransform: true,
    
    // Callbacks (optional)
    onLayoutAnimationStart: (element) => {
      console.log('Animation started');
    },
    onLayoutAnimationComplete: (element) => {
      console.log('Animation complete');
    }
  }}
>
  <App />
</LayoutTransitionProvider>
```

## Examples

### Example 1: Simple App

```tsx
// index.tsx
import { render } from 'solid-js/web';
import { LayoutTransitionProvider } from 'solid-styles/animation';

render(
  () => (
    <LayoutTransitionProvider config={{ stiffness: 400, damping: 30 }}>
      <App />
    </LayoutTransitionProvider>
  ),
  document.getElementById('root')!
);

// Card.tsx
function Card() {
  const [expanded, setExpanded] = createSignal(false);
  
  return (
    <LayoutAnimated layout>
      <h2>My Card</h2>
      <button onClick={() => setExpanded(!expanded())}>Toggle</button>
      {expanded() && <div>Extra content</div>}
    </LayoutAnimated>
  );
}
```

### Example 2: E-commerce Site

```tsx
// Different animations for different sections
<LayoutTransitionProvider config={{ stiffness: 400, damping: 30 }}>
  <div>
    <Header />
    
    {/* Product cards use default */}
    <ProductGrid />
    
    {/* Cart has snappy animations */}
    <LayoutTransitionProvider config={{ stiffness: 500, damping: 35 }}>
      <ShoppingCart />
    </LayoutTransitionProvider>
    
    {/* Checkout has smooth animations */}
    <LayoutTransitionProvider config={{ stiffness: 200, damping: 40 }}>
      <CheckoutForm />
    </LayoutTransitionProvider>
  </div>
</LayoutTransitionProvider>
```

### Example 3: Dashboard

```tsx
// index.tsx
<LayoutTransitionProvider 
  config={{ 
    stiffness: 350,
    damping: 28,
    animateHeight: true,
    animateWidth: false  // Only animate height by default
  }}
>
  <Dashboard />
</LayoutTransitionProvider>

// Widget.tsx - Uses global config automatically
function Widget() {
  const [expanded, setExpanded] = createSignal(false);
  
  return (
    <LayoutAnimated layout>
      <WidgetHeader />
      <button onClick={() => setExpanded(!expanded())}>
        {expanded() ? 'Collapse' : 'Expand'}
      </button>
      {expanded() && <WidgetContent />}
    </LayoutAnimated>
  );
}
```

## Migration Guide

### Before (Repetitive)

```tsx
// Had to repeat this everywhere 😞
<LayoutAnimated layout layoutTransition={{ stiffness: 400, damping: 30 }}>
  <Content1 />
</LayoutAnimated>

<LayoutAnimated layout layoutTransition={{ stiffness: 400, damping: 30 }}>
  <Content2 />
</LayoutAnimated>

<LayoutAnimated layout layoutTransition={{ stiffness: 400, damping: 30 }}>
  <Content3 />
</LayoutAnimated>
```

### After (Clean)

```tsx
// Set once at the top 😃
<LayoutTransitionProvider config={{ stiffness: 400, damping: 30 }}>
  <LayoutAnimated layout><Content1 /></LayoutAnimated>
  <LayoutAnimated layout><Content2 /></LayoutAnimated>
  <LayoutAnimated layout><Content3 /></LayoutAnimated>
</LayoutTransitionProvider>
```

## API Reference

### `LayoutTransitionProvider`

Provider component for global layout transition configuration.

**Props:**
- `config: LayoutTransitionConfig` - Spring configuration
- `children: JSX.Element` - Child components

**Example:**
```tsx
<LayoutTransitionProvider config={{ stiffness: 400, damping: 30 }}>
  <App />
</LayoutTransitionProvider>
```

### `LayoutAnimated` with Global Config

When wrapped in `LayoutTransitionProvider`, `LayoutAnimated` automatically uses the global config.

**Props:**
- `layout: boolean` - Enable layout animations
- `layoutTransition?: LayoutTransitionConfig` - Optional override of global config
- `as?: Component | string` - Element type to render
- ...rest: Standard HTML attributes

**Examples:**

```tsx
// Uses global config
<LayoutAnimated layout>
  <Content />
</LayoutAnimated>

// Overrides global config
<LayoutAnimated layout layoutTransition={{ stiffness: 500 }}>
  <Content />
</LayoutAnimated>
```

## TypeScript Support

Full TypeScript support with type inference:

```typescript
import { LayoutTransitionProvider, LayoutTransitionConfig } from 'solid-styles/animation';

const globalConfig: LayoutTransitionConfig = {
  stiffness: 400,
  damping: 30,
  precision: 0.01,
  onLayoutAnimationComplete: (element: HTMLElement) => {
    console.log('Animation complete!', element);
  }
};

<LayoutTransitionProvider config={globalConfig}>
  <App />
</LayoutTransitionProvider>
```

## Summary

**Without Global Config:**
```tsx
<LayoutAnimated layout layoutTransition={{ stiffness: 400, damping: 30 }}>
```

**With Global Config:**
```tsx
// Once at app root
<LayoutTransitionProvider config={{ stiffness: 400, damping: 30 }}>

// Everywhere else - just this!
<LayoutAnimated layout>
```

Much cleaner! 🎉
