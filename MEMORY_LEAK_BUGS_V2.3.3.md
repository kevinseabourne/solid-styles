# Memory Leak Bugs - v2.3.3

## Critical Memory Leaks Found

### 1. Focus Event Handlers Not Cleaned Up
**Location:** `animation/animatedStyled.tsx` lines 2080-2089

**Problem:**
```typescript
if (triggerType === "focus" || (Array.isArray(triggerType) && triggerType.includes("focus"))) {
  // Focus/blur event monitoring - spring system will handle the animation
  element.addEventListener("focus", () => {
    setManualFocused(true);
  });

  element.addEventListener("blur", () => {
    setManualFocused(false);
  });
}
```

**Issue:** Event listeners are added inside `createEffect` but never removed with `onCleanup`. Every time the effect re-runs or the component unmounts, these listeners remain attached, causing memory leaks.

**Impact:** HIGH - Memory leaks on every component with focus animations

**Fix:** Store handler references and add `onCleanup`:
```typescript
if (triggerType === "focus" || (Array.isArray(triggerType) && triggerType.includes("focus"))) {
  const handleFocus = () => setManualFocused(true);
  const handleBlur = () => setManualFocused(false);
  
  element.addEventListener("focus", handleFocus);
  element.addEventListener("blur", handleBlur);
  
  onCleanup(() => {
    element.removeEventListener("focus", handleFocus);
    element.removeEventListener("blur", handleBlur);
  });
}
```

---

### 2. Click Outside Handler Memory Leak
**Location:** `animation/animatedStyled.tsx` lines 1173-1281

**Problem:**
```typescript
// Inside handler:
if (!el._clickOutsideHandler) {
  el._clickOutsideHandler = (outsideEvent: MouseEvent) => {
    // ...handler logic...
    // Tries to remove itself INSIDE the handler
    document.removeEventListener("click", (el as any)._clickOutsideHandler); // Line 1192
  };

  // Add handler with delay
  setTimeout(() => {
    document.addEventListener("click", (el as any)._clickOutsideHandler); // Line 1279
  }, 10);
}
```

**Issue:** 
1. Handler tries to remove itself at line 1192, but it's added LATER at line 1279
2. Removal happens inside the handler, which may not execute if component unmounts
3. No guaranteed cleanup path

**Impact:** MEDIUM - Document-level listeners accumulate over time

**Fix:** Track handler in cleanup function and ensure removal:
```typescript
// Store handler reference
const clickOutsideHandler = (outsideEvent: MouseEvent) => {
  // ... handler logic ...
  cleanupClickOutside();
};

const cleanupClickOutside = () => {
  if (clickOutsideHandler) {
    document.removeEventListener("click", clickOutsideHandler);
  }
};

// Add with delay
setTimeout(() => {
  document.addEventListener("click", clickOutsideHandler);
}, 10);

// Return cleanup in the main handler setup
return () => {
  // ... existing cleanup ...
  cleanupClickOutside();
};
```

---

## Status Summary

### ✅ Fixed in useTriggers.ts
- Hover: cleanup OK
- Focus: cleanup OK
- Click: cleanup OK (including document listener)
- Active: cleanup OK (including window listeners)
- InView: cleanup OK (observer disconnected)

### ❌ Bugs in animatedStyled.tsx
- Focus handlers: NO CLEANUP
- Click outside handler: UNRELIABLE CLEANUP

---

## Priority
- **P0:** Focus event handler leak (affects all focus animations)
- **P1:** Click outside handler leak (affects click animations with outside handling)

## Next Steps
1. Fix focus event handler cleanup
2. Fix click outside handler cleanup
3. Test with Chrome DevTools Memory Profiler
4. Add memory leak regression tests
