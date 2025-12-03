# Delay Parameter Bug - v2.3.3

## Status: NOT IMPLEMENTED

### Problem
The `delay` parameter is defined in animation configuration interfaces but is **not implemented** in the animation system.

### What's Defined
1. **AnimateConfig interface** (animatedStyled.tsx line 149):
```typescript
config?: {
  delay?: number; // Animation delay in ms
}
```

2. **AnimationConfig interface** (spring-bridge.ts line 164):
```typescript
delay?: number; // Delay before animation starts (in ms)
```

3. **AnimationConfig interface** (useAnimation.ts line 43):
```typescript
delay?: number; // Delay before starting the animation (in ms)
```

### What's Missing
The `delay` value is:
- ✅ Extracted in `useAnimation.ts` (line 103)
- ✅ Passed to `createAnimation` (line 109)
- ✅ Passed through `normalizeSpringParams` (line 607 in spring-bridge.ts)
- ❌ **NEVER USED** - No `setTimeout` or delay logic exists

### Current Behavior
```tsx
<Box
  animate={{
    from: { opacity: 0 },
    to: { opacity: 1 },
    delay: 1000  // This is IGNORED!
  }}
/>
```
The box animates immediately, ignoring the 1000ms delay.

### Expected Behavior
Animation should wait 1000ms before starting.

### Implementation Needed
In `spring-bridge.ts`, the `start` function (line 666) should:

```typescript
const start = (target: WidenSpringTarget<T> = processedTarget, springOpts: AnimationOptions = {}) => {
  const processedStart = deepProcessColorValues(target);
  
  // CRITICAL FIX: Handle delay
  const delayMs = springOpts.delay || options.delay || 0;
  
  const startAnimation = () => {
    try {
      // ... existing animation start logic ...
      setSpringValue(processedStart as any, animationConfig).catch((err) => {
        options.onError?.(err);
      });
    } catch (e) {
      console.error("[ANIM-ERROR] Failed to start animation:", e);
    }
  };
  
  if (delayMs > 0) {
    setState("pending"); // Optional: new state for delayed animations
    setTimeout(() => {
      if (state() === "pending") { // Only start if not cancelled
        startAnimation();
      }
    }, delayMs);
  } else {
    startAnimation();
  }
  
  return controls;
};
```

### Test Case Needed
```tsx
it('should delay animation start by specified milliseconds', async () => {
  const AnimatedDiv = animated("div");
  
  render(() => (
    <AnimatedDiv
      data-testid="delayed"
      animate={{
        from: { opacity: 0 },
        to: { opacity: 1 },
        delay: 500,
      }}
    >
      Delayed
    </AnimatedDiv>
  ));
  
  const element = screen.getByTestId("delayed");
  
  // Should NOT be animating immediately
  await waitFor(() => {
    expect(window.getComputedStyle(element).opacity).toBe("0");
  }, { timeout: 100 });
  
  // After delay, should start animating
  await waitFor(() => {
    const opacity = parseFloat(window.getComputedStyle(element).opacity);
    expect(opacity).toBeGreaterThan(0);
  }, { timeout: 700 });
});
```

### Impact
**MEDIUM** - Feature advertised in interface but doesn't work. Users expecting delays will be confused.

### Workaround
Users can manually delay using setTimeout:
```tsx
const [shouldAnimate, setShouldAnimate] = createSignal(false);

onMount(() => {
  setTimeout(() => setShouldAnimate(true), 1000);
});

<Box animate={{ from: ..., to: ..., when: shouldAnimate }} />
```

### Priority
**P1** - Missing documented feature

### Related
- Stagger animations use `useStagger` hook which implements delays correctly
- This suggests delay WAS intended to be implemented but was never finished
