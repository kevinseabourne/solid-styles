/**
 * Layout Animation Examples
 * Demonstrates usage of layout animations with layout and layoutTransition props
 */

import { createSignal } from 'solid-js';
import { LayoutAnimated } from '../animation/layout-components';
import { styled } from '../src/index';

// Example 1: Simple expandable card with defaults
export function SimpleExpandableCard() {
  const [expanded, setExpanded] = createSignal(false);
  
  return (
    <LayoutAnimated layout>
      <h2>Card Title</h2>
      <button onClick={() => setExpanded(!expanded())}>
        {expanded() ? 'Show Less' : 'Show More'}
      </button>
      {expanded() && (
        <div>
          <p>This content animates smoothly with default spring settings!</p>
        </div>
      )}
    </LayoutAnimated>
  );
}

// Example 2: Bouncy animation with custom spring settings
export function BouncyCard() {
  const [expanded, setExpanded] = createSignal(false);
  
  return (
    <LayoutAnimated 
      layout 
      layoutTransition={{ 
        stiffness: 200, 
        damping: 10  // Low damping = more bounce!
      }}
    >
      <h2>Bouncy Card</h2>
      <button onClick={() => setExpanded(!expanded())}>
        Toggle
      </button>
      {expanded() && (
        <div>
          <p>Watch this bounce! 🎾</p>
        </div>
      )}
    </LayoutAnimated>
  );
}

// Example 3: Smooth, gradual animation
export function SmoothCard() {
  const [expanded, setExpanded] = createSignal(false);
  
  return (
    <LayoutAnimated 
      layout 
      layoutTransition={{ 
        stiffness: 100, 
        damping: 40  // High damping = smooth, no bounce
      }}
    >
      <h2>Smooth Card</h2>
      <button onClick={() => setExpanded(!expanded())}>
        Toggle
      </button>
      {expanded() && (
        <div>
          <p>Buttery smooth animation</p>
        </div>
      )}
    </LayoutAnimated>
  );
}

// Example 4: Snappy, fast animation
export function SnappyCard() {
  const [expanded, setExpanded] = createSignal(false);
  
  return (
    <LayoutAnimated 
      layout 
      layoutTransition={{ 
        stiffness: 500, 
        damping: 35  // High stiffness = fast and snappy
      }}
    >
      <h2>Snappy Card</h2>
      <button onClick={() => setExpanded(!expanded())}>
        Toggle
      </button>
      {expanded() && (
        <div>
          <p>Quick and responsive!</p>
        </div>
      )}
    </LayoutAnimated>
  );
}

// Example 5: Only animate height, not width
export function HeightOnlyAnimation() {
  const [expanded, setExpanded] = createSignal(false);
  
  return (
    <LayoutAnimated 
      layout 
      layoutTransition={{ 
        stiffness: 400,
        damping: 30,
        animateHeight: true,
        animateWidth: false,
        animatePosition: false
      }}
    >
      <h2>Height Only</h2>
      <button onClick={() => setExpanded(!expanded())}>
        Toggle
      </button>
      {expanded() && (
        <div>
          <p>Only the height animates, width stays fixed</p>
        </div>
      )}
    </LayoutAnimated>
  );
}

// Example 6: With styled components
const StyledCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
`;

export function StyledLayoutCard() {
  const [expanded, setExpanded] = createSignal(false);
  
  return (
    <LayoutAnimated 
      as={StyledCard}
      layout 
      layoutTransition={{ stiffness: 400, damping: 30 }}
    >
      <h2>Styled Card with Layout Animation</h2>
      <button onClick={() => setExpanded(!expanded())}>
        Toggle
      </button>
      {expanded() && (
        <div>
          <p>Layout animations work perfectly with styled components!</p>
        </div>
      )}
    </LayoutAnimated>
  );
}

// Example 7: Conditional fields form
const Form = styled.form`
  max-width: 400px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  
  input {
    width: 100%;
    padding: 10px;
    margin: 8px 0;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  button {
    width: 100%;
    padding: 12px;
    margin-top: 16px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
`;

export function DynamicForm() {
  const [showOptional, setShowOptional] = createSignal(false);
  
  return (
    <LayoutAnimated 
      as={Form}
      layout 
      layoutTransition={{ 
        stiffness: 400, 
        damping: 30,
        animateHeight: true,
        animateWidth: false
      }}
    >
      <input type="text" placeholder="Name *" required />
      <input type="email" placeholder="Email *" required />
      
      <label style={{ display: 'block', margin: '12px 0' }}>
        <input 
          type="checkbox" 
          checked={showOptional()} 
          onChange={(e) => setShowOptional(e.currentTarget.checked)}
        />
        {' '}Show optional fields
      </label>
      
      {showOptional() && (
        <>
          <input type="tel" placeholder="Phone (optional)" />
          <input type="text" placeholder="Company (optional)" />
        </>
      )}
      
      <button type="submit">Submit</button>
    </LayoutAnimated>
  );
}

// Example 8: Sidebar navigation
const Sidebar = styled.nav<{ collapsed: boolean }>`
  background: #2c3e50;
  color: white;
  height: 100vh;
  padding: 20px;
  width: ${props => props.collapsed ? '60px' : '250px'};
  overflow: hidden;
  
  a {
    display: block;
    padding: 12px;
    color: white;
    text-decoration: none;
    margin: 8px 0;
    border-radius: 4px;
    
    &:hover {
      background: #34495e;
    }
  }
  
  button {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 8px;
  }
`;

export function CollapsibleSidebar() {
  const [collapsed, setCollapsed] = createSignal(false);
  
  return (
    <LayoutAnimated 
      as={Sidebar}
      collapsed={collapsed()}
      layout 
      layoutTransition={{
        stiffness: 350,
        damping: 28,
        animateWidth: true,
        animateHeight: false
      }}
    >
      <button onClick={() => setCollapsed(!collapsed())}>
        {collapsed() ? '→' : '←'}
      </button>
      
      {!collapsed() && (
        <>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </>
      )}
    </LayoutAnimated>
  );
}

// Example 9: With animation callbacks
export function CallbackExample() {
  const [expanded, setExpanded] = createSignal(false);
  
  return (
    <LayoutAnimated 
      layout 
      layoutTransition={{
        stiffness: 400,
        damping: 30,
        onLayoutAnimationStart: (element) => {
          console.log('Animation started!');
          element.style.opacity = '0.8';
        },
        onLayoutAnimationComplete: (element) => {
          console.log('Animation complete!');
          element.style.opacity = '1';
        }
      }}
    >
      <h2>With Callbacks</h2>
      <button onClick={() => setExpanded(!expanded())}>
        Toggle (check console)
      </button>
      {expanded() && (
        <div>
          <p>Callbacks fire on animation start and complete!</p>
        </div>
      )}
    </LayoutAnimated>
  );
}
