/**
 * Lightning CSS Generator Module
 *
 * Generates static CSS classes for prop combinations
 */

import type { ComponentMetadata, ExtractedStyle, PropPattern } from "../types";

/**
 * Generate static CSS for all prop combinations
 */
export function generateStaticCSS(component: ComponentMetadata, maxCombinations: number = 100): ExtractedStyle[] {
  const { propPatterns, styles, componentName } = component;

  // Skip if component has animations (handled by spring system)
  if (component.hasAnimations || component.isAnimated) {
    console.log(`[Lightning CSS] Skipping ${componentName}: Uses spring animations`);
    return [];
  }

  // Validate the styles are actually CSS
  if (!isValidCSSContent(styles)) {
    console.warn(`[Lightning CSS] Skipping ${componentName}: Invalid CSS content detected`);
    return [];
  }

  // Calculate total combinations
  const totalCombinations = calculateTotalCombinations(propPatterns);

  // Skip if too many combinations
  if (totalCombinations > maxCombinations) {
    console.warn(
      `[Lightning CSS] Component ${componentName} has ${totalCombinations} combinations, ` +
        `exceeding limit of ${maxCombinations}. Using runtime styles.`
    );
    return [];
  }

  // Skip if no prop patterns (static CSS)
  if (propPatterns.length === 0) {
    console.log(`[Lightning CSS] Generating static CSS for ${componentName}`);

    // Generate a single static style for components with no dynamic props
    const className = generateClassName(componentName, {});
    const css = styles; // Use the styles as-is since there are no interpolations

    if (isValidCSSContent(css)) {
      return [
        {
          className,
          css: `.${className} { ${css} }`,
          propCombination: {},
          componentName: componentName,
          hash: generateHash(css),
        },
      ];
    } else {
      console.warn(`[Lightning CSS] Invalid CSS for static component ${componentName}`);
      return [];
    }
  }

  // Generate all combinations
  const combinations = generatePropCombinations(propPatterns);
  const extractedStyles: ExtractedStyle[] = [];

  try {
    for (const combination of combinations) {
      const className = generateClassName(componentName, combination);
      const css = interpolateStyles(styles, combination);

      // Validate interpolated CSS
      if (isValidCSSContent(css)) {
        extractedStyles.push({
          className,
          css: `.${className} { ${css} }`,
          propCombination: combination,
          componentName: componentName,
          hash: generateHash(css),
        });
      } else {
        console.warn(`[Lightning CSS] Invalid CSS generated for ${componentName} with props:`, combination);
      }
    }
  } catch (error) {
    console.error(`[Lightning CSS] Error generating CSS for ${componentName}:`, error);
  }

  console.log(`[Lightning CSS] Generated ${extractedStyles.length} static styles for ${componentName}`);
  return extractedStyles;
}

/**
 * Validate CSS content
 */
function isValidCSSContent(content: string): boolean {
  const trimmed = content.trim();

  // Empty is ok
  if (!trimmed) return true;

  // Check for JavaScript patterns that shouldn't be in CSS
  const invalidPatterns = [
    /^(const|let|var|function|class)\s+/,
    /^import\s+/,
    /^export\s+/,
    /}\s*(const|let|var)\s+/,
    /;\s*(const|let|var)\s+/,
    /^[A-Z][a-zA-Z]*\s*=/, // Component definitions
  ];

  if (invalidPatterns.some((pattern) => pattern.test(trimmed))) {
    return false;
  }

  return true;
}

/**
 * Generate a hash for CSS content
 */
function generateHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Calculate total number of combinations
 */
function calculateTotalCombinations(patterns: PropPattern[]): number {
  if (patterns.length === 0) return 1;

  return patterns.reduce((total, pattern) => {
    const count = pattern.values.length || 1;
    return total * count;
  }, 1);
}

/**
 * Generate all possible prop combinations
 */
function generatePropCombinations(patterns: PropPattern[]): Record<string, any>[] {
  if (patterns.length === 0) return [{}];

  const combinations: Record<string, any>[] = [];

  // Recursive function to generate combinations
  function generateCombination(index: number, current: Record<string, any>): void {
    if (index === patterns.length) {
      combinations.push({ ...current });
      return;
    }

    const pattern = patterns[index];
    const values = pattern.values.length > 0 ? pattern.values : [pattern.defaultValue];

    for (const value of values) {
      current[pattern.propName] = value;
      generateCombination(index + 1, current);
    }
  }

  generateCombination(0, {});
  return combinations;
}

/**
 * Generate a unique class name for a prop combination
 */
function generateClassName(componentName: string, combination: Record<string, any>): string {
  // Create a deterministic hash from the combination
  const hash = Object.entries(combination)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}-${value}`)
    .join("_");

  // Generate class name
  const baseName = componentName.toLowerCase();
  return hash ? `${baseName}_${hash}` : baseName;
}

/**
 * Interpolate styles with prop values
 */
function interpolateStyles(styles: string, props: Record<string, any>): string {
  // Replace template literal interpolations
  return styles.replace(/\$\{([^}]+)\}/g, (match, expression) => {
    try {
      // Parse the expression
      const value = evaluateExpression(expression.trim(), props);
      return value !== undefined ? String(value) : match;
    } catch (error) {
      console.warn(`Failed to evaluate expression: ${expression}`);
      return match;
    }
  });
}

/**
 * Safely evaluate a prop expression
 */
function evaluateExpression(expression: string, props: Record<string, any>): any {
  // Handle arrow function expressions
  if (expression.includes("=>")) {
    // Extract the function body
    const arrowMatch = expression.match(/props\s*=>\s*(.+)/);
    if (arrowMatch) {
      expression = arrowMatch[1];
    }
  }

  // Handle ternary operators with boolean props (no quotes around prop value)
  const ternaryBooleanPropMatch = expression.match(/props\.(\w+)\s*\?\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/);

  if (ternaryBooleanPropMatch) {
    const propName = ternaryBooleanPropMatch[1];
    const trueValue = ternaryBooleanPropMatch[2];
    const falseValue = ternaryBooleanPropMatch[3];
    // Evaluate the boolean prop value
    return props[propName] ? trueValue : falseValue;
  }

  // Handle ternary operators with quoted strings
  const ternaryQuotedMatch = expression.match(
    /props\.(\w+)\s*===?\s*['"]([^'"]+)['"]\s*\?\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/
  );

  if (ternaryQuotedMatch) {
    const propName = ternaryQuotedMatch[1];
    const testValue = ternaryQuotedMatch[2];
    const trueValue = ternaryQuotedMatch[3];
    const falseValue = ternaryQuotedMatch[4];
    return props[propName] === testValue ? trueValue : falseValue;
  }

  // Handle ternary operators with unquoted values (like numbers)
  const ternaryUnquotedMatch = expression.match(/props\.(\w+)\s*\?\s*([^:]+?)\s*:\s*(.+)/);

  if (ternaryUnquotedMatch) {
    const propName = ternaryUnquotedMatch[1];
    const trueValue = ternaryUnquotedMatch[2].trim();
    const falseValue = ternaryUnquotedMatch[3].trim();

    // Remove quotes if present
    const cleanValue = (val: string) => {
      if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
        return val.slice(1, -1);
      }
      return val;
    };

    return props[propName] ? cleanValue(trueValue) : cleanValue(falseValue);
  }

  // Handle default values
  const defaultMatch = expression.match(/props\.(\w+)\s*\|\|\s*['"]([^'"]+)['"]/);

  if (defaultMatch) {
    const propName = defaultMatch[1];
    const defaultValue = defaultMatch[2];
    return props[propName] || defaultValue;
  }

  // Handle simple prop access
  const propMatch = expression.match(/props\.(\w+)/);
  if (propMatch) {
    return props[propMatch[1]];
  }

  // Handle theme access
  const themeMatch = expression.match(/props\.theme\.(\w+)\.(\w+)/);
  if (themeMatch && props.theme) {
    const category = themeMatch[1];
    const property = themeMatch[2];
    return props.theme[category]?.[property];
  }

  return undefined;
}

/**
 * Merge duplicate CSS rules
 */
export function mergeDuplicateRules(styles: ExtractedStyle[]): ExtractedStyle[] {
  const cssMap = new Map<string, ExtractedStyle>();

  for (const style of styles) {
    const existingStyle = cssMap.get(style.css);

    if (existingStyle) {
      // Merge class names
      existingStyle.className += `, .${style.className}`;
    } else {
      cssMap.set(style.css, { ...style });
    }
  }

  return Array.from(cssMap.values());
}
