/**
 * 🌐 **Professional Test: Cross-Browser Compatibility**
 * 
 * Tests animation system behavior across different browser environments,
 * vendor prefixes, touch vs mouse interactions, viewport changes,
 * and browser-specific animation quirks to ensure consistent behavior.
 * 
 * Professional testing principles applied:
 * - Browser environment simulation and testing
 * - Vendor prefix compatibility verification
 * - Touch and mouse interaction parity
 * - Viewport and orientation change handling
 * - Performance consistency across browser engines
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@solidjs/testing-library';
import { createSignal, createEffect, onMount, onCleanup } from 'solid-js';
import { styled } from '../src';

// =============================================================================
// 🛠️ **Browser Compatibility Testing Utilities**
// =============================================================================

/**
 * Browser environment simulator for cross-browser testing
 */
class BrowserEnvironmentSimulator {
  private originalUserAgent: string;
  private originalVendorPrefixes: any;
  private originalTouchSupport: any;

  constructor() {
    this.originalUserAgent = navigator.userAgent;
    this.originalVendorPrefixes = {
      transform: (document.body.style as any).transform,
      animation: (document.body.style as any).animation,
      transition: (document.body.style as any).transition
    };
  }

  simulateWebKit() {
    // Simulate Safari/Chrome WebKit environment
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      configurable: true
    });

    // Add webkit prefixes
    (document.body.style as any).webkitTransform = '';
    (document.body.style as any).webkitAnimation = '';
    (document.body.style as any).webkitTransition = '';
  }

  simulateFirefox() {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0',
      configurable: true
    });

    // Add moz prefixes  
    (document.body.style as any).mozTransform = '';
    (document.body.style as any).mozAnimation = '';
    (document.body.style as any).mozTransition = '';
  }

  simulateSafari() {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
      configurable: true
    });
  }

  simulateEdge() {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
      configurable: true
    });
  }

  simulateMobileTouch() {
    // Simulate touch device
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 5,
      configurable: true
    });

    // Add touch events
    if (!(window as any).TouchEvent) {
      (window as any).TouchEvent = class extends Event {
        touches: TouchList;
        changedTouches: TouchList;
        targetTouches: TouchList;
        
        constructor(type: string, options: any = {}) {
          super(type, options);
          this.touches = options.touches || ([] as any);
          this.changedTouches = options.changedTouches || ([] as any);
          this.targetTouches = options.targetTouches || ([] as any);
        }
      };
    }
  }

  simulateDesktopMouse() {
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 0,
      configurable: true
    });
  }

  restore() {
    Object.defineProperty(navigator, 'userAgent', {
      value: this.originalUserAgent,
      configurable: true
    });

    // Restore prefixes
    Object.keys(this.originalVendorPrefixes).forEach(key => {
      (document.body.style as any)[key] = this.originalVendorPrefixes[key];
    });
  }
}

/**
 * Viewport simulation utility for responsive testing
 */
class ViewportSimulator {
  private originalInnerWidth: number;
  private originalInnerHeight: number;

  constructor() {
    this.originalInnerWidth = window.innerWidth;
    this.originalInnerHeight = window.innerHeight;
  }

  simulateViewport(width: number, height: number) {
    Object.defineProperty(window, 'innerWidth', {
      value: width,
      configurable: true
    });
    
    Object.defineProperty(window, 'innerHeight', {
      value: height,
      configurable: true
    });

    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
  }

  simulateMobile() {
    this.simulateViewport(375, 667); // iPhone dimensions
  }

  simulateTablet() {
    this.simulateViewport(768, 1024); // iPad dimensions
  }

  simulateDesktop() {
    this.simulateViewport(1920, 1080); // Desktop dimensions
  }

  simulateOrientationChange() {
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    
    // Swap dimensions for orientation change
    this.simulateViewport(currentHeight, currentWidth);
    
    // Trigger orientation change event
    window.dispatchEvent(new Event('orientationchange'));
  }

  restore() {
    Object.defineProperty(window, 'innerWidth', {
      value: this.originalInnerWidth,
      configurable: true
    });
    
    Object.defineProperty(window, 'innerHeight', {
      value: this.originalInnerHeight,
      configurable: true
    });
  }
}

/**
 * Animation feature detection utility
 */
class AnimationFeatureDetector {
  static supportsTransform(): boolean {
    const testElement = document.createElement('div');
    const prefixes = ['transform', 'webkitTransform', 'mozTransform', 'msTransform'];
    
    return prefixes.some(prefix => prefix in testElement.style);
  }

  static supportsAnimation(): boolean {
    const testElement = document.createElement('div');
    const prefixes = ['animation', 'webkitAnimation', 'mozAnimation', 'msAnimation'];
    
    return prefixes.some(prefix => prefix in testElement.style);
  }

  static supportsTransition(): boolean {
    const testElement = document.createElement('div');
    const prefixes = ['transition', 'webkitTransition', 'mozTransition', 'msTransition'];
    
    return prefixes.some(prefix => prefix in testElement.style);
  }

  static getVendorPrefix(): string {
    const testElement = document.createElement('div');
    
    if ('webkitTransform' in testElement.style) return 'webkit';
    if ('mozTransform' in testElement.style) return 'moz';
    if ('msTransform' in testElement.style) return 'ms';
    return '';
  }
}

// =============================================================================
// 🎯 **Cross-Browser Test Components**
// =============================================================================

const CrossBrowserTestCard = ({ testId }: { testId: string }) => {
  const [isAnimating, setIsAnimating] = createSignal(false);
  const [animationSupported, setAnimationSupported] = createSignal(true);
  const [vendorPrefix, setVendorPrefix] = createSignal('');

  onMount(() => {
    setAnimationSupported(AnimationFeatureDetector.supportsAnimation());
    setVendorPrefix(AnimationFeatureDetector.getVendorPrefix());
  });

  const startAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1000);
  };

  return (
    <CrossBrowserCard
      data-testid={`cross-browser-card-${testId}`}
      isAnimating={isAnimating()}
      animationSupported={animationSupported()}
      onClick={startAnimation}
    >
      <div>Animation: {animationSupported() ? 'Supported' : 'Not Supported'}</div>
      <div>Prefix: {vendorPrefix() || 'None'}</div>
      <div>State: {isAnimating() ? 'Animating' : 'Static'}</div>
      <button data-testid={`animate-button-${testId}`}>Animate</button>
    </CrossBrowserCard>
  );
};

const CrossBrowserCard = styled.div<{ 
  isAnimating: boolean; 
  animationSupported: boolean; 
}>`
  width: 200px;
  height: 150px;
  background: ${props => props.animationSupported ? '#4ecdc4' : '#ff6b6b'};
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-weight: bold;
  padding: 16px;
  
  /* Use fallbacks for older browsers */
  transform: ${props => props.isAnimating ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)'};
  -webkit-transform: ${props => props.isAnimating ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)'};
  -moz-transform: ${props => props.isAnimating ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)'};
  -ms-transform: ${props => props.isAnimating ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)'};
  
  transition: all 0.3s ease;
  -webkit-transition: all 0.3s ease;
  -moz-transition: all 0.3s ease;
  -ms-transition: all 0.3s ease;
  
  opacity: ${props => props.isAnimating ? 0.8 : 1};
`;

const TouchVsMouseTestComponent = () => {
  const [interactionType, setInteractionType] = createSignal<'none' | 'touch' | 'mouse'>('none');
  const [isTouchDevice, setIsTouchDevice] = createSignal(false);

  onMount(() => {
    setIsTouchDevice(navigator.maxTouchPoints > 0);
  });

  const handleTouchStart = () => {
    setInteractionType('touch');
    setTimeout(() => setInteractionType('none'), 1000);
  };

  const handleMouseEnter = () => {
    if (interactionType() !== 'touch') {
      setInteractionType('mouse');
    }
  };

  const handleMouseLeave = () => {
    if (interactionType() === 'mouse') {
      setInteractionType('none');
    }
  };

  return (
    <TouchMouseCard
      data-testid="touch-mouse-card"
      interactionType={interactionType()}
      isTouchDevice={isTouchDevice()}
      onTouchStart={handleTouchStart}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div>Device: {isTouchDevice() ? 'Touch' : 'Mouse'}</div>
      <div>Interaction: {interactionType()}</div>
    </TouchMouseCard>
  );
};

const TouchMouseCard = styled.div<{ 
  interactionType: string; 
  isTouchDevice: boolean; 
}>`
  width: 200px;
  height: 100px;
  background: ${props => {
    if (props.interactionType === 'touch') return '#ff6b6b';
    if (props.interactionType === 'mouse') return '#4ecdc4';
    return '#95a5a6';
  }};
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  
  transform: ${props => {
    if (props.interactionType === 'touch') return 'scale(1.1)';
    if (props.interactionType === 'mouse') return 'scale(1.05)';
    return 'scale(1)';
  }};
  
  /* Touch-specific styles */
  ${props => props.isTouchDevice && `
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
  `}
`;

const ViewportResponsiveComponent = () => {
  const [viewport, setViewport] = createSignal({ width: window.innerWidth, height: window.innerHeight });
  const [orientation, setOrientation] = createSignal<'portrait' | 'landscape'>('portrait');

  onMount(() => {
    const updateViewport = () => {
      const newViewport = { width: window.innerWidth, height: window.innerHeight };
      setViewport(newViewport);
      setOrientation(newViewport.width > newViewport.height ? 'landscape' : 'portrait');
    };

    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    onCleanup(() => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    });
  });

  const deviceType = () => {
    const width = viewport().width;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };

  return (
    <ViewportCard
      data-testid="viewport-card"
      deviceType={deviceType()}
      orientation={orientation()}
    >
      <div>Size: {viewport().width} x {viewport().height}</div>
      <div>Device: {deviceType()}</div>
      <div>Orientation: {orientation()}</div>
    </ViewportCard>
  );
};

const ViewportCard = styled.div<{ 
  deviceType: string; 
  orientation: string; 
}>`
  width: ${props => {
    switch (props.deviceType) {
      case 'mobile': return '150px';
      case 'tablet': return '200px';
      default: return '250px';
    }
  }};
  height: ${props => props.orientation === 'landscape' ? '80px' : '120px'};
  background: ${props => {
    switch (props.deviceType) {
      case 'mobile': return '#e74c3c';
      case 'tablet': return '#f39c12';
      default: return '#27ae60';
    }
  }};
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  transition: all 0.3s ease;
  
  transform: ${props => props.orientation === 'landscape' ? 'scaleX(1.2)' : 'scaleX(1)'};
`;

// =============================================================================
// 🧪 **Professional Cross-Browser Test Suite**
// =============================================================================

describe('🌐 Cross-Browser Compatibility', () => {
  let browserSimulator: BrowserEnvironmentSimulator;
  let viewportSimulator: ViewportSimulator;

  beforeEach(() => {
    vi.useFakeTimers();
    browserSimulator = new BrowserEnvironmentSimulator();
    viewportSimulator = new ViewportSimulator();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    browserSimulator.restore();
    viewportSimulator.restore();
  });

  describe('🔧 Browser Engine Compatibility', () => {
    it('should work consistently across WebKit browsers', async () => {
      browserSimulator.simulateWebKit();
      
      const { getByTestId } = render(() => <CrossBrowserTestCard testId="webkit" />);
      
      const card = getByTestId('cross-browser-card-webkit');
      const animateButton = getByTestId('animate-button-webkit');

      expect(card).toBeInTheDocument();
      expect(card.textContent).toContain('Supported');

      animateButton.click();
      vi.advanceTimersByTime(500);
      
      expect(card.textContent).toContain('Animating');
      
      vi.advanceTimersByTime(500);
      expect(card.textContent).toContain('Static');
    });

    it('should work consistently in Firefox', async () => {
      browserSimulator.simulateFirefox();
      
      const { getByTestId } = render(() => <CrossBrowserTestCard testId="firefox" />);
      
      const card = getByTestId('cross-browser-card-firefox');
      const animateButton = getByTestId('animate-button-firefox');

      expect(card).toBeInTheDocument();
      
      animateButton.click();
      vi.advanceTimersByTime(500);
      
      // Should animate regardless of browser
      expect(card.textContent).toContain('Animating');
    });

    it('should work consistently in Safari', async () => {
      browserSimulator.simulateSafari();
      
      const { getByTestId } = render(() => <CrossBrowserTestCard testId="safari" />);
      
      const card = getByTestId('cross-browser-card-safari');
      expect(card).toBeInTheDocument();
      expect(card.textContent).toContain('Supported');
    });

    it('should work consistently in Edge', async () => {
      browserSimulator.simulateEdge();
      
      const { getByTestId } = render(() => <CrossBrowserTestCard testId="edge" />);
      
      const card = getByTestId('cross-browser-card-edge');
      expect(card).toBeInTheDocument();
    });
  });

  describe('👆 Touch vs Mouse Interaction Parity', () => {
    it('should handle touch interactions on mobile devices', async () => {
      browserSimulator.simulateMobileTouch();
      
      const { getByTestId } = render(() => <TouchVsMouseTestComponent />);
      
      const card = getByTestId('touch-mouse-card');
      expect(card.textContent).toContain('Touch');

      // Simulate touch interaction
      fireEvent.touchStart(card);
      vi.advanceTimersByTime(100);
      
      expect(card.textContent).toContain('Interaction: touch');
      
      vi.advanceTimersByTime(1000);
      expect(card.textContent).toContain('Interaction: none');
    });

    it('should handle mouse interactions on desktop devices', async () => {
      browserSimulator.simulateDesktopMouse();
      
      const { getByTestId } = render(() => <TouchVsMouseTestComponent />);
      
      const card = getByTestId('touch-mouse-card');
      expect(card.textContent).toContain('Mouse');

      // Simulate mouse interaction
      fireEvent.mouseEnter(card);
      vi.advanceTimersByTime(100);
      
      expect(card.textContent).toContain('Interaction: mouse');
      
      fireEvent.mouseLeave(card);
      vi.advanceTimersByTime(100);
      
      expect(card.textContent).toContain('Interaction: none');
    });

    it('should prioritize touch over mouse on hybrid devices', async () => {
      browserSimulator.simulateMobileTouch();
      
      const { getByTestId } = render(() => <TouchVsMouseTestComponent />);
      
      const card = getByTestId('touch-mouse-card');

      // Touch should take precedence
      fireEvent.touchStart(card);
      fireEvent.mouseEnter(card);
      
      vi.advanceTimersByTime(100);
      expect(card.textContent).toContain('Interaction: touch');
    });
  });

  describe('📱 Viewport and Orientation Changes', () => {
    it('should adapt to mobile viewport changes', async () => {
      viewportSimulator.simulateMobile();
      
      const { getByTestId } = render(() => <ViewportResponsiveComponent />);
      
      const card = getByTestId('viewport-card');
      expect(card.textContent).toContain('mobile');
      expect(card.textContent).toContain('375 x 667');
    });

    it('should adapt to tablet viewport changes', async () => {
      viewportSimulator.simulateTablet();
      
      const { getByTestId } = render(() => <ViewportResponsiveComponent />);
      
      const card = getByTestId('viewport-card');
      expect(card.textContent).toContain('tablet');
      expect(card.textContent).toContain('768 x 1024');
    });

    it('should adapt to desktop viewport changes', async () => {
      viewportSimulator.simulateDesktop();
      
      const { getByTestId } = render(() => <ViewportResponsiveComponent />);
      
      const card = getByTestId('viewport-card');
      expect(card.textContent).toContain('desktop');
      expect(card.textContent).toContain('1920 x 1080');
    });

    it('should handle orientation changes gracefully', async () => {
      viewportSimulator.simulateMobile(); // Start in portrait
      
      const { getByTestId } = render(() => <ViewportResponsiveComponent />);
      
      const card = getByTestId('viewport-card');
      expect(card.textContent).toContain('portrait');

      // Simulate orientation change
      viewportSimulator.simulateOrientationChange();
      vi.advanceTimersByTime(100);
      
      expect(card.textContent).toContain('landscape');
    });
  });

  describe('🔍 Feature Detection and Fallbacks', () => {
    it('should detect animation support correctly', () => {
      expect(AnimationFeatureDetector.supportsAnimation()).toBe(true);
      expect(AnimationFeatureDetector.supportsTransition()).toBe(true);
      expect(AnimationFeatureDetector.supportsTransform()).toBe(true);
    });

    it('should handle missing animation features gracefully', async () => {
      // Mock missing animation support
      const originalAnimation = (document.body.style as any).animation;
      delete (document.body.style as any).animation;
      
      const { getByTestId } = render(() => <CrossBrowserTestCard testId="no-animation" />);
      
      const card = getByTestId('cross-browser-card-no-animation');
      
      // Should still render and function without animations
      expect(card).toBeInTheDocument();
      
      // Restore
      (document.body.style as any).animation = originalAnimation;
    });
  });

  describe('⚡ Performance Consistency', () => {
    it('should maintain consistent performance across browsers', async () => {
      const performanceTests = ['webkit', 'firefox', 'safari', 'edge'];
      const results: Array<{ browser: string; renderTime: number }> = [];

      for (const browser of performanceTests) {
        const startTime = performance.now();
        
        // Simulate browser environment
        if (browser === 'webkit') browserSimulator.simulateWebKit();
        else if (browser === 'firefox') browserSimulator.simulateFirefox();
        else if (browser === 'safari') browserSimulator.simulateSafari();
        else if (browser === 'edge') browserSimulator.simulateEdge();

        const { getByTestId } = render(() => <CrossBrowserTestCard testId={browser} />);
        
        const endTime = performance.now();
        results.push({ browser, renderTime: endTime - startTime });

        cleanup();
      }

      // All browsers should have reasonable render times
      results.forEach(result => {
        expect(result.renderTime).toBeLessThan(100); // Less than 100ms
      });

      // Performance should be relatively consistent
      const renderTimes = results.map(r => r.renderTime);
      const avgTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
      const maxDeviation = Math.max(...renderTimes.map(time => Math.abs(time - avgTime)));
      
      expect(maxDeviation).toBeLessThan(avgTime * 2 + 1); // No more than 2x average + 1ms buffer
    });
  });
});
