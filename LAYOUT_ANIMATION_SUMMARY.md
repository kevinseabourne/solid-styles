# Layout Animation Feature - Summary

## 🎯 What You're Getting

**Framer Motion's `layout` prop for SolidJS styled components!**

### The Magic ✨

```tsx
const AnimatedBox = styled.div`
  padding: 2rem;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border-radius: 8px;
`;

// Just add layout={true} - that's it!
<AnimatedBox layout>
  <Show when={expanded()}>
    <p>Content that changes size</p>
    <p>Container auto-animates with spring physics!</p>
  </Show>
</AnimatedBox>
```

## 📋 3 Ways to Use It

### 1. **Simple Boolean** (Like Framer Motion)
```tsx
<AnimatedCard layout>
  {/* Animates ALL layout changes (size + position) */}
</AnimatedCard>
```

### 2. **Specific Properties**
```tsx
<AnimatedCard layout="size">
  {/* Only animates width/height changes */}
</AnimatedCard>

<FloatingButton layout="position">
  {/* Only animates x/y position changes */}
</FloatingButton>
```

### 3. **Custom Spring Config**
```tsx
<AnimatedCard 
  layout
  layoutTransition={{
    stiffness: 200,  // Faster animation
    damping: 30      // Less bouncy
  }}
>
  {/* Custom physics! */}
</AnimatedCard>
```

## 🔥 Real-World Use Cases

### Expandable Cards
```tsx
function ProductCard() {
  const [showDetails, setShowDetails] = createSignal(false);
  
  return (
    <Card layout onClick={() => setShowDetails(!showDetails())}>
      <h3>Product Name</h3>
      <p>$99.99</p>
      <Show when={showDetails()}>
        <p>Full description here...</p>
        <button>Add to Cart</button>
      </Show>
    </Card>
  );
}
```

### Dynamic Forms
```tsx
function DynamicForm() {
  const [fields, setFields] = createSignal(['name', 'email']);
  
  return (
    <FormContainer layout>
      <For each={fields()}>
        {field => <Input placeholder={field} />}
      </For>
      <button onClick={() => setFields([...fields(), 'phone'])}>
        Add Field
      </button>
    </FormContainer>
  );
}
```

### Accordion/Collapsible
```tsx
function Accordion() {
  const [openIndex, setOpenIndex] = createSignal<number | null>(null);
  
  return (
    <For each={items()}>
      {(item, i) => (
        <AccordionItem layout>
          <h4 onClick={() => setOpenIndex(i())}>{item.title}</h4>
          <Show when={openIndex() === i()}>
            <p>{item.content}</p>
          </Show>
        </AccordionItem>
      )}
    </For>
  );
}
```

### Image Gallery Grid
```tsx
function Gallery() {
  const [columns, setColumns] = createSignal(3);
  
  return (
    <Grid 
      layout
      style={{ 'grid-template-columns': `repeat(${columns()}, 1fr)` }}
    >
      <For each={images()}>
        {image => <GalleryItem layout src={image} />}
      </For>
    </Grid>
  );
}
```

## ⚡ Performance

- **ResizeObserver** - Native browser API, super efficient
- **Spring Physics** - Smooth, natural animations
- **RequestAnimationFrame** - Optimized for 60fps
- **Auto Cleanup** - No memory leaks

## 🆚 vs Framer Motion

| Feature | Framer Motion | solid-styles |
|---------|---------------|--------------|
| Layout animations | ✅ | ✅ |
| Spring physics | ✅ | ✅ |
| CSS-in-JS integration | ❌ (separate) | ✅ Built-in |
| Bundle size | ~32KB | ~4KB (for feature) |
| Framework | React | SolidJS |
| Learning curve | Medium | Low (same API) |

## 📦 Implementation Status

**See FIX_PLAN.md for:**
- Complete implementation code
- Integration with styled components
- Type definitions
- Test plans
- 4-day timeline

## 🎨 API Reference

### Props

**`layout`** (boolean | 'position' | 'size' | 'opacity')
- `true` - Animate all layout changes
- `'position'` - Only animate x/y position
- `'size'` - Only animate width/height
- `'opacity'` - Only animate opacity

**`layoutTransition`** (object, optional)
```typescript
{
  type?: 'spring' | 'tween';  // Animation type
  stiffness?: number;          // Spring stiffness (default: 170)
  damping?: number;            // Spring damping (default: 26)
  precision?: number;          // Settle threshold (default: 0.01)
  duration?: number;           // For tween animations (ms)
}
```

## 💡 Tips

1. **Use `layout` for size changes** - Perfect for show/hide content
2. **Use `layout="position"` for moving elements** - Great for sorting, reordering
3. **Adjust spring config for feel**:
   - Higher stiffness = faster, snappier
   - Higher damping = less bouncy, more controlled
   - Lower precision = settles faster (less smooth)

## 🚀 Coming in v1.5.0

After the 3 bug fixes are complete!
