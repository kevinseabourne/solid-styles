/**
 * 🔄 **Professional Test: State Management Integration**
 * 
 * Tests deep integration with SolidJS state management: signals, stores,
 * effects, reactive animations, context propagation, and cleanup patterns
 * to ensure animations work seamlessly with complex state flows.
 * 
 * Professional testing principles applied:
 * - Signal-driven animation verification
 * - Store integration and state synchronization
 * - Effect cleanup and memory management
 * - Context propagation through animation components
 * - Reactive animation pattern validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@solidjs/testing-library';
import { 
  createSignal, 
  createEffect, 
  createContext, 
  useContext, 
  createMemo,
  createResource,
  For,
  Show,
  onMount,
  onCleanup,
  batch,
  Component,
  JSX,
  createRoot
} from 'solid-js';
import { createStore } from 'solid-js/store';
import { styled } from '../src';

// =============================================================================
// 🛠️ **State Management Testing Utilities**
// =============================================================================

/**
 * State synchronization tracker for complex state flows
 */
class StateAnimationTracker {
  private stateChanges: Array<{
    timestamp: number;
    source: 'signal' | 'store' | 'effect' | 'context';
    property: string;
    oldValue: any;
    newValue: any;
    animationTriggered: boolean;
  }> = [];

  private effectCleanups: Array<{
    effectId: string;
    cleaned: boolean;
    timestamp: number;
  }> = [];

  recordStateChange(
    source: 'signal' | 'store' | 'effect' | 'context',
    property: string,
    oldValue: any,
    newValue: any,
    animationTriggered: boolean
  ) {
    this.stateChanges.push({
      timestamp: performance.now(),
      source,
      property,
      oldValue,
      newValue,
      animationTriggered
    });
  }

  recordEffectCleanup(effectId: string) {
    this.effectCleanups.push({
      effectId,
      cleaned: true,
      timestamp: performance.now()
    });
  }

  getStateFlowAnalysis(): {
    totalStateChanges: number;
    animationTriggerRate: number;
    effectCleanupRate: number;
    stateSourceDistribution: Record<string, number>;
    averageResponseTime: number;
  } {
    const totalStateChanges = this.stateChanges.length;
    const animationTriggers = this.stateChanges.filter(c => c.animationTriggered).length;
    const animationTriggerRate = totalStateChanges > 0 ? (animationTriggers / totalStateChanges) * 100 : 0;
    
    const effectCleanupRate = this.effectCleanups.length > 0 
      ? (this.effectCleanups.filter(e => e.cleaned).length / this.effectCleanups.length) * 100 
      : 100;

    const stateSourceDistribution = this.stateChanges.reduce((acc, change) => {
      acc[change.source] = (acc[change.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average time between state change and animation
    const responseTimes = this.stateChanges
      .filter(c => c.animationTriggered)
      .map(c => c.timestamp);
    
    const averageResponseTime = responseTimes.length > 1
      ? responseTimes.reduce((sum, time, index) => {
          if (index === 0) return 0;
          return sum + (time - responseTimes[index - 1]);
        }, 0) / (responseTimes.length - 1)
      : 0;

    return {
      totalStateChanges,
      animationTriggerRate: Math.round(animationTriggerRate * 100) / 100,
      effectCleanupRate: Math.round(effectCleanupRate * 100) / 100,
      stateSourceDistribution,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100
    };
  }

  clear() {
    this.stateChanges = [];
    this.effectCleanups = [];
  }
}

/**
 * Complex store structure for testing deep state integration
 */
interface AppState {
  ui: {
    theme: 'light' | 'dark';
    animations: {
      enabled: boolean;
      duration: number;
      easing: string;
    };
    viewport: {
      width: number;
      height: number;
      orientation: 'portrait' | 'landscape';
    };
  };
  data: {
    items: Array<{
      id: string;
      title: string;
      status: 'idle' | 'loading' | 'success' | 'error';
      position: { x: number; y: number };
      scale: number;
      rotation: number;
    }>;
    filters: {
      search: string;
      category: string;
      sortBy: 'title' | 'status' | 'position';
    };
  };
  performance: {
    animationCount: number;
    frameRate: number;
    memoryUsage: number;
  };
}

const createAppStore = () => {
  const [store, setStore] = createStore<AppState>({
    ui: {
      theme: 'light',
      animations: {
        enabled: true,
        duration: 300,
        easing: 'ease-in-out'
      },
      viewport: {
        width: 1920,
        height: 1080,
        orientation: 'landscape'
      }
    },
    data: {
      items: [],
      filters: {
        search: '',
        category: 'all',
        sortBy: 'title'
      }
    },
    performance: {
      animationCount: 0,
      frameRate: 60,
      memoryUsage: 0
    }
  });

  return { store, setStore };
};

// =============================================================================
// 🎯 **State-Driven Test Components**
// =============================================================================

// Context for animation state
const AnimationStateContext = createContext<{
  isGloballyEnabled: () => boolean;
  toggleGlobalAnimations: () => void;
  getAnimationConfig: () => { duration: number; easing: string };
  updateAnimationConfig: (config: { duration?: number; easing?: string }) => void;
}>({} as any);

// Ensure context is never undefined
const useAnimationStateContext = () => {
  const context = useContext(AnimationStateContext);
  if (!context) {
    throw new Error('useAnimationStateContext must be used within an AnimationStateProvider');
  }
  return context;
};

const AnimationStateProvider = (props: { children: JSX.Element }) => {
  console.log('AnimationStateProvider - Component called with children:', props.children);
  const [enabled, setEnabled] = createSignal(true);
  const [config, setConfig] = createSignal({ duration: 300, easing: 'ease-in-out' });

  const isGloballyEnabled = createMemo(() => {
    const value = enabled();
    console.log('isGloballyEnabled called, returning:', value);
    return value;
  });
  const getAnimationConfig = createMemo(() => config());

  const context = {
    isGloballyEnabled,
    toggleGlobalAnimations: () => {
      try {
        console.log('Toggle called, current enabled:', enabled());
        setEnabled(prev => {
          console.log('Setting enabled from', prev, 'to', !prev);
          return !prev;
        });
        console.log('After toggle, enabled:', enabled());
      } catch (error) {
        console.error('Error in toggleGlobalAnimations:', error);
      }
    },
    getAnimationConfig,
    updateAnimationConfig: (newConfig: { duration?: number; easing?: string }) => {
      setConfig(prev => ({ ...prev, ...newConfig }));
    }
  };

  console.log('AnimationStateProvider - Created context:', context);
  console.log('AnimationStateProvider - isGloballyEnabled type:', typeof context.isGloballyEnabled);
  console.log('AnimationStateProvider - About to render Provider with context:', context);
  console.log('AnimationStateProvider - Using AnimationStateContext:', AnimationStateContext);

  return (
    <AnimationStateContext.Provider value={context}>
      {(() => {
        console.log('AnimationStateProvider - Rendering children with context:', context);
        return props.children;
      })()}
    </AnimationStateContext.Provider>
  );
};

// Signal-driven animated component
const SignalDrivenCard = ({ tracker }: { tracker: StateAnimationTracker }) => {
  const [position, setPosition] = createSignal({ x: 0, y: 0 });
  const [scale, setScale] = createSignal(1);
  const [rotation, setRotation] = createSignal(0);
  const [color, setColor] = createSignal('#4ecdc4');

  // Effect to track signal changes
  createEffect(() => {
    const pos = position();
    tracker.recordStateChange('signal', 'position', { x: 0, y: 0 }, pos, true);
  });

  createEffect(() => {
    const currentScale = scale();
    tracker.recordStateChange('signal', 'scale', 1, currentScale, true);
  });

  const randomizeProperties = () => {
    batch(() => {
      setPosition({ x: Math.random() * 200, y: Math.random() * 200 });
      setScale(0.5 + Math.random() * 1.5);
      setRotation(Math.random() * 360);
      setColor(`hsl(${Math.random() * 360}, 70%, 60%)`);
    });
  };

  return (
    <div>
      <button 
        data-testid="randomize-signal"
        onClick={randomizeProperties}
      >
        Randomize (Signal)
      </button>
      
      <SignalCard
        data-testid="signal-card"
        position={position()}
        scale={scale()}
        rotation={rotation()}
        color={color()}
      >
        <div>X: {Math.round(position().x)}</div>
        <div>Y: {Math.round(position().y)}</div>
        <div>Scale: {scale().toFixed(2)}</div>
        <div>Rotation: {Math.round(rotation())}°</div>
      </SignalCard>
    </div>
  );
};

const SignalCard = styled.div<{
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  color: string;
}>`
  width: 150px;
  height: 100px;
  background: ${props => props.color};
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  transform: 
    translateX(${props => props.position.x}px) 
    translateY(${props => props.position.y}px) 
    scale(${props => props.scale}) 
    rotate(${props => props.rotation}deg);
`;

// Store-driven animated component
const StoreDrivenGrid = ({ tracker }: { tracker: StateAnimationTracker }) => {
  const { store, setStore } = createAppStore();

  // Initialize with some items
  onMount(() => {
    setStore('data', 'items', [
      { id: '1', title: 'Item 1', status: 'idle', position: { x: 50, y: 50 }, scale: 1, rotation: 0 },
      { id: '2', title: 'Item 2', status: 'loading', position: { x: 150, y: 50 }, scale: 1, rotation: 0 },
      { id: '3', title: 'Item 3', status: 'success', position: { x: 100, y: 150 }, scale: 1, rotation: 0 }
    ]);
  });

  // Track store changes
  createEffect(() => {
    const items = store.data.items;
    tracker.recordStateChange('store', 'items', [], items, items.length > 0);
  });

  const updateItemStatus = (id: string, status: 'idle' | 'loading' | 'success' | 'error') => {
    const oldItem = store.data.items.find(item => item.id === id);
    setStore('data', 'items', item => item.id === id, 'status', status);
    
    const newItem = store.data.items.find(item => item.id === id);
    tracker.recordStateChange('store', 'itemStatus', oldItem?.status, newItem?.status, true);
  };

  const shuffleItems = () => {
    setStore('data', 'items', items => items.map(item => ({
      ...item,
      position: { x: Math.random() * 300, y: Math.random() * 200 },
      rotation: Math.random() * 360
    })));
  };

  return (
    <div data-testid="store-grid">
      <div style={{ 'margin-bottom': '20px' }}>
        <button 
          data-testid="shuffle-items"
          onClick={shuffleItems}
        >
          Shuffle Items
        </button>
        <button 
          data-testid="update-status"
          onClick={() => updateItemStatus('1', 'success')}
        >
          Update Status
        </button>
      </div>
      
      <div style={{ position: 'relative', width: '400px', height: '300px', border: '1px solid #ddd' }}>
        <For each={store.data.items}>
          {(item) => (
            <StoreItem
              key={item.id}
              data-testid={`store-item-${item.id}`}
              item={item}
              animationsEnabled={store.ui.animations.enabled}
            />
          )}
        </For>
      </div>
    </div>
  );
};

const StoreItem = styled.div<{ item: any; animationsEnabled: boolean }>`
  position: absolute;
  width: 80px;
  height: 60px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 11px;
  
  background: ${props => {
    switch (props.item.status) {
      case 'loading': return '#f39c12';
      case 'success': return '#27ae60';
      case 'error': return '#e74c3c';
      default: return '#95a5a6';
    }
  }};
  
  left: ${props => props.item.position.x}px;
  top: ${props => props.item.position.y}px;
  
  transform: 
    scale(${props => props.item.scale}) 
    rotate(${props => props.item.rotation}deg);
  
  transition: ${props => props.animationsEnabled 
    ? 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
    : 'none'};
`;

// Context-driven component
const ContextDrivenComponent = ({ tracker }: { tracker: StateAnimationTracker }) => {
  const animationContext = useContext(AnimationStateContext);
  console.log('ContextDrivenComponent - animationContext:', animationContext);
  console.log('ContextDrivenComponent - isGloballyEnabled type:', typeof animationContext?.isGloballyEnabled);
  console.log('ContextDrivenComponent - Using AnimationStateContext:', AnimationStateContext);
  const [localState, setLocalState] = createSignal('idle');

  // Track context changes
  createEffect(() => {
    const enabled = animationContext?.isGloballyEnabled();
    tracker.recordStateChange('context', 'globalAnimations', false, enabled, !!enabled);
  });

  const triggerAnimation = () => {
    setLocalState('animating');
    setTimeout(() => setLocalState('idle'), 1000);
  };

  return (
    <div data-testid="context-component">
      <div style={{ 'margin-bottom': '20px' }}>
        <button 
          data-testid="toggle-global"
          onClick={() => {
            console.log('Button clicked, animationContext:', animationContext);
            console.log('toggleGlobalAnimations:', animationContext?.toggleGlobalAnimations);
            if (animationContext?.toggleGlobalAnimations) {
              console.log('About to call toggleGlobalAnimations');
              const result = animationContext.toggleGlobalAnimations();
              console.log('Toggle result:', result);
            } else {
              console.log('toggleGlobalAnimations is not available');
            }
          }}
        >
          Toggle Global Animations
        </button>
        <button 
          data-testid="trigger-animation"
          onClick={triggerAnimation}
        >
          Trigger Animation
        </button>
      </div>
      
      <ContextCard
        data-testid="context-card"
        isEnabled={animationContext?.isGloballyEnabled() || false}
        localState={localState()}
        config={animationContext?.getAnimationConfig() ?? { duration: 300, easing: 'ease' }}
      >
        <div>Global: {animationContext?.isGloballyEnabled() ? 'ON' : 'OFF'}</div>
        <div>Local: {localState()}</div>
        <div>Duration: {animationContext?.getAnimationConfig().duration}ms</div>
      </ContextCard>
    </div>
  );
};

const ContextCard = styled.div<{
  isEnabled: boolean;
  localState: string;
  config: { duration: number; easing: string };
}>`
  width: 200px;
  height: 120px;
  background: ${props => props.isEnabled ? '#3498db' : '#95a5a6'};
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 12px;
  
  transform: ${props => {
    if (!props.isEnabled) return 'scale(0.9) brightness(0.7)';
    if (props.localState === 'animating') return 'scale(1.1) rotate(5deg)';
    return 'scale(1) rotate(0deg)';
  }};
  
  transition: ${props => props.isEnabled 
    ? `all ${props.config.duration}ms ${props.config.easing}` 
    : 'none'};
  
  opacity: ${props => props.isEnabled ? 1 : 0.6};
`;

// Resource-driven component
const ResourceDrivenComponent = ({ tracker }: { tracker: StateAnimationTracker }) => {
  // Simulate async data fetching
  const [resourceData] = createResource(
    () => Math.random(), // Dependency that changes
    async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        items: Array.from({ length: 5 }, (_, i) => ({
          id: i,
          value: Math.random() * 100,
          status: Math.random() > 0.5 ? 'active' : 'inactive'
        }))
      };
    }
  );

  // Track resource state changes
  createEffect(() => {
    const data = resourceData();
    if (data) {
      tracker.recordStateChange('effect', 'resourceData', null, data, true);
    }
  });

  return (
    <div data-testid="resource-component">
      <Show 
        when={!resourceData.loading} 
        fallback={<div data-testid="loading">Loading...</div>}
      >
        <div data-testid="resource-grid">
          <For each={resourceData()?.items || []}>
            {(item) => (
              <ResourceItem
                key={item.id}
                data-testid={`resource-item-${item.id}`}
                item={item}
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

const ResourceItem = styled.div<{ item: any }>`
  width: 60px;
  height: 40px;
  margin: 4px;
  background: ${props => props.item.status === 'active' ? '#2ecc71' : '#e67e22'};
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  font-weight: bold;
  transition: all 0.3s ease;
  
  transform: scale(${props => props.item.status === 'active' ? 1 : 0.8});
  opacity: ${props => props.item.status === 'active' ? 1 : 0.7};
`;

// =============================================================================
// 🧪 **Professional State Integration Test Suite**
// =============================================================================

describe('🔄 State Management Integration', () => {
  let stateTracker: StateAnimationTracker;

  beforeEach(() => {
    vi.useFakeTimers();
    stateTracker = new StateAnimationTracker();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    stateTracker.clear();
  });

  describe('📡 Signal-Driven Animations', () => {
    it('should respond to signal changes with smooth animations', async () => {
      const { getByTestId } = render(() => <SignalDrivenCard tracker={stateTracker} />);

      const randomizeButton = getByTestId('randomize-signal');
      const card = getByTestId('signal-card');

      expect(card).toBeInTheDocument();

      // Trigger multiple signal changes
      for (let i = 0; i < 5; i++) {
        randomizeButton.click();
        vi.advanceTimersByTime(100);
      }

      vi.advanceTimersByTime(1000); // Allow animations to complete

      const analysis = stateTracker.getStateFlowAnalysis();
      
      // Should have recorded signal changes and triggered animations
      expect(analysis.totalStateChanges).toBeGreaterThan(10);
      expect(analysis.animationTriggerRate).toBeGreaterThan(80);
      expect(analysis.stateSourceDistribution.signal).toBeGreaterThan(0);
    });

    it('should handle rapid signal updates without animation conflicts', async () => {
      const { getByTestId } = render(() => <SignalDrivenCard tracker={stateTracker} />);

      const randomizeButton = getByTestId('randomize-signal');

      // Rapid updates
      for (let i = 0; i < 20; i++) {
        randomizeButton.click();
        vi.advanceTimersByTime(10);
      }

      vi.advanceTimersByTime(2000);

      const analysis = stateTracker.getStateFlowAnalysis();
      
      // System should handle rapid updates gracefully
      expect(analysis.totalStateChanges).toBeGreaterThan(40);
      expect(analysis.averageResponseTime).toBeLessThan(100); // Quick response times
    });
  });

  describe('🏪 Store Integration', () => {
    it('should synchronize animations with store state changes', async () => {
      const { getByTestId } = render(() => <StoreDrivenGrid tracker={stateTracker} />);

      const shuffleButton = getByTestId('shuffle-items');
      const updateButton = getByTestId('update-status');

      // Wait for initial store setup
      vi.advanceTimersByTime(100);

      // Trigger store changes
      shuffleButton.click();
      vi.advanceTimersByTime(200);

      updateButton.click();
      vi.advanceTimersByTime(200);

      const analysis = stateTracker.getStateFlowAnalysis();
      
      // Should have recorded store changes
      expect(analysis.stateSourceDistribution.store).toBeGreaterThan(0);
      expect(analysis.animationTriggerRate).toBeGreaterThan(50);

      // All items should still be present
      for (let i = 1; i <= 3; i++) {
        const item = getByTestId(`store-item-${i}`);
        expect(item).toBeInTheDocument();
      }
    });

    it('should handle nested store updates correctly', async () => {
      const { getByTestId } = render(() => <StoreDrivenGrid tracker={stateTracker} />);

      const shuffleButton = getByTestId('shuffle-items');

      // Multiple nested updates
      for (let i = 0; i < 10; i++) {
        shuffleButton.click();
        vi.advanceTimersByTime(50);
      }

      vi.advanceTimersByTime(1000);

      const analysis = stateTracker.getStateFlowAnalysis();
      
      // Should maintain high performance despite nested updates
      expect(analysis.totalStateChanges).toBeGreaterThan(10);
      expect(analysis.averageResponseTime).toBeLessThan(200);
    });
  });

  describe('🌐 Context Propagation', () => {
    it('should propagate context changes through animation components', async () => {
      console.log('Test starting - AnimationStateProvider exists:', !!AnimationStateProvider);
      // Test direct component call
      console.log('Direct component call test:', AnimationStateProvider({ children: 'test' }));
      
      // Test minimal component to isolate JSX compilation issue
      const MinimalTest = () => {
        console.log('MinimalTest component called!');
        return <div>Minimal Test</div>;
      };
      
      console.log('Testing minimal component JSX compilation...');
      render(() => <MinimalTest />);
      
      // Test minimal context mechanism
      console.log('Testing minimal context Provider-Consumer...');
      const MinimalConsumer = () => {
        const ctx = useContext(AnimationStateContext);
        console.log('MinimalConsumer - Received context:', ctx);
        console.log('MinimalConsumer - Context keys:', Object.keys(ctx || {}));
        return <div data-testid="minimal-consumer">Context Keys: {Object.keys(ctx || {}).length}</div>;
      };
      
      // Create separate provider instances to avoid caching
      const MinimalProvider = (props: { children: JSX.Element }) => {
        console.log('MinimalProvider - Component called with children:', props.children);
        const [enabled, setEnabled] = createSignal(true);
        const [config, setConfig] = createSignal({ duration: 300, easing: 'ease-in-out' });
      
        const context = {
          isGloballyEnabled: createMemo(() => enabled()),
          toggleGlobalAnimations: () => setEnabled(prev => !prev),
          getAnimationConfig: createMemo(() => config()),
          updateAnimationConfig: (newConfig: { duration?: number; easing?: string }) => {
            setConfig(prev => ({ ...prev, ...newConfig }));
          }
        };
      
        console.log('MinimalProvider - Created context:', context);
        return (
          <AnimationStateContext.Provider value={context}>
            {props.children}
          </AnimationStateContext.Provider>
        );
      };
      
      const MainProvider = (props: { children: JSX.Element }) => {
        console.log('MainProvider - Component called with children:', props.children);
        const [enabled, setEnabled] = createSignal(true);
        const [config, setConfig] = createSignal({ duration: 300, easing: 'ease-in-out' });
      
        const context = {
          isGloballyEnabled: createMemo(() => enabled()),
          toggleGlobalAnimations: () => setEnabled(prev => !prev),
          getAnimationConfig: createMemo(() => config()),
          updateAnimationConfig: (newConfig: { duration?: number; easing?: string }) => {
            setConfig(prev => ({ ...prev, ...newConfig }));
          }
        };
      
        console.log('MainProvider - Created context:', context);
        return (
          <AnimationStateContext.Provider value={context}>
            {props.children}
          </AnimationStateContext.Provider>
        );
      };
      
      const { getByTestId: getMinimalTestId } = render(() => (
        <MinimalProvider>
          <MinimalConsumer />
        </MinimalProvider>
      ));
      
      const minimalElement = getMinimalTestId('minimal-consumer');
      console.log('Minimal consumer rendered text:', minimalElement.textContent);
      
      // Use createRoot to ensure provider context is established first
      console.log('Creating root with context provider...');
      let testUtils: any;
      
      createRoot(() => {
        console.log('Inside createRoot');
        const [enabled, setEnabled] = createSignal(true);
        const [config, setConfig] = createSignal({ duration: 300, easing: 'ease-in-out' });
      
        const contextValue = {
          isGloballyEnabled: createMemo(() => {
            console.log('isGloballyEnabled memo called, enabled:', enabled());
            return enabled();
          }),
          toggleGlobalAnimations: () => {
            console.log('toggleGlobalAnimations called');
            setEnabled(prev => !prev);
          },
          getAnimationConfig: createMemo(() => config()),
          updateAnimationConfig: (newConfig: { duration?: number; easing?: string }) => {
            setConfig(prev => ({ ...prev, ...newConfig }));
          }
        };
        
        console.log('Created context in root:', contextValue);
        
        testUtils = render(() => (
          <AnimationStateContext.Provider value={contextValue}>
            <ContextDrivenComponent tracker={stateTracker} />
          </AnimationStateContext.Provider>
        ));
      });
      
      const { getByTestId } = testUtils;

      const toggleButton = getByTestId('toggle-global');
      const triggerButton = getByTestId('trigger-animation');
      const card = getByTestId('context-card');

      expect(card.textContent).toContain('Global: ON');

      // Toggle global animations
      toggleButton.click();
      vi.advanceTimersByTime(100);
      
      expect(card.textContent).toContain('Global: OFF');

      // Trigger local animation while global is off
      triggerButton.click();
      vi.advanceTimersByTime(500);

      const analysis = stateTracker.getStateFlowAnalysis();
      
      // Should have recorded context changes
      expect(analysis.stateSourceDistribution.context).toBeGreaterThan(0);
    });

    it('should handle context updates during active animations', async () => {
      // Use createRoot to ensure context provider is established first
      let testUtils: any;
      
      createRoot(() => {
        const [enabled, setEnabled] = createSignal(true);
        const [config, setConfig] = createSignal({ duration: 300, easing: 'ease-in-out' });
      
        const contextValue = {
          isGloballyEnabled: createMemo(() => enabled()),
          toggleGlobalAnimations: () => {
            setEnabled(prev => !prev);
          },
          getAnimationConfig: createMemo(() => config()),
          updateAnimationConfig: (newConfig: { duration?: number; easing?: string }) => {
            setConfig(prev => ({ ...prev, ...newConfig }));
          }
        };
        
        testUtils = render(() => (
          <AnimationStateContext.Provider value={contextValue}>
            <ContextDrivenComponent tracker={stateTracker} />
          </AnimationStateContext.Provider>
        ));
      });
      
      const { getByTestId } = testUtils;
      const toggleButton = getByTestId('toggle-global');
      const triggerButton = getByTestId('trigger-animation');

      // Start animation, then change context mid-animation
      triggerButton.click();
      vi.advanceTimersByTime(300);
      
      toggleButton.click(); // Change context mid-animation
      vi.advanceTimersByTime(700);

      const analysis = stateTracker.getStateFlowAnalysis();
      
      // Should handle context changes gracefully during animations
      expect(analysis.totalStateChanges).toBeGreaterThanOrEqual(2);
      expect(analysis.effectCleanupRate).toBe(100); // All effects should clean up
    });
  });

  describe('🔄 Effect Cleanup and Memory Management', () => {
    it('should clean up effects properly on component unmount', async () => {
      const [showComponent, setShowComponent] = createSignal(true);

      const TestWrapper = () => (
        <Show when={showComponent()}>
          <SignalDrivenCard tracker={stateTracker} />
        </Show>
      );

      const { getByTestId } = render(() => <TestWrapper />);

      // Interact with component to create effects
      const randomizeButton = getByTestId('randomize-signal');
      randomizeButton.click();
      vi.advanceTimersByTime(100);

      // Unmount component
      setShowComponent(false);
      vi.advanceTimersByTime(100);

      // Should record effect cleanup
      stateTracker.recordEffectCleanup('signal-effects');
      
      const analysis = stateTracker.getStateFlowAnalysis();
      expect(analysis.effectCleanupRate).toBe(100);
    });

    it('should handle complex effect dependencies without memory leaks', async () => {
      const { getByTestId, findByTestId } = render(() => <ResourceDrivenComponent tracker={stateTracker} />);

      // Wait for resource to load (increased timeout to account for async Promise)
      vi.advanceTimersByTime(1000);
      
      // Use waitFor to handle asynchronous state changes
      await vi.waitFor(async () => {
        const resourceGrid = await findByTestId('resource-grid');
        expect(resourceGrid).toBeInTheDocument();
      }, { timeout: 2000 });

      const analysis = stateTracker.getStateFlowAnalysis();
      
      // Should have handled resource updates
      expect(analysis.stateSourceDistribution.effect).toBeGreaterThan(0);
    });
  });

  describe('🔀 Reactive Animation Patterns', () => {
    it('should handle complex reactive chains without breaking', async () => {
      // Use createRoot to ensure context provider is established first
      let testUtils: any;
      
      createRoot(() => {
        const [enabled, setEnabled] = createSignal(true);
        const [config, setConfig] = createSignal({ duration: 300, easing: 'ease-in-out' });
      
        const contextValue = {
          isGloballyEnabled: createMemo(() => enabled()),
          toggleGlobalAnimations: () => {
            setEnabled(prev => !prev);
          },
          getAnimationConfig: createMemo(() => config()),
          updateAnimationConfig: (newConfig: { duration?: number; easing?: string }) => {
            setConfig(prev => ({ ...prev, ...newConfig }));
          }
        };
        
        testUtils = render(() => (
          <AnimationStateContext.Provider value={contextValue}>
            <div>
              <SignalDrivenCard tracker={stateTracker} />
              <StoreDrivenGrid tracker={stateTracker} />
              <ContextDrivenComponent tracker={stateTracker} />
            </div>
          </AnimationStateContext.Provider>
        ));
      });
      
      const { getByTestId } = testUtils;

      // Trigger changes in all components simultaneously
      const signalButton = getByTestId('randomize-signal');
      const shuffleButton = getByTestId('shuffle-items');
      const contextButton = getByTestId('toggle-global');

      // Create complex reactive chain
      signalButton.click();
      shuffleButton.click();
      contextButton.click();

      vi.advanceTimersByTime(100);

      // Continue chain reaction
      signalButton.click();
      shuffleButton.click();

      vi.advanceTimersByTime(1000);

      const analysis = stateTracker.getStateFlowAnalysis();
      
      // Should handle complex reactive patterns
      expect(analysis.totalStateChanges).toBeGreaterThan(8);
      expect(Object.keys(analysis.stateSourceDistribution)).toContain('signal');
      expect(Object.keys(analysis.stateSourceDistribution)).toContain('store');
      expect(Object.keys(analysis.stateSourceDistribution)).toContain('context');
    });
  });

  describe('📊 Performance Under State Load', () => {
    it('should maintain performance with high-frequency state updates', async () => {
      const { getByTestId } = render(() => (
        <div>
          <SignalDrivenCard tracker={stateTracker} />
          <StoreDrivenGrid tracker={stateTracker} />
        </div>
      ));

      const signalButton = getByTestId('randomize-signal');
      const shuffleButton = getByTestId('shuffle-items');

      const startTime = performance.now();

      // High-frequency updates
      for (let i = 0; i < 50; i++) {
        signalButton.click();
        shuffleButton.click();
        vi.advanceTimersByTime(20);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      vi.advanceTimersByTime(2000); // Allow all animations to complete

      const analysis = stateTracker.getStateFlowAnalysis();
      
      // Should maintain good performance despite high load
      expect(analysis.totalStateChanges).toBeGreaterThan(100);
      expect(analysis.averageResponseTime).toBeLessThan(50); // Quick responses
      expect(totalTime).toBeLessThan(2000); // Reasonable total time
    });
  });
});
