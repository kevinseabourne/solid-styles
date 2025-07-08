/**
 * Basic Styling Example
 * 
 * This example demonstrates the fundamental features of Solid Styles:
 * - Creating styled components
 * - Using template literals
 * - Applying styles
 * - Nesting and pseudo-selectors
 */

import { styled } from '../src/index';

// Basic styled component
const Container = styled("div")`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

// Styled heading with custom font size
const Title = styled("h1")`
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 1rem;
  text-align: center;
`;

// Card component with shadow and hover effect
const Card = styled("div")`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s ease;
  
  /* Hover effect */
  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

// Button with multiple states
const Button = styled("button")`
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  /* Hover state */
  &:hover {
    background: #0056b3;
  }
  
  /* Active state */
  &:active {
    transform: translateY(1px);
  }
  
  /* Focus state for accessibility */
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
  }
  
  /* Disabled state */
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

// Grid layout component
const Grid = styled("div")`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
`;

// Text with custom styling
const Text = styled("p")`
  line-height: 1.6;
  color: #666;
  margin-bottom: 1rem;
  
  /* Style nested strong tags */
  strong {
    color: #333;
    font-weight: 600;
  }
  
  /* Style nested links */
  a {
    color: #007bff;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

// Code block styling
const CodeBlock = styled("pre")`
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
  
  code {
    color: #e83e8c;
  }
`;

// List with custom bullets
const List = styled("ul")`
  list-style: none;
  padding-left: 0;
  
  li {
    position: relative;
    padding-left: 1.5rem;
    margin-bottom: 0.5rem;
    
    /* Custom bullet */
    &:before {
      content: "▸";
      position: absolute;
      left: 0;
      color: #007bff;
    }
  }
`;

// Example component
export function BasicStylingExample() {
  return (
    <Container>
      <Title>Basic Styling with Styled Components</Title>
      
      <Card>
        <h2>What is Styled Components?</h2>
        <Text>
          Styled Components is a <strong>CSS-in-JS</strong> library that allows you to write
          actual CSS code to style your components. It removes the mapping between components
          and styles, making it easy to write CSS that's scoped to a single component.
        </Text>
        
        <Text>
          Learn more at <a href="https://github.com/your-repo">our GitHub repository</a>.
        </Text>
      </Card>
      
      <Grid>
        <Card>
          <h3>Features</h3>
          <List>
            <li>Automatic critical CSS</li>
            <li>No class name bugs</li>
            <li>Easier deletion of CSS</li>
            <li>Simple dynamic styling</li>
            <li>Painless maintenance</li>
          </List>
        </Card>
        
        <Card>
          <h3>Code Example</h3>
          <CodeBlock>
{`const Button = styled("button")\`
  background: #007bff;
  color: white;
  padding: 0.5rem 1rem;
  
  &:hover {
    background: #0056b3;
  }
\`;`}
          </CodeBlock>
        </Card>
        
        <Card>
          <h3>Try It Out</h3>
          <Text>
            Click the buttons below to see different states:
          </Text>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button>Normal Button</Button>
            <Button disabled>Disabled Button</Button>
          </div>
        </Card>
      </Grid>
    </Container>
  );
}

export default BasicStylingExample; 