/**
 * Example SolidJS Component for Astro
 * 
 * This demonstrates how to use solid-styles in Astro's island architecture.
 * Save this file as: src/components/Button.tsx
 * 
 * Usage in .astro files:
 * ---
 * import { Button } from '../components/Button';
 * ---
 * <Button client:load variant="primary">Click me</Button>
 */

import { styled } from 'solid-styles';
import { createSignal, type Component, type JSX } from 'solid-js';

// Styled button with zero-runtime CSS extraction
const StyledButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  /* Conditional styling based on props */
  background: ${props => props.variant === 'primary' ? '#3b82f6' : '#64748b'};
  color: white;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// With animations (requires client:load directive)
const AnimatedCard = styled.div`
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
`;

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: JSX.Element;
  onClick?: () => void;
}

export const Button: Component<ButtonProps> = (props) => {
  const [clicks, setClicks] = createSignal(0);
  
  const handleClick = () => {
    setClicks(c => c + 1);
    props.onClick?.();
  };
  
  return (
    <StyledButton variant={props.variant} onClick={handleClick}>
      {props.children} {clicks() > 0 && `(${clicks()})`}
    </StyledButton>
  );
};

// Example with theme
import { useTheme } from './theme';

const ThemedCard: Component = () => {
  const { theme } = useTheme();
  
  const Card = styled.div`
    padding: ${theme().spacing.md};
    background: ${theme().colors.primary};
    color: white;
    border-radius: 8px;
  `;
  
  return <Card>Themed Content</Card>;
};

// Example with animations (requires solid-styles/animation)
import { animated } from 'solid-styles/animation';

const FadeInBox = styled(animated.div)`
  padding: 2rem;
  background: #f0f9ff;
  border-radius: 12px;
`;

export const AnimatedComponent: Component = () => {
  return (
    <FadeInBox
      animate={{
        from: { opacity: 0, y: 20 },
        to: { opacity: 1, y: 0 },
        when: 'mount'
      }}
    >
      This fades in when the component mounts
    </FadeInBox>
  );
};
