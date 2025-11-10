/**
 * Comprehensive Manual Test for Animation Events and Spring Physics
 * 
 * This interactive test page allows you to manually verify:
 * 1. All animation triggers (hover, click, focus, mount, inView) work correctly
 * 2. Spring physics are applied with smooth animations (not instant)
 * 3. Style changes occur correctly with proper transforms
 * 4. Color animations work smoothly
 * 5. Multiple simultaneous transforms work correctly
 * 6. Event handlers are properly attached and cleaned up
 */

import { render } from "solid-js/web";
import { createSignal, For, Show } from "solid-js";
import { animated } from "../animation/animatedStyled";

function App() {
  const [hoverPassed, setHoverPassed] = createSignal(false);
  const [clickPassed, setClickPassed] = createSignal(false);
  const [focusPassed, setFocusPassed] = createSignal(false);
  const [mountPassed, setMountPassed] = createSignal(false);
  const [inViewPassed, setInViewPassed] = createSignal(false);

  return (
    <div>
      <h1>Animation Events & Spring Physics Test Suite</h1>
      <p class="description">
        This page tests all animation features with real browser interactions. 
        Interact with each element to verify animations work correctly with smooth spring physics.
      </p>

      <div class="instructions">
        <h3>✅ Testing Instructions</h3>
        <ol>
          <li><strong>Hover Tests:</strong> Move your mouse over the hover test elements and watch for smooth scaling/color changes</li>
          <li><strong>Click Tests:</strong> Click the click test buttons and verify they toggle states with spring animations</li>
          <li><strong>Focus Tests:</strong> Tab to or click on the input field and watch it animate smoothly</li>
          <li><strong>Mount Tests:</strong> The mount animations should have played when the page loaded</li>
          <li><strong>InView Tests:</strong> Scroll down to the bottom section and watch elements animate in</li>
          <li><strong>Verify Spring Physics:</strong> All animations should be smooth and springy, not instant!</li>
        </ol>
      </div>

      {/* Section 1: Hover Animations */}
      <div class="test-section">
        <h2>1. Hover Animations</h2>
        <div class="test-grid">
          <HoverScaleTest />
          <HoverMultiPropertyTest />
          <HoverColorTest />
          <HoverComplexTransformTest />
        </div>
      </div>

      {/* Section 2: Click Animations */}
      <div class="test-section">
        <h2>2. Click Animations</h2>
        <div class="test-grid">
          <ClickToggleTest />
          <ClickRotateTest />
          <ClickColorTest />
          <ClickMultiTransformTest />
        </div>
      </div>

      {/* Section 3: Focus Animations */}
      <div class="test-section">
        <h2>3. Focus Animations</h2>
        <div class="test-grid">
          <FocusInputTest />
          <FocusScaleTest />
          <FocusColorTest />
        </div>
      </div>

      {/* Section 4: Mount Animations */}
      <div class="test-section">
        <h2>4. Mount Animations</h2>
        <p style={{ color: "#94a3b8", "margin-bottom": "20px" }}>
          These elements should have animated in when the page loaded.
        </p>
        <div class="test-grid">
          <MountFadeInTest />
          <MountSlideInTest />
          <MountScaleInTest />
        </div>
      </div>

      {/* Section 5: Spring Physics Verification */}
      <div class="test-section">
        <h2>5. Spring Physics Verification</h2>
        <p style={{ color: "#94a3b8", "margin-bottom": "20px" }}>
          These tests specifically verify spring physics are applied, not instant transitions.
        </p>
        <div class="test-grid">
          <SpringStiffnessTest />
          <SpringDampingTest />
          <SpringBounceTest />
        </div>
      </div>

      {/* Spacer for scroll testing */}
      <div class="spacer" />

      {/* Section 6: InView Animations (requires scrolling) */}
      <div class="test-section">
        <h2>6. InView Animations (Scroll Test)</h2>
        <p style={{ color: "#94a3b8", "margin-bottom": "20px" }}>
          These elements should animate when they scroll into view.
        </p>
        <div class="test-grid">
          <InViewFadeTest />
          <InViewSlideTest />
          <InViewScaleTest />
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Hover Animation Tests
// =====================================================================

function HoverScaleTest() {
  const AnimatedDiv = animated("div");
  
  return (
    <div class="test-item">
      <AnimatedDiv
        data-test-id="hover-scale"
        animate={{
          from: { scale: 1 },
          to: { scale: 1.2 },
          when: "hover",
          reverseOnExit: true,
          config: {
            stiffness: 170,
            damping: 22,
          },
        }}
        style={{
          width: "100px",
          height: "100px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          "border-radius": "12px",
          margin: "0 auto",
        }}
      />
      <span class="test-label">Hover: Scale Animation</span>
      <span class="status pending">Hover to test</span>
    </div>
  );
}

function HoverMultiPropertyTest() {
  const AnimatedDiv = animated("div");
  
  return (
    <div class="test-item">
      <AnimatedDiv
        data-test-id="hover-multi"
        animate={{
          from: { opacity: 0.6, scale: 1, x: 0 },
          to: { opacity: 1, scale: 1.15, x: 10 },
          when: "hover",
          reverseOnExit: true,
          config: {
            stiffness: 150,
            damping: 20,
          },
        }}
        style={{
          width: "100px",
          height: "100px",
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          "border-radius": "12px",
          margin: "0 auto",
        }}
      />
      <span class="test-label">Hover: Multi-Property</span>
      <span class="status pending">Hover to test</span>
    </div>
  );
}

function HoverColorTest() {
  const AnimatedDiv = animated("div");
  
  return (
    <div class="test-item">
      <AnimatedDiv
        data-test-id="hover-color"
        animate={{
          from: { backgroundColor: "#ef4444" },
          to: { backgroundColor: "#3b82f6" },
          when: "hover",
          reverseOnExit: true,
          config: {
            stiffness: 170,
            damping: 22,
          },
        }}
        style={{
          width: "100px",
          height: "100px",
          "border-radius": "12px",
          margin: "0 auto",
        }}
      />
      <span class="test-label">Hover: Color Animation</span>
      <span class="status pending">Hover to test</span>
    </div>
  );
}

function HoverComplexTransformTest() {
  const AnimatedDiv = animated("div");
  
  return (
    <div class="test-item">
      <AnimatedDiv
        data-test-id="hover-complex"
        animate={{
          from: { x: 0, y: 0, scale: 1, rotate: 0 },
          to: { x: 10, y: -10, scale: 1.1, rotate: 5 },
          when: "hover",
          reverseOnExit: true,
          config: {
            stiffness: 170,
            damping: 22,
          },
        }}
        style={{
          width: "100px",
          height: "100px",
          background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
          "border-radius": "12px",
          margin: "0 auto",
        }}
      />
      <span class="test-label">Hover: Complex Transform</span>
      <span class="status pending">Hover to test</span>
    </div>
  );
}

// =====================================================================
// Click Animation Tests
// =====================================================================

function ClickToggleTest() {
  const AnimatedButton = animated("button");
  
  return (
    <div class="test-item">
      <AnimatedButton
        data-test-id="click-toggle"
        animate={{
          from: { scale: 1, backgroundColor: "#3b82f6" },
          to: { scale: 1.3, backgroundColor: "#ef4444" },
          when: "click",
          reverseOnExit: true,
          config: {
            stiffness: 170,
            damping: 22,
          },
        }}
        style={{
          width: "120px",
          height: "50px",
          "border-radius": "8px",
          color: "white",
          margin: "0 auto",
          display: "block",
        }}
      >
        Click Me
      </AnimatedButton>
      <span class="test-label">Click: Toggle Animation</span>
      <span class="status pending">Click to test</span>
    </div>
  );
}

function ClickRotateTest() {
  const AnimatedDiv = animated("div");
  
  return (
    <div class="test-item">
      <AnimatedDiv
        data-test-id="click-rotate"
        animate={{
          from: { rotate: 0 },
          to: { rotate: 180 },
          when: "click",
          reverseOnExit: true,
          config: {
            stiffness: 150,
            damping: 20,
          },
        }}
        style={{
          width: "80px",
          height: "80px",
          background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
          "border-radius": "12px",
          margin: "0 auto",
          cursor: "pointer",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "font-size": "2rem",
        }}
      >
        ↻
      </AnimatedDiv>
      <span class="test-label">Click: Rotation</span>
      <span class="status pending">Click to test</span>
    </div>
  );
}

function ClickColorTest() {
  const AnimatedDiv = animated("div");
  
  return (
    <div class="test-item">
      <AnimatedDiv
        data-test-id="click-color"
        animate={{
          from: { backgroundColor: "#10b981" },
          to: { backgroundColor: "#f59e0b" },
          when: "click",
          reverseOnExit: true,
          config: {
            stiffness: 170,
            damping: 22,
          },
        }}
        style={{
          width: "100px",
          height: "100px",
          "border-radius": "50%",
          margin: "0 auto",
          cursor: "pointer",
        }}
      />
      <span class="test-label">Click: Color Toggle</span>
      <span class="status pending">Click to test</span>
    </div>
  );
}

function ClickMultiTransformTest() {
  const AnimatedDiv = animated("div");
  
  return (
    <div class="test-item">
      <AnimatedDiv
        data-test-id="click-multi"
        animate={{
          from: { scale: 1, rotate: 0, x: 0 },
          to: { scale: 1.4, rotate: 45, x: 15 },
          when: "click",
          reverseOnExit: true,
          config: {
            stiffness: 170,
            damping: 22,
          },
        }}
        style={{
          width: "80px",
          height: "80px",
          background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
          "border-radius": "12px",
          margin: "0 auto",
          cursor: "pointer",
        }}
      />
      <span class="test-label">Click: Multi Transform</span>
      <span class="status pending">Click to test</span>
    </div>
  );
}

// =====================================================================
// Focus Animation Tests
// =====================================================================

function FocusInputTest() {
  const AnimatedInput = animated("input");
  
  return (
    <div class="test-item">
      <AnimatedInput
        data-test-id="focus-input"
        type="text"
        placeholder="Focus me..."
        animate={{
          from: { scale: 1, borderColor: "#475569" },
          to: { scale: 1.05, borderColor: "#3b82f6" },
          when: "focus",
          reverseOnExit: true,
          config: {
            stiffness: 170,
            damping: 22,
          },
        }}
        style={{
          width: "100%",
          padding: "12px",
          "border-radius": "8px",
          background: "#1e293b",
          color: "#e2e8f0",
          border: "2px solid #475569",
        }}
      />
      <span class="test-label">Focus: Input Scale</span>
      <span class="status pending">Focus to test</span>
    </div>
  );
}

function FocusScaleTest() {
  const AnimatedDiv = animated("div");
  
  return (
    <div class="test-item">
      <AnimatedDiv
        data-test-id="focus-scale"
        tabIndex={0}
        animate={{
          from: { scale: 1, opacity: 0.8 },
          to: { scale: 1.1, opacity: 1 },
          when: "focus",
          reverseOnExit: true,
          config: {
            stiffness: 170,
            damping: 22,
          },
        }}
        style={{
          width: "100px",
          height: "100px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          "border-radius": "12px",
          margin: "0 auto",
          cursor: "pointer",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          color: "white",
        }}
      >
        TAB
      </AnimatedDiv>
      <span class="test-label">Focus: Scale Animation</span>
      <span class="status pending">Tab to focus</span>
    </div>
  );
}

function FocusColorTest() {
  const AnimatedButton = animated("button");
  
  return (
    <div class="test-item">
      <AnimatedButton
        data-test-id="focus-color"
        animate={{
          from: { backgroundColor: "#6366f1" },
          to: { backgroundColor: "#ec4899" },
          when: "focus",
          reverseOnExit: true,
          config: {
            stiffness: 170,
            damping: 22,
          },
        }}
        style={{
          width: "120px",
          height: "50px",
          "border-radius": "8px",
          color: "white",
          margin: "0 auto",
          display: "block",
          cursor: "pointer",
        }}
      >
        Focus Me
      </AnimatedButton>
      <span class="test-label">Focus: Color Change</span>
      <span class="status pending">Click/Tab to focus</span>
    </div>
  );
}

// =====================================================================
// Mount Animation Tests
// =====================================================================

function MountFadeInTest() {
  const AnimatedDiv = animated("div");
  
  return (
    <div class="test-item">
      <AnimatedDiv
        data-test-id="mount-fade"
        animate={{
          from: { opacity: 0 },
          to: { opacity: 1 },
          when: "mount",
          config: {
            stiffness: 170,
            damping: 22,
          },
        }}
        style={{
          width: "100px",
          height: "100px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          "border-radius": "12px",
          margin: "0 auto",
        }}
      />
      <span class="test-label">Mount: Fade In</span>
      <span class="status pass">Animated on load</span>
    </div>
  );
}

function MountSlideInTest() {
  const AnimatedDiv = animated("div");
  
  return (
    <div class="test-item">
      <AnimatedDiv
        data-test-id="mount-slide"
        animate={{
          from: { opacity: 0, y: -30 },
          to: { opacity: 1, y: 0 },
          when: "mount",
          config: {
            stiffness: 170,
            damping: 22,
          },
        }}
        style={{
          width: "100px",
          height: "100px",
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          "border-radius": "12px",
          margin: "0 auto",
        }}
      />
      <span class="test-label">Mount: Slide In</span>
      <span class="status pass">Animated on load</span>
    </div>
  );
}

function MountScaleInTest() {
  const AnimatedDiv = animated("div");
  
  return (
    <div class="test-item">
      <AnimatedDiv
        data-test-id="mount-scale"
        animate={{
          from: { opacity: 0, scale: 0.5 },
          to: { opacity: 1, scale: 1 },
          when: "mount",
          config: {
            stiffness: 170,
            damping: 22,
          },
        }}
        style={{
          width: "100px",
          height: "100px",
          background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
          "border-radius": "12px",
          margin: "0 auto",
        }}
      />
      <span class="test-label">Mount: Scale In</span>
      <span class="status pass">Animated on load</span>
    </div>
  );
}

// =====================================================================
// Spring Physics Verification Tests
// =====================================================================

function SpringStiffnessTest() {
  const AnimatedDiv = animated("div");
  
  return (
    <div class="test-item">
      <AnimatedDiv
        data-test-id="spring-stiff"
        animate={{
          from: { scale: 1 },
          to: { scale: 1.3 },
          when: "hover",
          reverseOnExit: true,
          config: {
            stiffness: 300, // High stiffness = faster
            damping: 30,
          },
        }}
        style={{
          width: "100px",
          height: "100px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          "border-radius": "12px",
          margin: "0 auto",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          color: "white",
          "font-size": "0.75rem",
          "text-align": "center",
        }}
      >
        High<br/>Stiffness
      </AnimatedDiv>
      <span class="test-label">Fast Spring (300)</span>
      <span class="status pending">Hover to test</span>
    </div>
  );
}

function SpringDampingTest() {
  const AnimatedDiv = animated("div");
  
  return (
    <div class="test-item">
      <AnimatedDiv
        data-test-id="spring-damp"
        animate={{
          from: { scale: 1 },
          to: { scale: 1.3 },
          when: "hover",
          reverseOnExit: true,
          config: {
            stiffness: 170,
            damping: 10, // Low damping = more oscillation
          },
        }}
        style={{
          width: "100px",
          height: "100px",
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          "border-radius": "12px",
          margin: "0 auto",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          color: "white",
          "font-size": "0.75rem",
          "text-align": "center",
        }}
      >
        Low<br/>Damping
      </AnimatedDiv>
      <span class="test-label">Bouncy Spring (10)</span>
      <span class="status pending">Hover to test</span>
    </div>
  );
}

function SpringBounceTest() {
  const AnimatedDiv = animated("div");
  
  return (
    <div class="test-item">
      <AnimatedDiv
        data-test-id="spring-bounce"
        animate={{
          from: { y: 0 },
          to: { y: -30 },
          when: "hover",
          reverseOnExit: true,
          config: {
            stiffness: 500,  // Very high stiffness
            damping: 8,      // Very low damping
          },
        }}
        style={{
          width: "100px",
          height: "100px",
          background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
          "border-radius": "12px",
          margin: "0 auto",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "font-size": "2rem",
        }}
      >
        🎾
      </AnimatedDiv>
      <span class="test-label">Bounce Effect</span>
      <span class="status pending">Hover to test</span>
    </div>
  );
}

// =====================================================================
// InView Animation Tests
// =====================================================================

function InViewFadeTest() {
  const AnimatedDiv = animated("div");
  
  return (
    <div class="test-item">
      <AnimatedDiv
        data-test-id="inview-fade"
        animate={{
          from: { opacity: 0 },
          to: { opacity: 1 },
          when: "inView",
          inViewOptions: {
            threshold: 0.3,
          },
          config: {
            stiffness: 170,
            damping: 22,
          },
        }}
        style={{
          width: "100px",
          height: "100px",
          background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
          "border-radius": "12px",
          margin: "0 auto",
        }}
      />
      <span class="test-label">InView: Fade In</span>
      <span class="status pending">Scroll to view</span>
    </div>
  );
}

function InViewSlideTest() {
  const AnimatedDiv = animated("div");
  
  return (
    <div class="test-item">
      <AnimatedDiv
        data-test-id="inview-slide"
        animate={{
          from: { opacity: 0, y: 50 },
          to: { opacity: 1, y: 0 },
          when: "inView",
          inViewOptions: {
            threshold: 0.3,
          },
          config: {
            stiffness: 170,
            damping: 22,
          },
        }}
        style={{
          width: "100px",
          height: "100px",
          background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
          "border-radius": "12px",
          margin: "0 auto",
        }}
      />
      <span class="test-label">InView: Slide Up</span>
      <span class="status pending">Scroll to view</span>
    </div>
  );
}

function InViewScaleTest() {
  const AnimatedDiv = animated("div");
  
  return (
    <div class="test-item">
      <AnimatedDiv
        data-test-id="inview-scale"
        animate={{
          from: { opacity: 0, scale: 0.5 },
          to: { opacity: 1, scale: 1 },
          when: "inView",
          inViewOptions: {
            threshold: 0.3,
          },
          config: {
            stiffness: 170,
            damping: 22,
          },
        }}
        style={{
          width: "100px",
          height: "100px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          "border-radius": "12px",
          margin: "0 auto",
        }}
      />
      <span class="test-label">InView: Scale In</span>
      <span class="status pending">Scroll to view</span>
    </div>
  );
}

// Render the app
render(() => <App />, document.getElementById("root")!);
