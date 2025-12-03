# SpaceX-Style First Principles Bug Hunt

## Methodology
Work from physics → core → bridge → API → user, verifying contracts at each layer.

## Layer 1: Physics Engine (spring.ts)
**Contract:** Expects normalized values (0-1 scale)

### Questions to Answer:
- [ ] What scale does tick_spring actually expect?
- [ ] Are default values consistent across all code paths?
- [ ] Do gradient animations use same scale as regular animations?
- [ ] Are color animations normalized the same way?
- [ ] Is transform string parsing consistent?

## Layer 2: Spring Bridge (spring-bridge.ts)
**Contract:** Normalizes user values to physics engine scale

### Questions to Answer:
- [ ] Does normalizeSpringParams normalize ALL options paths?
- [ ] What happens if user passes already-normalized values?
- [ ] Does .start() method honor the contract?
- [ ] Does .set() method need normalization?
- [ ] Are callbacks (onStart, onComplete) affected by normalization timing?

## Layer 3: Animation System (animatedStyled.tsx, useAnimation.ts)
**Contract:** Manages animation lifecycle and triggers

### Questions to Answer:
- [ ] Do ALL trigger types go through same code path?
- [ ] Are there any shortcuts that bypass normalization?
- [ ] Does each trigger create its own animation or share one?
- [ ] What happens when multiple animations target same element?
- [ ] Are cleanup paths symmetric with creation paths?

## Layer 4: User API (props, config)
**Contract:** User-friendly high-level values (150, 26, etc)

### Questions to Answer:
- [ ] Can user pass both high AND low values in same app?
- [ ] What if user reads current spring value and uses it as new target?
- [ ] Does duration conversion produce reasonable stiffness/damping?
- [ ] Are there edge cases in prop transformation (whileHover, etc)?

---

## Critical Path Analysis

### Path 1: Mount Animation
```
User: animate={{ from: {y: 0}, to: {y: 100}, when: 'mount', config: {stiffness: 150} }}
  ↓
transformAnimationProps → AnimateConfig
  ↓
useAnimation({ from, to, when: isManualMounted })
  ↓
createAnimation(from, to, options)
  ↓
normalizeSpringParams(options) → stiffness: 0.15
  ↓
createSpring(from, { stiffness: 0.15 })
  ↓
tick_spring uses 0.15 in physics
```

**Verification Needed:**
- [ ] Is isManualMounted set to true synchronously on mount?
- [ ] Does element start at 'from' values or flash 'to' first?
- [ ] Does animation complete or hang infinitely?

### Path 2: Hover Animation (Reactive)
```
User: whileHover={{ scale: 1.1 }}, transition={{ stiffness: 200 }}
  ↓
transformAnimationProps → { from: {scale: 1}, to: {scale: 1.1}, when: 'hover', config: {stiffness: 200} }
  ↓
useAnimation with trigger = isManualHovered signal
  ↓
createAnimation → normalizes to 0.2
  ↓
mouseenter → setManualHovered(true)
  ↓
createEffect detects change → calls result.controls.start(to)
  ↓
start() uses already-normalized config from creation
```

**Verification Needed:**
- [ ] Does reactive path work without direct handlers?
- [ ] Is signal update synchronous or batched?
- [ ] Does hover work without data-testid?

### Path 3: Hover Animation (Direct Handler)
```
mouseenter event
  ↓
setupDirectEventHandlers → handleDirectMouseEnter
  ↓
animationRegistry.forEach → find hover animations
  ↓
animation.controls.start(to, { stiffness: 150 })
  ↓
normalize in handler → stiffness: 0.15
  ↓
setSpringValue(to, { stiffness: 0.15 })
```

**Verification Needed:**
- [ ] Why do we have BOTH reactive AND direct paths?
- [ ] Do they conflict or complement?
- [ ] Which one wins if both trigger?

---

## Potential Bugs by Category

### Category 1: Normalization Inconsistencies
- [ ] Check if .set() method needs normalization
- [ ] Check if .pause()/.resume() preserve normalized values
- [ ] Check if .reverse() creates new normalized values or reuses
- [ ] Check keyframe animations for normalization
- [ ] Check if springPresets use correct scale

### Category 2: Lifecycle Issues
- [ ] Are event listeners cleaned up on unmount?
- [ ] Do animations continue after component unmounts?
- [ ] What happens if element removed from DOM during animation?
- [ ] Are there any setInterval/setTimeout that aren't cleared?
- [ ] Does setupDirectEventHandlers get called multiple times?

### Category 3: Race Conditions
- [ ] What if hover triggers before mount animation completes?
- [ ] What if user hovers rapidly (mouseenter/leave spam)?
- [ ] What if .start() called while previous animation running?
- [ ] Are signal updates batched correctly?
- [ ] Can createEffect run after cleanup?

### Category 4: Edge Cases
- [ ] What if stiffness=0? (no spring)
- [ ] What if damping=0? (infinite oscillation)
- [ ] What if stiffness > 1000? (validation bounds)
- [ ] What if negative values?
- [ ] What if NaN or Infinity?

### Category 5: Transform Bugs
- [ ] Do transforms compound when multiple animations active?
- [ ] Is transform order consistent (translate, scale, rotate)?
- [ ] Are units preserved (px, deg, %, etc)?
- [ ] What happens with matrix() transforms?
- [ ] Are 3D transforms handled (translateZ, rotateX, etc)?

### Category 6: Color Animation
- [ ] Do hex colors normalize correctly?
- [ ] Do rgba values interpolate in right color space?
- [ ] Are gradients animated stop-by-stop?
- [ ] What if gradient has different number of stops?
- [ ] Do named colors work?

### Category 7: Multiple Animations
- [ ] What if element has both whileHover AND animate={{ when: 'hover' }}?
- [ ] What if element has mount AND hover animations?
- [ ] Do animations merge or override each other?
- [ ] Which config wins if multiple animations have different stiffness?

### Category 8: Performance
- [ ] Are animations pooled/reused or created fresh each time?
- [ ] Are event listeners duplicated?
- [ ] Is animationRegistry ever pruned?
- [ ] Are there memory leaks in triggerRegistry?
- [ ] Does rapid hover cause GC pressure?

---

## Test Plan

For EACH critical path:
1. Trace code execution line-by-line
2. Verify contracts at each boundary
3. Check error handling
4. Test edge cases
5. Verify cleanup

Next: Start with Layer 1 (physics engine) and verify actual scale expected.
