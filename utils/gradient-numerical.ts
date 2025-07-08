/**
 * Numerical Gradient Representation for Spring Physics
 *
 * This file provides the data structures and conversion functions needed
 * to apply spring physics to CSS gradients in the animation system.
 */

import { Gradient, GradientStop, Color, recordPool, gradientPool, gradientStopPool } from "./spring";

/**
 * Represents a color in numerical RGBA form for spring physics calculations
 */
export interface NumericalColor {
  r: number; // Red (0-255)
  g: number; // Green (0-255)
  b: number; // Blue (0-255)
  a: number; // Alpha (0-1)
}

/**
 * Represents a gradient stop in numerical form for spring physics
 */
export interface NumericalGradientStop {
  position: number; // Position (0-1)
  color: NumericalColor; // Color in numerical form
}

/**
 * Represents a gradient in numerical form suitable for spring physics calculations
 */
export interface NumericalGradient {
  type: number; // 0 = linear, 1 = radial, 2 = conic
  angle: number; // Angle in degrees (for linear gradients)
  shape: number; // 0 = circle, 1 = ellipse (for radial gradients)
  stops: NumericalGradientStop[]; // Color stops
  _stringRepresentation?: string; // Original string representation (for diagnostics)
  _pooledGradient?: Gradient; // Reference to original pooled gradient if applicable
}

/**
 * Converts a string CSS color to a numerical representation
 *
 * @param colorStr CSS color string (hex, rgb, rgba, hsl, hsla, named)
 * @returns Color in RGBA numerical form
 */
export function colorToNumerical(colorStr: string): NumericalColor {
  // Handle invalid or missing colors
  if (!colorStr || typeof colorStr !== "string") {
    console.warn(`Invalid color value: ${colorStr}, using transparent fallback`);
    return { r: 0, g: 0, b: 0, a: 0 }; // Transparent
  }

  // Check if we've received a gradient string instead of a color
  if (colorStr.includes("gradient")) {
    console.warn(`Received gradient instead of color: ${colorStr.substring(0, 30)}..., using transparent fallback`);
    return { r: 0, g: 0, b: 0, a: 0 }; // Transparent
  }

  // Use any existing color parsing function from the codebase
  try {
    // Convert to RGB/RGBA
    // Check for common color formats
    const color = colorStr.trim().toLowerCase();

    // Handle hex colors
    if (color.startsWith("#")) {
      return hexToNumerical(color);
    }

    // Handle rgb/rgba colors
    if (color.startsWith("rgb")) {
      return rgbToNumerical(color);
    }

    // Handle named colors with fallback color map
    // This is a simplified version - in production we would use a complete color map
    const namedColors: Record<string, NumericalColor> = {
      transparent: { r: 0, g: 0, b: 0, a: 0 },
      black: { r: 0, g: 0, b: 0, a: 1 },
      white: { r: 255, g: 255, b: 255, a: 1 },
      red: { r: 255, g: 0, b: 0, a: 1 },
      green: { r: 0, g: 128, b: 0, a: 1 },
      blue: { r: 0, g: 0, b: 255, a: 1 },
      // Add more named colors as needed
    };

    if (namedColors[color]) {
      return namedColors[color];
    }

    // Attempt to parse as hex if it might be a shorthand like "fff"
    if (/^[0-9a-f]{3,6}$/i.test(color)) {
      return hexToNumerical("#" + color);
    }

    // Fallback for unrecognized colors
    console.warn(`Unrecognized color format: ${colorStr}, using transparent fallback`);
    return { r: 0, g: 0, b: 0, a: 0 }; // Transparent instead of black
  } catch (error) {
    console.error(`Error parsing color: ${colorStr}`, error);
    return { r: 0, g: 0, b: 0, a: 0 }; // Transparent fallback
  }
}

/**
 * Convert hex color to numerical representation
 */
function hexToNumerical(hex: string): NumericalColor {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Handle shorthand hex (#RGB or #RGBA)
  if (hex.length === 3 || hex.length === 4) {
    hex = Array.from(hex)
      .map((c) => c + c)
      .join("");
  }

  // Parse values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1;

  return {
    r: isNaN(r) ? 0 : r,
    g: isNaN(g) ? 0 : g,
    b: isNaN(b) ? 0 : b,
    a: isNaN(a) ? 1 : a,
  };
}

/**
 * Convert rgb/rgba color to numerical representation
 */
function rgbToNumerical(rgbStr: string): NumericalColor {
  // Extract values from rgb(r, g, b) or rgba(r, g, b, a)
  const values = rgbStr.match(/\d+(\.\d+)?%?/g) || [];

  // Parse values, handling percentage values
  const parseValue = (value: string, index: number) => {
    if (value.endsWith("%")) {
      // Convert percentage to 0-255 range for RGB, or keep as 0-1 for alpha
      const percentage = parseFloat(value) / 100;
      return index < 3 ? Math.round(percentage * 255) : percentage;
    }
    return parseFloat(value);
  };

  return {
    r: values[0] ? parseValue(values[0], 0) : 0,
    g: values[1] ? parseValue(values[1], 1) : 0,
    b: values[2] ? parseValue(values[2], 2) : 0,
    a: values[3] ? parseValue(values[3], 3) : 1,
  };
}

/**
 * Converts a numerical color to RGBA string, applying rounding ONLY at this final stage.
 */
export function numericalToRgbaString(color: NumericalColor): string {
  // Safe handling of alpha value
  const alpha = isFinite(color.a) ? parseFloat(color.a.toFixed(3)) : 1;

  // Rounding happens ONLY here, at final output
  return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${alpha})`;
}

/**
 * Clamps numerical color values to valid ranges WITHOUT rounding.
 * Rounding is deferred to string conversion only.
 */
export function clampColor(color: NumericalColor): NumericalColor {
  return {
    // Only clamp, don't round RGB values
    r: Math.max(0, Math.min(255, isFinite(color.r) ? color.r : 0)),
    g: Math.max(0, Math.min(255, isFinite(color.g) ? color.g : 0)),
    b: Math.max(0, Math.min(255, isFinite(color.b) ? color.b : 0)),
    // Handle alpha specially to ensure 0-1 range
    a: Math.max(0, Math.min(1, isFinite(color.a) ? color.a : 1)),
  };
}

/**
 * Converts a Gradient object to numerical representation for spring physics
 */
export function gradientToNumerical(gradient: Gradient | string): NumericalGradient {
  // Parse string if needed
  const gradientObj = typeof gradient === "string" ? parseGradientString(gradient) : gradient;

  // Handle failed parsing or invalid input
  if (!gradientObj) {
    console.warn("Failed to parse gradient, using default");
    return createDefaultNumericalGradient();
  }

  // Convert to numerical form
  const result: NumericalGradient = {
    type: gradientObj.type === "linear" ? 0 : gradientObj.type === "radial" ? 1 : 2,
    angle: gradientObj.angle || 0,
    shape: gradientObj.shape === "circle" ? 0 : 1,
    stops: gradientObj.stops.map((stop) => {
      // Ensure color.value is a valid color string, not a gradient
      if (stop.color && stop.color.value) {
        // Check if value is a gradient string instead of a color
        if (typeof stop.color.value === "string" && stop.color.value.includes("gradient")) {
          console.warn(`Found gradient in color value, using fallback color`);
          return {
            position: stop.position,
            color: { r: 100, g: 100, b: 100, a: 1 }, // Medium gray as fallback
          };
        }

        return {
          position: stop.position,
          color: colorToNumerical(stop.color.value),
        };
      } else {
        // Fallback if stop.color or stop.color.value is undefined
        console.warn(`Gradient stop missing color value, using fallback`);
        return {
          position: stop.position,
          color: { r: 0, g: 0, b: 0, a: 1 }, // Black as fallback
        };
      }
    }),
    _pooledGradient: typeof gradient !== "string" ? gradient : undefined,
    _stringRepresentation: typeof gradient === "string" ? gradient : undefined,
  };

  return result;
}

/**
 * Creates a default numerical gradient (black to white linear)
 */
function createDefaultNumericalGradient(): NumericalGradient {
  return {
    type: 0, // linear
    angle: 180, // Default "to bottom"
    shape: 1, // Default ellipse for radial (though type is linear here)
    stops: [
      { position: 0, color: { r: 0, g: 0, b: 0, a: 1 } },
      { position: 1, color: { r: 255, g: 255, b: 255, a: 1 } },
    ],
  };
}

/**
 * Parse a gradient string to a Gradient object
 */
export function parseGradientString(gradientStr: string): Gradient | null {
  if (!gradientStr || typeof gradientStr !== "string") {
    console.error("parseGradientString received invalid input:", gradientStr);
    return null;
  }

  // Create gradient pool object early
  const gradientFromPool = gradientPool.get();
  if (!gradientFromPool) {
    console.error("Failed to get gradient from pool");
    return null;
  }

  try {
    const normalizedStr = gradientStr.replace(/-webkit-|-moz-|-ms-/g, "").trim();

    // Handle gradient with and without the 'gradient' keyword
    let gradientType: string;
    let gradientContent: string;

    // First try to match standard syntax: linear-gradient(...)
    const gradientMatch = normalizedStr.match(/(linear|radial|conic)-gradient\s*\((.*)\)/i);
    if (gradientMatch) {
      gradientType = gradientMatch[1].toLowerCase();
      gradientContent = gradientMatch[2];
    } else {
      // Try to match simplified syntax: linear(...)
      const simpleMatch = normalizedStr.match(/(linear|radial|conic)\s*\((.*)\)/i);
      if (!simpleMatch) {
        console.warn(`Invalid gradient format: ${gradientStr}`);
        gradientPool.release(gradientFromPool); // Release the pool object
        return null;
      }
      gradientType = simpleMatch[1].toLowerCase();
      gradientContent = simpleMatch[2];
    }

    // Now that we have valid gradient type and content, create the gradient object
    gradientFromPool.type = gradientType as "linear" | "radial" | "conic";
    gradientFromPool.stops = []; // Initialize stops array

    const parts = splitRespectingParentheses(gradientContent);

    if (gradientFromPool.type === "linear") {
      gradientFromPool.angle = 180; // Default "to bottom"
      if (parts.length > 0) {
        const firstPart = parts[0].trim();
        if (firstPart.includes("deg")) {
          const angleMatch = firstPart.match(/(-?\d*\.?\d+)deg/);
          gradientFromPool.angle = angleMatch ? parseFloat(angleMatch[1]) : 180;
          parts.shift();
        } else if (
          /to\s+(top|bottom|left|right|top\s+left|top\s+right|bottom\s+left|bottom\s+right)/i.test(firstPart)
        ) {
          const direction = firstPart.replace(/to\s+/i, "").trim().toLowerCase();
          switch (direction) {
            case "top":
              gradientFromPool.angle = 0;
              break;
            case "right":
              gradientFromPool.angle = 90;
              break;
            case "bottom":
              gradientFromPool.angle = 180;
              break;
            case "left":
              gradientFromPool.angle = 270;
              break;
            case "top left":
              gradientFromPool.angle = 315;
              break;
            case "top right":
              gradientFromPool.angle = 45;
              break;
            case "bottom right":
              gradientFromPool.angle = 135;
              break;
            case "bottom left":
              gradientFromPool.angle = 225;
              break;
            default:
              gradientFromPool.angle = 180; // Fallback
          }
          parts.shift();
        }
        // If no angle or direction, default angle (180) remains.
      }
    }

    if (gradientFromPool.type === "radial") {
      gradientFromPool.shape = "ellipse"; // Default for radial
      if (parts.length > 0 && (parts[0].includes("circle") || parts[0].includes("ellipse"))) {
        // This part might also contain position, e.g., "circle at center"
        // For simplicity, just extracting shape for now.
        if (parts[0].includes("circle")) {
          gradientFromPool.shape = "circle";
        }
        // Consider more complex parsing for position and size later if needed
        parts.shift(); // Assuming the first part is just shape or shape with details
      }
    }

    // Filter out empty parts that might result from splitRespectingParentheses if there are trailing commas etc.
    const validParts = parts.filter((p) => p.trim() !== "");

    validParts.forEach((part, index) => {
      const trimmedPart = part.trim();
      // Regex to capture color and optional position.
      // Color can be hex, rgb(a), hsl(a), named. Position is optional.
      const colorMatch = trimmedPart.match(
        /((?:#[0-9a-fA-F]{3,8})|(?:rgba?\([^)]+\))|(?:hsla?\([^)]+\))|(?:hsl\([^)]+\))|(?:rgb\([^)]+\))|(?:[a-zA-Z]+(?:-[a-zA-Z]+)*))\s*((?:[\d.]+%)|(?:[\d.]+px)|(?:[\d.]+em))?/i
      );

      if (colorMatch) {
        const colorValue = colorMatch[1];
        const positionValueWithUnit = colorMatch[2]; // e.g., "50%" or "10px"

        const stop = gradientStopPool.get();
        stop.color = {
          value: colorValue,
          format: getColorFormat(colorValue),
        };

        if (positionValueWithUnit) {
          if (positionValueWithUnit.endsWith("%")) {
            stop.position = Math.max(0, Math.min(1, parseFloat(positionValueWithUnit) / 100));
          } else {
            // Handle length units if necessary, or log warning if not supported for spring animation
            console.warn(
              `Length unit for stop position (${positionValueWithUnit}) in gradient "${gradientStr}" might not be fully supported for spring animation. Assuming percentage-like behavior or defaulting.`
            );
            // For now, if it's not a percentage, we might need a strategy.
            // Defaulting to even distribution if parsing fails.
            stop.position = validParts.length <= 1 ? 0.5 : index / (validParts.length - 1);
          }
        } else {
          // If no position specified, distribute evenly
          stop.position = validParts.length <= 1 ? 0.5 : index / (validParts.length - 1);
        }
        gradientFromPool.stops.push(stop);
      } else {
        console.warn(`Could not parse color stop from: "${trimmedPart}" in gradient "${gradientStr}"`);
      }
    });

    if (gradientFromPool.stops.length === 0) {
      // Create default black-to-white gradient if no stops parsed
      const stop1 = gradientStopPool.get();
      stop1.color = { value: "black", format: "named" };
      stop1.position = 0;
      gradientFromPool.stops.push(stop1);

      const stop2 = gradientStopPool.get();
      stop2.color = { value: "white", format: "named" };
      stop2.position = 1;
      gradientFromPool.stops.push(stop2);
    } else if (gradientFromPool.stops.length === 1) {
      // If only one stop, duplicate it to create a solid gradient effect
      const existingStop = gradientFromPool.stops[0];
      const newStop = gradientStopPool.get();
      newStop.color = { ...existingStop.color }; // Clone color object

      // Place the new stop at the other end of the gradient
      if (existingStop.position < 0.5) {
        // If first stop is at the beginning
        newStop.position = 1;
        gradientFromPool.stops.push(newStop);
      } else {
        // If first stop is at the end or middle
        newStop.position = 0;
        gradientFromPool.stops.unshift(newStop); // Add to the beginning
      }
    }

    // Ensure stops are sorted by position as required by CSS and for interpolation
    gradientFromPool.stops.sort((a, b) => a.position - b.position);

    return gradientFromPool;
  } catch (error) {
    console.error(`Error parsing gradient: ${gradientStr}`, error);
    if (gradientFromPool) {
      // Release any stops that might have been added before the error
      gradientFromPool.stops.forEach((s) => gradientStopPool.release(s));
      gradientPool.release(gradientFromPool);
    }
    return null;
  }
}

/**
 * Helper function to split a string by commas while respecting parentheses
 * This is crucial for correctly parsing rgb/rgba values in gradients
 */
function splitRespectingParentheses(str: string): string[] {
  const result: string[] = [];
  let current = "";
  let depth = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (char === "(") {
      depth++;
      current += char;
    } else if (char === ")") {
      depth--;
      current += char;
    } else if (char === "," && depth === 0) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    // Add the last part if it's not empty
    result.push(current.trim());
  }
  return result.filter((part) => part !== ""); // Filter out any empty strings that might occur
}

/**
 * Determine the color format from a string
 */
function getColorFormat(color: string): "hex" | "rgb" | "rgba" | "hsl" | "hsla" | "named" {
  if (!color || typeof color !== "string") {
    return "named";
  }

  color = color.trim().toLowerCase();

  if (color.startsWith("#")) {
    return "hex";
  } else if (color.startsWith("rgba(")) {
    return "rgba"; // Check rgba before rgb
  } else if (color.startsWith("rgb(")) {
    return "rgb";
  } else if (color.startsWith("hsla(")) {
    return "hsla"; // Check hsla before hsl
  } else if (color.startsWith("hsl(")) {
    return "hsl";
  }

  // Basic check for named colors (this list is not exhaustive)
  const commonNamedColors =
    /^(transparent|black|white|red|green|blue|yellow|orange|purple|gray|grey|pink|brown|cyan|magenta)$/i;
  if (commonNamedColors.test(color)) return "named";

  // Fallback if it's an unknown format but not matching others
  console.warn(`Unknown color format for "${color}", defaulting to "named". Full parsing might be required.`);
  return "named";
}

/**
 * Calculates weighted Euclidean distance between two colors
 */
function colorDistance(color1: NumericalColor, color2: NumericalColor): number {
  // Weight RGB and A differently
  const rDiff = color1.r - color2.r;
  const gDiff = color1.g - color2.g;
  const bDiff = color1.b - color2.b;
  const aDiff = (color1.a - color2.a) * 255; // Scale alpha to similar range as RGB

  return Math.sqrt(
    rDiff * rDiff + gDiff * gDiff + bDiff * bDiff + aDiff * aDiff * 2 // Double weight on alpha
  );
}

/**
 * Finds optimal insertion point for a new stop based on both position and color.
 */
function findOptimalInsertionIndex(
  currentStops: NumericalGradientStop[],
  targetStops: NumericalGradientStop[],
  currentLength: number
): number {
  // Find target stops that aren't well-matched in current stops
  const unclaimedTargetStops = targetStops.filter((targetStop) => {
    // Check if this target stop has a close match in current stops
    return !currentStops.some((currentStop) => {
      const positionMatch = Math.abs(targetStop.position - currentStop.position) < 0.05;
      const colorMatch = colorDistance(targetStop.color, currentStop.color) < 40; // Threshold determined empirically
      return positionMatch && colorMatch;
    });
  });

  if (unclaimedTargetStops.length > 0) {
    // Sort by position to find the "next" unclaimed stop
    const sortedUnclaimed = [...unclaimedTargetStops].sort((a, b) => a.position - b.position);
    const nextUnclaimed = sortedUnclaimed[0];

    // Find insertion point for this position
    let insertAt = 0;
    while (insertAt < currentStops.length && currentStops[insertAt].position < nextUnclaimed.position) {
      insertAt++;
    }
    return insertAt;
  }

  // Fallback: Find largest gap in current stops
  if (currentStops.length <= 1) return currentStops.length;

  let maxGap = 0;
  let gapIndex = 0;

  for (let i = 0; i < currentStops.length - 1; i++) {
    const gap = currentStops[i + 1].position - currentStops[i].position;
    if (gap > maxGap) {
      maxGap = gap;
      gapIndex = i + 1;
    }
  }

  return gapIndex;
}

/**
 * Creates an interpolated stop, preferentially based on target stops.
 */
function createInterpolatedStop(
  currentStops: NumericalGradientStop[],
  insertIndex: number,
  targetStops: NumericalGradientStop[]
): NumericalGradientStop {
  // Determine position for the new stop
  let position: number;

  if (currentStops.length === 0) {
    // First stop in an empty list
    position = 0.5;
  } else if (insertIndex === 0) {
    // Inserting at beginning
    position = Math.max(0, currentStops[0].position / 2);
  } else if (insertIndex >= currentStops.length) {
    // Inserting at end
    position = Math.min(1, (1 + currentStops[currentStops.length - 1].position) / 2);
  } else {
    // Inserting between existing stops
    position = (currentStops[insertIndex - 1].position + currentStops[insertIndex].position) / 2;
  }

  // Try to find a target stop near this position
  let bestTargetStop: NumericalGradientStop | null = null;
  let bestDistance = Infinity;

  for (const targetStop of targetStops) {
    const distance = Math.abs(targetStop.position - position);
    if (distance < bestDistance && distance < 0.2) {
      // Within reasonable distance
      bestDistance = distance;
      bestTargetStop = targetStop;
    }
  }

  // If found a reasonable target stop, use its color
  if (bestTargetStop) {
    return {
      position: position,
      color: { ...bestTargetStop.color }, // Clone color
    };
  }

  // Otherwise interpolate color from adjacent stops
  let color: NumericalColor;

  if (currentStops.length === 0) {
    // Default gray if no stops exist
    color = { r: 128, g: 128, b: 128, a: 1 };
  } else if (insertIndex === 0) {
    // Copy first stop's color
    color = { ...currentStops[0].color };
  } else if (insertIndex >= currentStops.length) {
    // Copy last stop's color
    color = { ...currentStops[currentStops.length - 1].color };
  } else {
    // Interpolate between adjacent stops
    const prevStop = currentStops[insertIndex - 1];
    const nextStop = currentStops[insertIndex];
    const t = (position - prevStop.position) / (nextStop.position - prevStop.position);

    color = {
      r: prevStop.color.r + t * (nextStop.color.r - prevStop.color.r),
      g: prevStop.color.g + t * (nextStop.color.g - prevStop.color.g),
      b: prevStop.color.b + t * (nextStop.color.b - prevStop.color.b),
      a: prevStop.color.a + t * (nextStop.color.a - prevStop.color.a),
    };
  }

  return { position, color };
}

/**
 * Converts a numerical gradient back to a Gradient object
 */
export function numericalToGradient(numerical: NumericalGradient): Gradient {
  // Create or reuse gradient object
  const gradient = numerical._pooledGradient || gradientPool.get();

  // Set core properties
  gradient.type = numerical.type === 0 ? "linear" : numerical.type === 1 ? "radial" : "conic";
  gradient.angle = numerical.angle;
  gradient.shape = numerical.shape === 0 ? "circle" : "ellipse";

  // Clear existing stops if reusing object
  if (gradient.stops.length > 0) {
    gradient.stops.forEach((stop: GradientStop) => gradientStopPool.release(stop));
    gradient.stops = [];
  }

  // Create stops
  gradient.stops = numerical.stops.map((stop) => {
    const gradientStop = gradientStopPool.get();
    gradientStop.position = stop.position;
    gradientStop.color = {
      value: numericalToRgbaString(stop.color),
      format: "rgba",
    };
    return gradientStop;
  });

  return gradient;
}

/**
 * Converts a numerical gradient directly to a CSS string
 */
export function numericalToGradientString(numerical: NumericalGradient): string {
  const type = numerical.type === 0 ? "linear" : numerical.type === 1 ? "radial" : "conic";
  let prefix: string;

  if (type === "linear") {
    // Format angle to a reasonable precision, avoid excessive decimals
    // Normalize angle to 0-360 range
    const normalizedAngle = ((numerical.angle % 360) + 360) % 360;
    const angleStr = parseFloat(normalizedAngle.toFixed(2));
    prefix = `linear-gradient(${angleStr}deg`;
  } else if (type === "radial") {
    const shape = numerical.shape === 0 ? "circle" : "ellipse";
    // Radial gradients can have more complex parameters (size, position)
    // For simplicity, just using shape here.
    prefix = `radial-gradient(${shape}`;
  } else {
    // conic
    // Conic gradients can also have 'from <angle>' and 'at <position>'
    // Keeping it simple for now.
    prefix = "conic-gradient(";
  }

  const stops = numerical.stops
    .map((stop) => {
      // Format position to a reasonable precision
      const positionStr = parseFloat((stop.position * 100).toFixed(2));
      return `${numericalToRgbaString(stop.color)} ${positionStr}%`;
    })
    .join(", ");

  // Add comma separator if there are stops and the prefix requires it
  const separator = stops ? ", " : "";

  // For conic, the prefix is just "conic-gradient(", so stops don't need a leading comma if prefix is simple.
  // However, if the prefix included other parameters like "from angle", then a comma would be needed.
  // The current simple prefix for conic doesn't need a conditional comma like linear/radial.
  if (type === "conic") {
    return `${prefix}${stops})`;
  }

  return `${prefix}${separator}${stops})`;
}

/**
 * Safely releases a numerical gradient and its pooled resources
 */
export function releaseNumericalGradient(numerical: NumericalGradient): void {
  if (numerical._pooledGradient) {
    numerical._pooledGradient.stops.forEach((stop: GradientStop) => gradientStopPool.release(stop));
    gradientPool.release(numerical._pooledGradient);
    numerical._pooledGradient = undefined;
  }
}

/**
 * Enhanced normalizeStopCount with better stop matching and preservation.
 */
export function normalizeStopCount(current: NumericalGradient, target: NumericalGradient): NumericalGradient {
  // Deep clone current gradient to avoid modifying the original
  const result: NumericalGradient = {
    ...current,
    stops: current.stops.map((s) => ({
      position: s.position,
      color: { ...s.color },
    })),
    _stringRepresentation: current._stringRepresentation,
  };

  // Add stops if needed
  while (result.stops.length < target.stops.length) {
    const insertIndex = findOptimalInsertionIndex(result.stops, target.stops, result.stops.length);

    const newStop = createInterpolatedStop(result.stops, insertIndex, target.stops);

    result.stops.splice(insertIndex, 0, newStop);
  }

  // Remove stops if we have too many
  if (result.stops.length > target.stops.length) {
    // Identify stops to remove based on worst match to target stops
    let stopsToRemove = result.stops.length - target.stops.length;

    // Calculate "importance" of each stop based on match to target and uniqueness
    const stopImportance = result.stops.map((stop, index) => {
      // Find closest target stop
      let bestTargetMatch = Infinity;
      let colorMatch = Infinity;

      for (const targetStop of target.stops) {
        const posDistance = Math.abs(stop.position - targetStop.position);
        const colDistance = colorDistance(stop.color, targetStop.color);

        if (posDistance < bestTargetMatch) {
          bestTargetMatch = posDistance;
          colorMatch = colDistance;
        }
      }

      // Consider position in gradient when calculating importance
      // Stops at extremes (0, 1) or with unique colors are more important
      const positionImportance = stop.position < 0.05 || stop.position > 0.95 ? 2 : 1;

      // Lower importance = more likely to be removed
      const importance = -(bestTargetMatch * 5 + colorMatch * 0.02) * positionImportance;

      return { index, importance };
    });

    // Sort by importance (least important first)
    stopImportance.sort((a, b) => a.importance - b.importance);

    // Get indices to remove (least important)
    const indicesToRemove = stopImportance
      .slice(0, stopsToRemove)
      .map((item) => item.index)
      .sort((a, b) => b - a); // Sort descending to remove from end first

    // Remove the stops
    for (const index of indicesToRemove) {
      result.stops.splice(index, 1);
    }
  }

  // Ensure stops are sorted by position
  result.stops.sort((a, b) => a.position - b.position);

  return result;
}

/**
 * Clean up gradient objects - important for memory management
 */
export function cleanUpGradient(result: Gradient): void {
  // Same checks as in cleanup()
  if (result && result.stops) {
    result.stops.forEach((stop: GradientStop) => {
      if (stop) gradientStopPool.release(stop);
    });
  }
  if (result) gradientPool.release(result);
}
