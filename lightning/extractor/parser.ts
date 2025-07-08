/**
 * Lightning CSS Parser Module
 *
 * Parses styled components and extracts prop patterns for build-time optimization
 */

import type { ComponentMetadata, PropPattern } from "../types";

/**
 * Regular expressions for parsing styled components
 */
const STYLED_COMPONENT_REGEX = /styled\s*\.\s*(\w+)\s*`|styled\s*\(\s*['"](\w+)['"]\s*\)\s*`|styled\s*\(\s*(\w+)\s*\)/g;
const TEMPLATE_LITERAL_REGEX = /`([^`]*)`/;
const PROP_FUNCTION_REGEX = /\$\{[^}]+\}/g;
const ANIMATED_COMPONENT_REGEX = /animated\s*\.\s*(\w+)|animated\s*\(/;

/**
 * Parse a styled component file and extract metadata
 */
export function parseStyledComponent(code: string, filename: string): ComponentMetadata[] {
  const components: ComponentMetadata[] = [];

  try {
    // Find all styled component declarations with better parsing
    let match;
    const styledRegex = /(?:const|let|var)\s+(\w+)\s*=\s*styled\s*(?:\.\s*(\w+)|(?:\(\s*['"]?(\w+)['"]?\s*\)))\s*/g;

    while ((match = styledRegex.exec(code)) !== null) {
      const componentName = match[1];
      const tagName = match[2] || match[3];
      const startIndex = match.index + match[0].length;

      // Look for template literal, handling newlines and whitespace
      let templateStart = startIndex;

      // Skip whitespace and newlines
      while (templateStart < code.length && /\s/.test(code[templateStart])) {
        templateStart++;
      }

      // Check if we have a template literal
      if (code[templateStart] !== "`") {
        console.warn(`[Lightning CSS] No template literal found for ${componentName} in ${filename}`);
        continue;
      }

      // Extract template literal content
      const templateMatch = extractTemplateContent(code, templateStart);
      if (!templateMatch) {
        console.warn(`[Lightning CSS] Failed to extract template literal for ${componentName} in ${filename}`);
        continue;
      }

      const styles = templateMatch.content;

      // Validate that we extracted actual CSS
      if (!isValidCSS(styles)) {
        console.warn(`[Lightning CSS] Invalid CSS extracted for ${componentName}:`, styles.substring(0, 100));
        continue;
      }

      // Check if this is an animated component
      const afterComponent = code.slice(templateMatch.endIndex, Math.min(code.length, templateMatch.endIndex + 200));
      const isAnimated = ANIMATED_COMPONENT_REGEX.test(afterComponent);

      // Extract prop patterns from the styles
      const propPatterns = extractPropPatterns(styles, code);

      // Detect if component has spring animations
      const hasAnimations = detectAnimations(styles, isAnimated);

      components.push({
        componentName,
        tagName: tagName as any,
        styles,
        propPatterns,
        hasAnimations,
        isAnimated,
        // Additional properties for compatibility
        name: componentName,
        tag: tagName,
        css: styles,
        hash: generateHash(styles),
        props: propPatterns,
      });
    }
  } catch (error) {
    console.error(`[Lightning CSS] Error parsing ${filename}:`, error);
  }

  return components;
}

/**
 * Extract template literal content more robustly
 */
function extractTemplateContent(code: string, startIndex: number): { content: string; endIndex: number } | null {
  let i = startIndex;
  let depth = 0;
  let inTemplate = false;
  let content = "";

  while (i < code.length) {
    const char = code[i];

    if (char === "`" && !inTemplate) {
      inTemplate = true;
      i++;
      continue;
    }

    if (char === "`" && inTemplate && depth === 0) {
      // End of template literal
      return { content, endIndex: i };
    }

    if (inTemplate) {
      if (char === "$" && code[i + 1] === "{") {
        depth++;
        content += char;
      } else if (char === "}" && depth > 0) {
        depth--;
        content += char;
      } else {
        content += char;
      }
    }

    i++;
  }

  return null;
}

/**
 * Validate that extracted content is CSS, not JavaScript
 */
function isValidCSS(content: string): boolean {
  // Basic validation to ensure we're not extracting JavaScript
  const trimmed = content.trim();

  // Empty is valid
  if (!trimmed) return true;

  // Check for obvious JavaScript patterns
  const jsPatterns = [/^(const|let|var|function|class)\s+/, /^import\s+/, /^export\s+/, /;\s*const\s+/, /}\s*const\s+/];

  if (jsPatterns.some((pattern) => pattern.test(trimmed))) {
    return false;
  }

  // Check for basic CSS patterns
  const cssPatterns = [
    /^[a-zA-Z-]+\s*:/, // CSS property
    /^&/, // Sass/styled-components nesting
    /^@/, // CSS at-rules
    /^\s*\/\*/, // CSS comments
    /\$\{[^}]+\}/, // Template interpolations
  ];

  // If it doesn't match any CSS patterns and isn't empty, it might be invalid
  if (!cssPatterns.some((pattern) => pattern.test(trimmed))) {
    // But allow simple values like colors, numbers, etc.
    if (!/^[#\w\s,.-]+$/.test(trimmed)) {
      return false;
    }
  }

  return true;
}

/**
 * Generate a simple hash for styles
 */
function generateHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Extract the component name from the code
 */
function extractComponentName(code: string, position: number): string {
  // Look backwards for const/let/var declaration
  const beforeDeclaration = code.slice(0, position);
  const declarationMatch = beforeDeclaration.match(/(?:const|let|var)\s+(\w+)\s*=\s*$/);

  return declarationMatch ? declarationMatch[1] : "Anonymous";
}

/**
 * Extract prop patterns from template literal interpolations
 */
function extractPropPatterns(styles: string, fullCode: string): PropPattern[] {
  const patterns: PropPattern[] = [];
  const processedProps = new Set<string>();

  // Find all template literal interpolations
  let match;
  while ((match = PROP_FUNCTION_REGEX.exec(styles)) !== null) {
    const interpolation = match[0];
    const propPattern = analyzePropInterpolation(interpolation);

    if (propPattern && !processedProps.has(propPattern.propName)) {
      processedProps.add(propPattern.propName);

      // Try to find possible values from the codebase
      const values = findPropValues(propPattern.propName, fullCode);
      if (values.length > 0) {
        propPattern.values = values;
        patterns.push(propPattern);
      }
    }
  }

  return patterns;
}

/**
 * Analyze a single prop interpolation
 */
function analyzePropInterpolation(interpolation: string): PropPattern | null {
  // Remove ${ and }
  const content = interpolation.slice(2, -1).trim();

  // Pattern: (props: any) => props.variant === 'primary' ? 'blue' : 'gray'
  // or: props => props.variant === 'primary' ? 'blue' : 'gray'
  const ternaryMatch = content.match(
    /\(?\s*props\s*(?::\s*\w+)?\s*\)?\s*=>\s*props\.(\w+)\s*===?\s*['"](\w+)['"]\s*\?/
  );

  if (ternaryMatch) {
    // Extract the true and false values from the ternary
    const ternaryParts = content.split("?");
    if (ternaryParts.length >= 2) {
      const afterQuestion = ternaryParts[1];
      const colonParts = afterQuestion.split(":");
      if (colonParts.length >= 2) {
        const trueValue = colonParts[0].trim().replace(/['"]/g, "");
        const falseValue = colonParts[1].trim().replace(/['"]/g, "");

        return {
          propName: ternaryMatch[1],
          values: [ternaryMatch[2], falseValue], // Include both the test value and false value
          defaultValue: falseValue,
        };
      }
    }

    return {
      propName: ternaryMatch[1],
      values: [], // Will be populated by findPropValues
      defaultValue: undefined,
    };
  }

  // Pattern: (props: any) => props.size || 'medium'
  // or: props => props.size || 'medium'
  const defaultMatch = content.match(/\(?\s*props\s*(?::\s*\w+)?\s*\)?\s*=>\s*props\.(\w+)\s*\|\|\s*['"](\w+)['"]/);

  if (defaultMatch) {
    return {
      propName: defaultMatch[1],
      values: [],
      defaultValue: defaultMatch[2],
    };
  }

  // Pattern: ({theme}) => theme.colors.primary
  // or: (props: any) => props.theme?.colors?.primary
  const themeMatch = content.match(/(?:props\s*(?::\s*\w+)?\s*\)?\s*=>\s*props\.)?theme\??\.(\w+)\??\.(\w+)/);
  if (themeMatch) {
    return {
      propName: `theme.${themeMatch[1]}.${themeMatch[2]}`,
      values: [],
      defaultValue: undefined,
    };
  }

  return null;
}

/**
 * Find possible values for a prop in the codebase
 */
function findPropValues(propName: string, code: string): Array<string | number | boolean> {
  const values = new Set<string | number | boolean>();

  // Look for prop type definitions
  const propTypeRegex = new RegExp(`${propName}\\s*[?:]\\s*['"]([^'"]+)['"](\\s*\\|\\s*['"]([^'"]+)['"])*`, "g");

  let match;
  while ((match = propTypeRegex.exec(code)) !== null) {
    values.add(match[1]);
    // Handle union types
    if (match[2]) {
      const unionParts = match[2].split("|").map((s) => s.trim().replace(/['"]/g, ""));
      unionParts.forEach((v) => v && values.add(v));
    }
  }

  // Look for actual usage
  const usageRegex = new RegExp(`${propName}\\s*=\\s*{?['"]([^'"]+)['"]`, "g");

  while ((match = usageRegex.exec(code)) !== null) {
    values.add(match[1]);
  }

  // Common patterns
  if (propName === "variant") {
    ["primary", "secondary", "success", "danger", "warning", "info"].forEach((v) => values.add(v));
  }
  if (propName === "size") {
    ["small", "medium", "large"].forEach((v) => values.add(v));
  }

  return Array.from(values);
}

/**
 * Detect if component has animations
 */
function detectAnimations(styles: string, isAnimated: boolean): boolean {
  if (isAnimated) return true;

  // Check for animation-related CSS properties
  const animationProperties = ["animation", "transition", "transform", "@keyframes"];

  return animationProperties.some((prop) => styles.includes(prop));
}

/**
 * Calculate total prop combinations
 */
export function calculatePropCombinations(patterns: PropPattern[]): number {
  if (patterns.length === 0) return 1;

  return patterns.reduce((total, pattern) => {
    const valueCount = Math.max(pattern.values.length, 1);
    return total * valueCount;
  }, 1);
}
 