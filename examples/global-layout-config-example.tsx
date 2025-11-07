/**
 * Global Layout Transition Configuration Example
 * 
 * Shows how to set global spring settings for all layout animations in your app
 */

import { render } from 'solid-js/web';
import { createSignal } from 'solid-js';
import { LayoutAnimated, LayoutTransitionProvider } from '../animation';
import { styled } from '../src/index';

// Styled components for the example
const Card = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const Button = styled.button`
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin: 5px;
  
  &:hover {
    background: #5568d3;
  }
`;

// Example 1: Cards using global config
function Card1() {
  const [expanded, setExpanded] = createSignal(false);
  
  return (
    <LayoutAnimated as={Card} layout>
      <h3>Card 1 - Uses Global Config</h3>
      <Button onClick={() => setExpanded(!expanded())}>
        {expanded() ? 'Collapse' : 'Expand'}
      </Button>
      {expanded() && (
        <p>This uses the global spring settings (stiffness: 400, damping: 30)</p>
      )}
    </LayoutAnimated>
  );
}

function Card2() {
  const [expanded, setExpanded] = createSignal(false);
  
  return (
    <LayoutAnimated as={Card} layout>
      <h3>Card 2 - Also Uses Global Config</h3>
      <Button onClick={() => setExpanded(!expanded())}>
        {expanded() ? 'Collapse' : 'Expand'}
      </Button>
      {expanded() && (
        <p>This also uses the same global spring settings automatically!</p>
      )}
    </LayoutAnimated>
  );
}

// Example 2: Card overriding global config
function Card3() {
  const [expanded, setExpanded] = createSignal(false);
  
  return (
    <LayoutAnimated 
      as={Card} 
      layout 
      layoutTransition={{ stiffness: 200, damping: 10 }}  // Override global
    >
      <h3>Card 3 - Overrides Global (Bouncy)</h3>
      <Button onClick={() => setExpanded(!expanded())}>
        {expanded() ? 'Collapse' : 'Expand'}
      </Button>
      {expanded() && (
        <p>This overrides the global config to be more bouncy! 🎾</p>
      )}
    </LayoutAnimated>
  );
}

// Example 3: Complete app with global config
function App() {
  return (
    <div style={{ padding: '20px', 'max-width': '800px', margin: '0 auto' }}>
      <h1>Global Layout Transition Config Example</h1>
      <p>
        All cards below use the global spring settings (stiffness: 400, damping: 30)
        except Card 3 which overrides it.
      </p>
      
      <Card1 />
      <Card2 />
      <Card3 />
    </div>
  );
}

// Example 4: Render with global provider
export function renderAppWithGlobalConfig() {
  render(
    () => (
      <LayoutTransitionProvider config={{ stiffness: 400, damping: 30 }}>
        <App />
      </LayoutTransitionProvider>
    ),
    document.getElementById('root')!
  );
}

// ============================================================================
// REAL-WORLD USAGE EXAMPLE
// ============================================================================

/**
 * In your actual app, wrap your root component with LayoutTransitionProvider:
 */

// index.tsx
/*
import { render } from 'solid-js/web';
import { LayoutTransitionProvider } from 'solid-styles/animation';
import App from './App';

render(
  () => (
    <LayoutTransitionProvider 
      config={{ 
        stiffness: 400,      // Your preferred spring settings
        damping: 30,
        precision: 0.01
      }}
    >
      <App />
    </LayoutTransitionProvider>
  ),
  document.getElementById('root')!
);
*/

// Now anywhere in your app, just use layout={true}:
/*
function MyComponent() {
  const [expanded, setExpanded] = createSignal(false);
  
  return (
    <LayoutAnimated layout>  {/* Uses global config automatically! */}
      <button onClick={() => setExpanded(!expanded())}>Toggle</button>
      {expanded() && <div>Content</div>}
    </LayoutAnimated>
  );
}
*/

// ============================================================================
// DIFFERENT SPRING PRESETS
// ============================================================================

/**
 * Bouncy animations (like iOS)
 */
export function BouncyApp() {
  return (
    <LayoutTransitionProvider config={{ stiffness: 200, damping: 10 }}>
      <App />
    </LayoutTransitionProvider>
  );
}

/**
 * Smooth, gradual animations
 */
export function SmoothApp() {
  return (
    <LayoutTransitionProvider config={{ stiffness: 100, damping: 40 }}>
      <App />
    </LayoutTransitionProvider>
  );
}

/**
 * Snappy, fast animations
 */
export function SnappyApp() {
  return (
    <LayoutTransitionProvider config={{ stiffness: 500, damping: 35 }}>
      <App />
    </LayoutTransitionProvider>
  );
}

/**
 * Framer Motion default
 */
export function FramerMotionStyleApp() {
  return (
    <LayoutTransitionProvider config={{ stiffness: 300, damping: 30 }}>
      <App />
    </LayoutTransitionProvider>
  );
}

// ============================================================================
// ADVANCED: Different configs for different sections
// ============================================================================

const AdminSection = styled.div`
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
`;

function AdminPanel() {
  const [expanded, setExpanded] = createSignal(false);
  
  return (
    <LayoutAnimated layout>
      <h2>Admin Panel</h2>
      <button onClick={() => setExpanded(!expanded())}>Toggle Settings</button>
      {expanded() && (
        <div>
          <p>Admin settings here...</p>
        </div>
      )}
    </LayoutAnimated>
  );
}

const UserSection = styled.div`
  background: #e3f2fd;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
`;

function UserDashboard() {
  const [expanded, setExpanded] = createSignal(false);
  
  return (
    <LayoutAnimated layout>
      <h2>User Dashboard</h2>
      <button onClick={() => setExpanded(!expanded())}>Toggle Info</button>
      {expanded() && (
        <div>
          <p>User information here...</p>
        </div>
      )}
    </LayoutAnimated>
  );
}

/**
 * Different spring settings for different app sections
 */
export function MultiSectionApp() {
  return (
    <LayoutTransitionProvider config={{ stiffness: 400, damping: 30 }}>
      <div>
        <h1>My App</h1>
        
        {/* Admin section with snappier animations */}
        <LayoutTransitionProvider config={{ stiffness: 500, damping: 35 }}>
          <AdminSection>
            <AdminPanel />
          </AdminSection>
        </LayoutTransitionProvider>
        
        {/* User section with smoother animations */}
        <LayoutTransitionProvider config={{ stiffness: 200, damping: 40 }}>
          <UserSection>
            <UserDashboard />
          </UserSection>
        </LayoutTransitionProvider>
      </div>
    </LayoutTransitionProvider>
  );
}

// ============================================================================
// SUMMARY
// ============================================================================

/**
 * Benefits of Global Config:
 * 
 * 1. ✅ Set once, use everywhere
 * 2. ✅ Consistent animations across your app
 * 3. ✅ Easy to change globally (just modify one place)
 * 4. ✅ Can still override locally when needed
 * 5. ✅ Can nest providers for different sections
 * 6. ✅ No need to repeat layoutTransition={{...}} everywhere
 * 
 * Usage:
 * 
 * // 1. Wrap your app with provider
 * <LayoutTransitionProvider config={{ stiffness: 400, damping: 30 }}>
 *   <App />
 * </LayoutTransitionProvider>
 * 
 * // 2. Use layout animations anywhere (uses global config)
 * <LayoutAnimated layout>
 *   Content
 * </LayoutAnimated>
 * 
 * // 3. Override when needed
 * <LayoutAnimated layout layoutTransition={{ stiffness: 500 }}>
 *   Content
 * </LayoutAnimated>
 */
