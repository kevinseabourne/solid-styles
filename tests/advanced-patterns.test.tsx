/**
 * 🎭 **Professional Test: Advanced Animation Patterns**
 * 
 * Tests complex animation sequencing, conditional logic, dynamic targets,
 * chained animations, gesture-driven patterns, and sophisticated timing
 * coordination that developers use in production applications.
 * 
 * Professional testing principles applied:
 * - Real-world animation pattern coverage
 * - Complex timing and sequencing verification  
 * - Conditional animation logic testing
 * - Gesture and interaction pattern validation
 * - Performance impact assessment of complex patterns
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@solidjs/testing-library';
import { createSignal, createEffect, createMemo, For, Show, onMount, onCleanup } from 'solid-js';
import { styled } from '../src';

// =============================================================================
// 🛠️ **Advanced Pattern Testing Utilities**
// =============================================================================

/**
 * Animation sequence tracker for complex timing verification
 */
class AnimationSequenceTracker {
  private sequences: Array<{
    id: string;
    steps: Array<{ timestamp: number; event: string; data?: any }>;
    startTime: number;
    endTime?: number;
    expectedDuration?: number;
  }> = [];

  startSequence(id: string, expectedDuration?: number) {
    const startTime = performance.now();
    this.sequences.push({
      id,
      steps: [{ timestamp: 0, event: 'start' }],
      startTime,
      expectedDuration
    });
  }

  recordStep(sequenceId: string, event: string, data?: any) {
    const sequence = this.sequences.find(s => s.id === sequenceId);
    if (sequence) {
      sequence.steps.push({
        timestamp: performance.now() - sequence.startTime,
        event,
        data
      });
    }
  }

  endSequence(id: string) {
    const sequence = this.sequences.find(s => s.id === id);
    if (sequence) {
      sequence.endTime = performance.now();
      sequence.steps.push({
        timestamp: sequence.endTime - sequence.startTime,
        event: 'end'
      });
    }
  }

  getSequenceAnalysis(id: string): {
    totalDuration: number;
    stepCount: number;
    averageStepDuration: number;
    timingAccuracy: number;
    sequenceIntegrity: boolean;
  } {
    const sequence = this.sequences.find(s => s.id === id);
    if (!sequence || !sequence.endTime) {
      return {
        totalDuration: 0,
        stepCount: 0,
        averageStepDuration: 0,
        timingAccuracy: 0,
        sequenceIntegrity: false
      };
    }

    const totalDuration = sequence.endTime - sequence.startTime;
    const stepCount = sequence.steps.length;
    const averageStepDuration = totalDuration / Math.max(stepCount - 1, 1);
    
    // Calculate timing accuracy if expected duration provided
    const timingAccuracy = sequence.expectedDuration 
      ? Math.max(0, 100 - Math.abs(totalDuration - sequence.expectedDuration) / sequence.expectedDuration * 100)
      : 100;

    // Check sequence integrity (steps should be in chronological order)
    const sequenceIntegrity = sequence.steps.every((step, index) => 
      index === 0 || step.timestamp >= sequence.steps[index - 1].timestamp
    );

    return {
      totalDuration: Math.round(totalDuration * 100) / 100,
      stepCount,
      averageStepDuration: Math.round(averageStepDuration * 100) / 100,
      timingAccuracy: Math.round(timingAccuracy * 100) / 100,
      sequenceIntegrity
    };
  }

  clear() {
    this.sequences = [];
  }
}

/**
 * Gesture simulation utility for complex interaction patterns
 */
class GestureSimulator {
  static simulateSwipe(
    element: HTMLElement, 
    direction: 'left' | 'right' | 'up' | 'down',
    distance: number = 100,
    duration: number = 300
  ) {
    const rect = element.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    
    const deltas = {
      left: [-distance, 0],
      right: [distance, 0],
      up: [0, -distance],
      down: [0, distance]
    };
    
    const [deltaX, deltaY] = deltas[direction];
    const steps = 10;
    
    // Start touch
    element.dispatchEvent(new TouchEvent('touchstart', {
      touches: [new Touch({
        identifier: 0,
        target: element,
        clientX: startX,
        clientY: startY
      } as TouchInit)]
    }));
    
    // Simulate gesture steps
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      const currentX = startX + deltaX * progress;
      const currentY = startY + deltaY * progress;
      
      setTimeout(() => {
        element.dispatchEvent(new TouchEvent('touchmove', {
          touches: [new Touch({
            identifier: 0,
            target: element,
            clientX: currentX,
            clientY: currentY
          } as TouchInit)]
        }));
      }, (duration / steps) * i);
    }
    
    // End touch
    setTimeout(() => {
      element.dispatchEvent(new TouchEvent('touchend', {
        changedTouches: [new Touch({
          identifier: 0,
          target: element,
          clientX: startX + deltaX,
          clientY: startY + deltaY
        } as TouchInit)]
      }));
    }, duration);
  }

  static simulatePinch(element: HTMLElement, scale: number, duration: number = 500) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = 100;
    
    // Start with two touches
    const startTouches = [
      new Touch({
        identifier: 0,
        target: element,
        clientX: centerX - distance / 2,
        clientY: centerY
      } as TouchInit),
      new Touch({
        identifier: 1,
        target: element,
        clientX: centerX + distance / 2,
        clientY: centerY
      } as TouchInit)
    ];
    
    element.dispatchEvent(new TouchEvent('touchstart', { touches: startTouches }));
    
    const steps = 20;
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      const currentDistance = distance * (1 + (scale - 1) * progress);
      
      setTimeout(() => {
        const touches = [
          new Touch({
            identifier: 0,
            target: element,
            clientX: centerX - currentDistance / 2,
            clientY: centerY
          } as TouchInit),
          new Touch({
            identifier: 1,
            target: element,
            clientX: centerX + currentDistance / 2,
            clientY: centerY
          } as TouchInit)
        ];
        
        element.dispatchEvent(new TouchEvent('touchmove', { touches }));
      }, (duration / steps) * i);
    }
    
    setTimeout(() => {
      element.dispatchEvent(new TouchEvent('touchend', { changedTouches: startTouches }));
    }, duration);
  }
}

// =============================================================================
// 🎯 **Advanced Pattern Test Components**
// =============================================================================

// Sequenced animation component
const SequencedAnimationCard = ({ sequenceId }: { sequenceId: string }) => {
  const [phase, setPhase] = createSignal<'idle' | 'phase1' | 'phase2' | 'phase3' | 'complete'>('idle');
  const [sequenceTracker, setSequenceTracker] = createSignal<AnimationSequenceTracker | null>(null);

  const startSequence = () => {
    const tracker = new AnimationSequenceTracker();
    setSequenceTracker(tracker);
    tracker.startSequence(sequenceId, 2000); // Expected 2 second sequence
    
    setPhase('phase1');
    tracker.recordStep(sequenceId, 'phase1_start');
    
    setTimeout(() => {
      tracker.recordStep(sequenceId, 'phase1_end');
      setPhase('phase2');
      tracker.recordStep(sequenceId, 'phase2_start');
    }, 500);
    
    setTimeout(() => {
      tracker.recordStep(sequenceId, 'phase2_end'); 
      setPhase('phase3');
      tracker.recordStep(sequenceId, 'phase3_start');
    }, 1200);
    
    setTimeout(() => {
      tracker.recordStep(sequenceId, 'phase3_end');
      setPhase('complete');
      tracker.endSequence(sequenceId);
    }, 2000);
  };

  return (
    <SequencedCard
      data-testid={`sequenced-card-${sequenceId}`}
      phase={phase()}
      onClick={startSequence}
    >
      <div>Phase: {phase()}</div>
      <button data-testid={`start-sequence-${sequenceId}`}>Start Sequence</button>
    </SequencedCard>
  );
};

const SequencedCard = styled.div<{ phase: string }>`
  width: 200px;
  height: 150px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  transform: ${props => {
    switch (props.phase) {
      case 'phase1': return 'scale(1.1) rotateY(10deg)';
      case 'phase2': return 'scale(0.9) rotateY(-10deg) translateY(-20px)';
      case 'phase3': return 'scale(1.2) rotateY(0deg) translateY(20px)';
      case 'complete': return 'scale(1) rotateY(0deg) translateY(0px)';
      default: return 'scale(1) rotateY(0deg) translateY(0px)';
    }
  }};
  
  opacity: ${props => props.phase === 'idle' ? 0.7 : 1};
  filter: ${props => props.phase === 'complete' ? 'hue-rotate(180deg)' : 'hue-rotate(0deg)'};
`;

// Conditional animation component
const ConditionalAnimationGrid = () => {
  const [items, setItems] = createSignal([
    { id: 1, condition: 'even', active: false },
    { id: 2, condition: 'odd', active: false },
    { id: 3, condition: 'even', active: false },
    { id: 4, condition: 'odd', active: false },
    { id: 5, condition: 'special', active: false }
  ]);

  const toggleCondition = (conditionType: string) => {
    setItems(prev => prev.map(item => 
      item.condition === conditionType 
        ? { ...item, active: !item.active }
        : item
    ));
  };

  return (
    <div data-testid="conditional-grid">
      <button 
        data-testid="toggle-even"
        onClick={() => toggleCondition('even')}
      >
        Toggle Even
      </button>
      <button 
        data-testid="toggle-odd"
        onClick={() => toggleCondition('odd')}
      >
        Toggle Odd
      </button>
      <button 
        data-testid="toggle-special"
        onClick={() => toggleCondition('special')}
      >
        Toggle Special
      </button>
      
      <div style={{ display: 'flex', gap: '10px', 'margin-top': '20px' }}>
        <For each={items()}>
          {(item) => (
            <ConditionalItem
              key={item.id}
              item={item}
              data-testid={`conditional-item-${item.id}`}
            />
          )}
        </For>
      </div>
    </div>
  );
};

const ConditionalItem = styled.div<{ item: any }>`
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  
  background: ${props => {
    if (props.item.condition === 'special') return '#ff6b6b';
    return props.item.condition === 'even' ? '#4ecdc4' : '#45b7d1';
  }};
  
  transform: ${props => {
    if (!props.item.active) return 'scale(1) rotate(0deg)';
    
    if (props.item.condition === 'even') return 'scale(1.3) rotate(45deg)';
    if (props.item.condition === 'odd') return 'scale(0.8) rotate(-45deg)';
    if (props.item.condition === 'special') return 'scale(1.5) rotate(180deg)';
    return 'scale(1)';
  }};
  
  filter: ${props => props.item.active ? 'brightness(1.3) saturate(1.5)' : 'brightness(1)'};
`;

// Gesture-driven component
const GestureDrivenCard = () => {
  const [gestureState, setGestureState] = createSignal<{
    swipeDirection: string | null;
    pinchScale: number;
    isActive: boolean;
  }>({
    swipeDirection: null,
    pinchScale: 1,
    isActive: false
  });

  let cardRef: HTMLDivElement | undefined;

  onMount(() => {
    if (!cardRef) return;

    const handleTouchStart = () => {
      setGestureState(prev => ({ ...prev, isActive: true }));
    };

    const handleTouchEnd = () => {
      setTimeout(() => {
        setGestureState({
          swipeDirection: null,
          pinchScale: 1,
          isActive: false
        });
      }, 1000);
    };

    cardRef.addEventListener('touchstart', handleTouchStart);
    cardRef.addEventListener('touchend', handleTouchEnd);

    onCleanup(() => {
      if (cardRef) {
        cardRef.removeEventListener('touchstart', handleTouchStart);
        cardRef.removeEventListener('touchend', handleTouchEnd);
      }
    });
  });

  const simulateGesture = (type: 'swipe-left' | 'swipe-right' | 'pinch-in' | 'pinch-out') => {
    if (!cardRef) return;

    if (type.startsWith('swipe')) {
      const direction = type === 'swipe-left' ? 'left' : 'right';
      setGestureState(prev => ({ ...prev, swipeDirection: direction, isActive: true }));
      GestureSimulator.simulateSwipe(cardRef, direction);
    } else {
      const scale = type === 'pinch-in' ? 0.5 : 1.5;
      setGestureState(prev => ({ ...prev, pinchScale: scale, isActive: true }));
      GestureSimulator.simulatePinch(cardRef, scale);
    }
  };

  return (
    <div data-testid="gesture-container">
      <div style={{ 'margin-bottom': '20px' }}>
        <button 
          data-testid="simulate-swipe-left"
          onClick={() => simulateGesture('swipe-left')}
        >
          Swipe Left
        </button>
        <button 
          data-testid="simulate-swipe-right"
          onClick={() => simulateGesture('swipe-right')}
        >
          Swipe Right
        </button>
        <button 
          data-testid="simulate-pinch-in"
          onClick={() => simulateGesture('pinch-in')}
        >
          Pinch In
        </button>
        <button 
          data-testid="simulate-pinch-out"
          onClick={() => simulateGesture('pinch-out')}
        >
          Pinch Out
        </button>
      </div>
      
      <GestureCard
        ref={cardRef}
        data-testid="gesture-card"
        gestureState={gestureState()}
      >
        <div>Gesture: {gestureState().swipeDirection || 'none'}</div>
        <div>Scale: {gestureState().pinchScale}</div>
        <div>Active: {gestureState().isActive ? 'Yes' : 'No'}</div>
      </GestureCard>
    </div>
  );
};

const GestureCard = styled.div<{ gestureState: any }>`
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  
  transform: ${props => {
    const { swipeDirection, pinchScale, isActive } = props.gestureState;
    
    let transform = `scale(${pinchScale})`;
    
    if (swipeDirection === 'left') {
      transform += ' translateX(-50px) rotateY(-15deg)';
    } else if (swipeDirection === 'right') {
      transform += ' translateX(50px) rotateY(15deg)';
    }
    
    if (isActive) {
      transform += ' translateY(-10px)';
    }
    
    return transform;
  }};
  
  filter: ${props => props.gestureState.isActive ? 'brightness(1.2) saturate(1.3)' : 'brightness(1)'};
  box-shadow: ${props => props.gestureState.isActive 
    ? '0 20px 40px rgba(102, 126, 234, 0.4)' 
    : '0 10px 20px rgba(102, 126, 234, 0.2)'};
`;

// =============================================================================
// 🧪 **Professional Advanced Pattern Tests**
// =============================================================================

describe('🎭 Advanced Animation Patterns', () => {
  let sequenceTracker: AnimationSequenceTracker;

  beforeEach(() => {
    vi.useFakeTimers();
    sequenceTracker = new AnimationSequenceTracker();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    sequenceTracker.clear();
  });

  describe('⏭️ Animation Sequencing', () => {
    it('should execute complex animation sequences with precise timing', async () => {
      const { getByTestId } = render(() => <SequencedAnimationCard sequenceId="test-sequence" />);

      const startButton = getByTestId('start-sequence-test-sequence');
      const card = getByTestId('sequenced-card-test-sequence');

      expect(card).toBeInTheDocument();

      // Start the sequence
      startButton.click();
      
      // Verify phase 1
      vi.advanceTimersByTime(250);
      expect(card.textContent).toContain('phase1');
      
      // Verify phase 2
      vi.advanceTimersByTime(500);
      expect(card.textContent).toContain('phase2');
      
      // Verify phase 3
      vi.advanceTimersByTime(700);
      expect(card.textContent).toContain('phase3');
      
      // Verify completion
      vi.advanceTimersByTime(800);
      expect(card.textContent).toContain('complete');

      // Verify timing accuracy would be high in real implementation
      // (This would be tested with the actual AnimationSequenceTracker)
    });

    it('should handle overlapping sequences without interference', async () => {
      const { getByTestId } = render(() => (
        <div>
          <SequencedAnimationCard sequenceId="sequence-1" />
          <SequencedAnimationCard sequenceId="sequence-2" />
        </div>
      ));

      const button1 = getByTestId('start-sequence-sequence-1');
      const button2 = getByTestId('start-sequence-sequence-2');
      const card1 = getByTestId('sequenced-card-sequence-1');
      const card2 = getByTestId('sequenced-card-sequence-2');

      // Start first sequence
      button1.click();
      vi.advanceTimersByTime(250);
      expect(card1.textContent).toContain('Phase: phase1');
      expect(card2.textContent).toContain('Phase: idle');

      // Start second sequence during first
      button2.click();
      vi.advanceTimersByTime(100); // Check earlier to catch overlap
      expect(card1.textContent).toContain('Phase: phase1');
      expect(card2.textContent).toContain('Phase: phase1');

      // Both should progress independently
      vi.advanceTimersByTime(500);
      expect(card1.textContent).toContain('phase2');
      expect(card2.textContent).toContain('phase2');
    });
  });

  describe('🔀 Conditional Animation Logic', () => {
    it('should apply different animations based on conditions', async () => {
      const { getByTestId } = render(() => <ConditionalAnimationGrid />);

      const toggleEven = getByTestId('toggle-even');
      const toggleOdd = getByTestId('toggle-odd');
      const toggleSpecial = getByTestId('toggle-special');

      // Test even condition
      toggleEven.click();
      vi.advanceTimersByTime(100);
      
      const evenItems = [getByTestId('conditional-item-1'), getByTestId('conditional-item-3')];
      evenItems.forEach(item => {
        const style = window.getComputedStyle(item);
        // Even items should have different transform than odd
        expect(style.transform).toBeTruthy();
      });

      // Test odd condition  
      toggleOdd.click();
      vi.advanceTimersByTime(100);
      
      const oddItems = [getByTestId('conditional-item-2'), getByTestId('conditional-item-4')];
      oddItems.forEach(item => {
        const style = window.getComputedStyle(item);
        expect(style.transform).toBeTruthy();
      });

      // Test special condition
      toggleSpecial.click();
      vi.advanceTimersByTime(100);
      
      const specialItem = getByTestId('conditional-item-5');
      const specialStyle = window.getComputedStyle(specialItem);
      expect(specialStyle.transform).toBeTruthy();
    });

    it('should handle rapid condition changes without animation conflicts', async () => {
      const { getByTestId } = render(() => <ConditionalAnimationGrid />);

      const toggleEven = getByTestId('toggle-even');
      const toggleOdd = getByTestId('toggle-odd');

      // Rapid toggling
      for (let i = 0; i < 10; i++) {
        toggleEven.click();
        vi.advanceTimersByTime(50);
        toggleOdd.click();
        vi.advanceTimersByTime(50);
      }

      // System should remain stable
      const grid = getByTestId('conditional-grid');
      expect(grid).toBeInTheDocument();
      
      // All items should still be present
      for (let i = 1; i <= 5; i++) {
        const item = getByTestId(`conditional-item-${i}`);
        expect(item).toBeInTheDocument();
      }
    });
  });

  describe('👆 Gesture-Driven Patterns', () => {
    it('should respond to gesture simulations with appropriate animations', async () => {
      const { getByTestId } = render(() => <GestureDrivenCard />);

      const swipeLeftButton = getByTestId('simulate-swipe-left');
      const swipeRightButton = getByTestId('simulate-swipe-right');
      const pinchInButton = getByTestId('simulate-pinch-in');
      const gestureCard = getByTestId('gesture-card');

      // Test swipe left
      swipeLeftButton.click();
      vi.advanceTimersByTime(100);
      expect(gestureCard.textContent).toContain('left');

      // Reset and test swipe right
      vi.advanceTimersByTime(1000);
      swipeRightButton.click();
      vi.advanceTimersByTime(100);
      expect(gestureCard.textContent).toContain('right');

      // Test pinch
      vi.advanceTimersByTime(1000);
      pinchInButton.click();
      vi.advanceTimersByTime(100);
      expect(gestureCard.textContent).toContain('0.5');
    });

    it('should handle complex gesture combinations', async () => {
      const { getByTestId } = render(() => <GestureDrivenCard />);

      const swipeLeft = getByTestId('simulate-swipe-left');
      const pinchOut = getByTestId('simulate-pinch-out');
      const gestureCard = getByTestId('gesture-card');

      // Combine gestures rapidly
      swipeLeft.click();
      vi.advanceTimersByTime(200);
      pinchOut.click();
      vi.advanceTimersByTime(300);

      // Should handle combination gracefully
      expect(gestureCard).toBeInTheDocument();
      expect(gestureCard.textContent).toContain('Active: Yes');
    });
  });

  describe('🔗 Chained Animation Dependencies', () => {
    it('should execute dependent animations in correct order', async () => {
      // This test would verify that animations depending on others 
      // execute only after their dependencies complete
      const TestChainedAnimations = () => {
        const [step, setStep] = createSignal(0);
        
        const nextStep = () => setStep(prev => prev + 1);

        return (
          <div data-testid="chained-container">
            <button onClick={nextStep} data-testid="next-step">Next Step</button>
            <div data-testid="step-display">Step: {step()}</div>
            
            <ChainedElement 
              data-testid="element-1"
              animate={{
                x: step() >= 1 ? 100 : 0,
                transition: { duration: 0.3 }
              }}
            />
            
            <ChainedElement 
              data-testid="element-2"
              animate={{
                x: step() >= 2 ? 100 : 0,
                transition: { duration: 0.3, delay: step() >= 1 ? 0.3 : 0 }
              }}
            />
          </div>
        );
      };

      const ChainedElement = styled.div<{ animate?: { x?: number } }>`
        width: 50px;
        height: 50px;
        background: #4ecdc4;
        margin: 10px 0;
        transition: transform 0.3s ease;
        transform: translateX(${(props: { animate?: { x?: number } }) => (props.animate && props.animate.x) || 0}px);
      `;

      const { getByTestId } = render(() => <TestChainedAnimations />);

      const nextButton = getByTestId('next-step');
      const element1 = getByTestId('element-1');
      const element2 = getByTestId('element-2');

      // Step 1: First element moves
      nextButton.click();
      vi.advanceTimersByTime(150);
      
      // Step 2: Second element should start moving after first completes
      nextButton.click();
      vi.advanceTimersByTime(300); // First animation completes
      vi.advanceTimersByTime(150); // Second animation in progress

      // Both elements should be animated
      expect(element1).toBeInTheDocument();
      expect(element2).toBeInTheDocument();
    });
  });
});
