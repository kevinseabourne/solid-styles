/**
 * Demo: Automatic Animation Detection in Solid-Styles
 * 
 * This example demonstrates the new automatic animation detection feature
 * where styled components automatically gain animation capabilities when
 * animation props are used, without needing explicit animated() wrapping.
 */

import { Component, createSignal } from 'solid-js';
import { styled } from '../src/index';

// Create styled components - no need to wrap with animated() anymore!
const AnimatedBox = styled.div`
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  margin: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
`;

const AnimatedButton = styled.button`
  padding: 12px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin: 10px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #3730a3;
    transform: translateY(-2px);
  }
`;

const Container = styled.div`
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

const Title = styled.h1`
  color: #374151;
  margin-bottom: 30px;
  text-align: center;
`;

const Description = styled.p`
  color: #6b7280;
  margin-bottom: 30px;
  line-height: 1.6;
`;

const AnimationDetectionDemo: Component = () => {
  const [isVisible, setIsVisible] = createSignal(true);
  const [scale, setScale] = createSignal(1);

  return (
    <Container>
      <Title>🎯 Automatic Animation Detection</Title>
      
      <Description>
        These styled components automatically gain animation capabilities when animation props are used.
        No need to explicitly wrap with animated() - the system detects animation props and applies
        the animation HOC automatically!
      </Description>

      {/* This box will automatically be wrapped with animated() because it uses 'animate' prop */}
      <AnimatedBox
        animate={{
          scale: scale(),
          rotate: scale() > 1 ? 10 : 0,
        }}
        whileHover={{
          scale: 1.1,
          rotate: 5,
        }}
        whileTap={{
          scale: 0.95,
        }}
        onClick={() => setScale(s => s === 1 ? 1.2 : 1)}
      >
        Click Me!
      </AnimatedBox>

      {/* This box will automatically be wrapped with animated() because it uses layout animation */}
      {isVisible() && (
        <AnimatedBox
          layout
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          whileHover={{ scale: 1.05 }}
          style={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          }}
        >
          Layout Magic
        </AnimatedBox>
      )}

      {/* This button will automatically be wrapped with animated() because it uses gesture props */}
      <AnimatedButton
        whileHover={{ 
          scale: 1.05,
          boxShadow: '0 8px 25px rgba(79, 70, 229, 0.3)',
        }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsVisible(v => !v)}
      >
        Toggle Box
      </AnimatedButton>

      {/* This is a regular styled component without animation props - no automatic wrapping */}
      <AnimatedBox style={{ background: '#e5e7eb', color: '#374151' }}>
        No Animation
      </AnimatedBox>

      <Description style={{ 'margin-top': '40px', 'font-style': 'italic' }}>
        💡 Notice how the components with animation props (animate, whileHover, layout, etc.) 
        automatically become animated, while the regular styled component remains static.
        This is zero-breaking - existing code continues to work exactly as before!
      </Description>
    </Container>
  );
};

export default AnimationDetectionDemo;
