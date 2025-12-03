# Unmount Animation Status - v2.3.3

## Current State: NOT IMPLEMENTED

### What Exists
1. **Trigger type defined:** `when: "unmount"` is a valid trigger type in `AnimationTrigger` enum
2. **Hook exists:** `useUnmountAnimation()` hook in `useAnimation.ts` (lines 220-242)
3. **Trigger handler:** Returns `() => false` in `useTriggers.ts` (lines 430-433)

### What's Missing
1. **No automatic unmount animations:** Components using `animate={{ when: "unmount" }}` don't animate on unmount
2. **Hook not integrated:** `useUnmountAnimation` exists but isn't used by the main animation system
3. **SolidJS limitation:** SolidJS removes DOM nodes immediately when conditions become false, making exit animations challenging

### Why It's Hard
SolidJS's reactivity model removes DOM nodes immediately when their condition becomes false (e.g., `<Show when={false}>`). This is different from React where you can delay unmount to complete exit animations.

### Workarounds
1. **Manual delay:** Users can manually delay removing the component:
```tsx
const [show, setShow] = createSignal(true);
const [animateOut, setAnimateOut] = createSignal(false);

const handleClose = () => {
  setAnimateOut(true);
  setTimeout(() => setShow(false), 300); // Delay removal
};

<Show when={show()}>
  <Modal
    animate={{
      from: { opacity: 0 },
      to: { opacity: animateOut() ? 0 : 1 }
    }}
  />
</Show>
```

2. **Use onCleanup:** Call animation manually in onCleanup:
```tsx
onCleanup(() => {
  // Trigger exit animation
  controls.start({ opacity: 0 });
  // Wait for animation, then unmount
});
```

### Future Implementation
To properly implement unmount animations, we would need:

1. **Portal-based approach:** Keep component in DOM during exit animation even when condition is false
2. **Animation state tracking:** Track "animating out" state separately from "should render"
3. **Lifecycle coordination:** Coordinate with SolidJS lifecycle to delay actual DOM removal

This is a **complex feature** that requires architectural changes and is **out of scope** for the current bug fix audit.

## Recommendation
- **Document limitation** in README
- **Provide workaround examples** for users who need exit animations
- **Plan for future version** (v3.0?) with proper unmount animation support

## Tests
No tests currently exist for unmount animations because the feature is not implemented.

## Priority
**P2 - Enhancement** (not a bug, feature gap)
