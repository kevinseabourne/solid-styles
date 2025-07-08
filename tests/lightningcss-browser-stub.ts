// Lightweight browser stub for the `lightningcss` native module.
// We only implement the subset of the API that our code under test relies on.

export interface TransformResult {
  code: string;
  map?: string | null;
}

export interface TransformOptions {
  code: Uint8Array | string;
  filename?: string;
  minify?: boolean;
  sourceMap?: boolean;
  targets?: any;
  include?: any;
  exclude?: any;
  errorRecovery?: boolean;
}

export function transform(options: TransformOptions): TransformResult {
  console.log("[STUB] ===== TRANSFORM CALLED =====");
  console.log("[STUB] transform called with options:", JSON.stringify(options, null, 2));

  // Simple stub that just returns the input code with basic minification
  let code = typeof options.code === "string" ? options.code : new TextDecoder().decode(options.code);

  console.log("[STUB] input code type:", typeof code);
  console.log("[STUB] input code value:", code);

  if (options.minify) {
    // Basic minification for testing
    code = code
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove comments
      .replace(/\s+/g, " ") // Collapse whitespace
      .replace(/\s*([{}:;,])\s*/g, "$1") // Remove spaces around punctuation
      .trim();
  }

  // Add basic vendor prefixes for user-select in test mode
  if (code.includes("user-select:none")) {
    code = code.replace("user-select:none", "-webkit-user-select:none;-moz-user-select:none;user-select:none");
  }

  console.log("[STUB] processed code type:", typeof code);
  console.log("[STUB] processed code value:", code);

  const result = {
    code: code, // Return string directly, not encoded
    map: null,
  };

  console.log("[STUB] result type:", typeof result);
  console.log("[STUB] result.code type:", typeof result.code);
  console.log("[STUB] result.code value:", result.code);
  console.log("[STUB] result object:", JSON.stringify(result, null, 2));
  console.log("[STUB] ===== TRANSFORM END =====");

  return result;
}

export function browserslistToTargets() {
  return {};
}

export const Features = {
  VendorPrefixes: 1,
  Colors: 2,
  Nesting: 4,
  LogicalProperties: 8,
} as Record<string, number>;
