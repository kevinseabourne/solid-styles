/**
 * Critical CSS Extraction
 *
 * Identifies and extracts CSS for above-the-fold content
 * to improve First Contentful Paint (FCP) and Largest Contentful Paint (LCP)
 */

// Safe import function for optional dependencies
function safeImport(moduleName: string) {
  try {
    return require(moduleName);
  } catch (e) {
    console.warn(`[Critical CSS] Optional dependency ${moduleName} not found. Some features may be limited.`);
    return null;
  }
}

// Lazy load parse function
function getParser() {
  const nodeHtmlParser = safeImport("node-html-parser");
  return nodeHtmlParser?.parse || null;
}

// Safe parse HTML function
function parseHTML(html: string) {
  const parse = getParser();
  if (!parse) {
    console.warn("[Critical CSS] HTML parsing not available, using regex fallback");
    return null;
  }
  return parse(html);
}

// Removed import - using safe import pattern instead

export interface CriticalCSSOptions {
  /**
   * HTML content or path to HTML file
   */
  html: string | string[];

  /**
   * CSS content to extract critical styles from
   */
  css: string;

  /**
   * Viewport dimensions for above-the-fold calculation
   */
  viewport?: {
    width: number;
    height: number;
  };

  /**
   * Whether to inline critical CSS
   * @default true
   */
  inline?: boolean;

  /**
   * Whether to extract critical CSS for multiple viewports
   * @default false
   */
  responsive?: boolean;

  /**
   * Viewports for responsive critical CSS
   */
  viewports?: Array<{
    name: string;
    width: number;
    height: number;
  }>;

  /**
   * Selectors to always include
   */
  include?: string[];

  /**
   * Selectors to always exclude
   */
  exclude?: string[];

  /**
   * Maximum size for inlined CSS (in KB)
   * @default 14
   */
  maxSize?: number;
}

interface CriticalCSSResult {
  /**
   * Critical CSS content
   */
  critical: string;

  /**
   * Non-critical CSS content
   */
  nonCritical: string;

  /**
   * Size of critical CSS in bytes
   */
  criticalSize: number;

  /**
   * Selectors identified as critical
   */
  criticalSelectors: string[];

  /**
   * Performance metrics
   */
  metrics: {
    extractionTime: number;
    totalSelectors: number;
    criticalSelectors: number;
    compression: number;
  };
}

/**
 * Extract critical CSS from HTML and CSS
 */
export async function extractCriticalCSS(options: CriticalCSSOptions): Promise<CriticalCSSResult> {
  const startTime = Date.now();

  const {
    html,
    css,
    viewport = { width: 1920, height: 1080 },
    inline = true,
    responsive = false,
    viewports = [
      { name: "mobile", width: 375, height: 667 },
      { name: "tablet", width: 768, height: 1024 },
      { name: "desktop", width: 1920, height: 1080 },
    ],
    include = [],
    exclude = [],
    maxSize = 14,
  } = options;

  // Parse CSS and extract rules
  const cssRules = parseCSSRules(css);
  const criticalSelectors = new Set<string>();
  const criticalRules: string[] = [];

  // Process HTML to find visible elements
  const htmlContents = Array.isArray(html) ? html : [html];

  for (const htmlContent of htmlContents) {
    const visibleSelectors = await findVisibleSelectors(htmlContent, responsive ? viewports : [viewport]);

    visibleSelectors.forEach((selector) => criticalSelectors.add(selector));
  }

  // Always include specified selectors
  include.forEach((selector) => criticalSelectors.add(selector));

  // Remove excluded selectors
  exclude.forEach((selector) => criticalSelectors.delete(selector));

  // Extract critical CSS rules
  let criticalCSS = "";
  let nonCriticalCSS = "";

  cssRules.forEach((rule) => {
    const isCritical = isCriticalRule(rule, criticalSelectors);

    if (isCritical) {
      criticalRules.push(rule.cssText);
      criticalCSS += rule.cssText + "\n";
    } else {
      nonCriticalCSS += rule.cssText + "\n";
    }
  });

  // Optimize critical CSS
  criticalCSS = await optimizeCriticalCSS(criticalCSS, {
    maxSize: maxSize * 1024,
    inline,
  });

  const extractionTime = Date.now() - startTime;

  return {
    critical: criticalCSS,
    nonCritical: nonCriticalCSS,
    criticalSize: Buffer.byteLength(criticalCSS),
    criticalSelectors: Array.from(criticalSelectors),
    metrics: {
      extractionTime,
      totalSelectors: cssRules.length,
      criticalSelectors: criticalSelectors.size,
      compression: criticalCSS.length / css.length,
    },
  };
}

/**
 * Parse CSS into rules
 */
function parseCSSRules(css: string): Array<{
  selector: string;
  cssText: string;
  type: string;
}> {
  const rules: Array<{
    selector: string;
    cssText: string;
    type: string;
  }> = [];

  // Simple CSS parser (in production, use a proper CSS parser)
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let match;

  while ((match = ruleRegex.exec(css)) !== null) {
    const selector = match[1].trim();
    const declarations = match[2].trim();

    rules.push({
      selector,
      cssText: `${selector} { ${declarations} }`,
      type: getTypeFromSelector(selector),
    });
  }

  // Also parse at-rules
  const atRuleRegex = /@[^{]+\{[^}]*\}/g;
  const atRules = css.match(atRuleRegex) || [];

  atRules.forEach((rule) => {
    rules.push({
      selector: rule.match(/@[^{]+/)?.[0] || "",
      cssText: rule,
      type: "at-rule",
    });
  });

  return rules;
}

/**
 * Find visible selectors in HTML for given viewports
 */
async function findVisibleSelectors(
  html: string,
  viewports: Array<{ width: number; height: number }>
): Promise<Set<string>> {
  const visibleSelectors = new Set<string>();

  // Parse HTML
  const parsedHtml = parseHTML(html);

  // Fallback if parsing failed
  if (!parsedHtml) {
    // Use regex to extract tag names and classes as fallback
    const tagMatches = html.match(/<(\w+)/g) || [];
    const classMatches = html.match(/class="([^"]+)"/g) || [];
    const idMatches = html.match(/id="([^"]+)"/g) || [];

    tagMatches.forEach((match) => {
      const tag = match.replace("<", "");
      visibleSelectors.add(tag.toLowerCase());
    });

    classMatches.forEach((match) => {
      const classes = match.match(/"([^"]+)"/)?.[1].split(" ") || [];
      classes.forEach((cls) => visibleSelectors.add(`.${cls.trim()}`));
    });

    idMatches.forEach((match) => {
      const id = match.match(/"([^"]+)"/)?.[1];
      if (id) visibleSelectors.add(`#${id}`);
    });

    // Add essential selectors
    ["html", "body", ":root", "*"].forEach((selector) => {
      visibleSelectors.add(selector);
    });

    return visibleSelectors;
  }

  const root = parsedHtml;

  // Find all elements
  const elements = root.querySelectorAll("*");

  for (const element of elements) {
    // Get element position (simplified - in production use a headless browser)
    const isAboveFold = isElementAboveFold(element, viewports[0]);

    if (isAboveFold) {
      // Add element selectors
      if (element.id) {
        visibleSelectors.add(`#${element.id}`);
      }

      if (element.classList && element.classList.length > 0) {
        element.classList.forEach((className: string) => {
          visibleSelectors.add(`.${className}`);
        });
      }

      // Add tag name
      visibleSelectors.add(element.tagName.toLowerCase());

      // Add attribute selectors
      const attributes = element.attributes;
      Object.keys(attributes).forEach((attr) => {
        if (attr !== "id" && attr !== "class") {
          visibleSelectors.add(`[${attr}]`);
          visibleSelectors.add(`[${attr}="${attributes[attr]}"]`);
        }
      });
    }
  }

  // Add essential selectors
  ["html", "body", ":root", "*"].forEach((selector) => {
    visibleSelectors.add(selector);
  });

  return visibleSelectors;
}

/**
 * Check if element is above the fold
 */
function isElementAboveFold(element: any, viewport: { width: number; height: number }): boolean {
  // Simplified check - in production, use actual rendering
  // Check if element is likely to be visible based on common patterns

  const tagName = element.tagName.toLowerCase();
  const classes = element.classList || [];
  const id = element.id;

  // Always include certain elements
  const alwaysInclude = ["html", "body", "head", "meta", "title", "link", "header", "nav", "main", "h1", "h2", "h3"];

  if (alwaysInclude.includes(tagName)) {
    return true;
  }

  // Check for hero/above-fold classes
  const aboveFoldClasses = [
    "hero",
    "banner",
    "header",
    "nav",
    "navigation",
    "above-fold",
    "critical",
    "splash",
    "landing",
  ];

  if (classes.some((c: string) => aboveFoldClasses.some((afc) => c.toLowerCase().includes(afc)))) {
    return true;
  }

  // Check position in DOM (first few elements are likely above fold)
  const allElements = element.parentNode?.querySelectorAll("*") || [];
  const elementIndex = Array.from(allElements).indexOf(element);

  return elementIndex < 50; // First 50 elements likely above fold
}

/**
 * Check if a CSS rule is critical
 */
function isCriticalRule(rule: { selector: string; type: string }, criticalSelectors: Set<string>): boolean {
  // Always include certain rules
  if (rule.type === "at-rule") {
    const atRule = rule.selector;
    // Include font-face, charset, viewport
    if (atRule.includes("@font-face") || atRule.includes("@charset") || atRule.includes("@viewport")) {
      return true;
    }
    // Skip animations for critical CSS
    if (atRule.includes("@keyframes")) {
      return false;
    }
  }

  // Check if selector matches critical selectors
  const selector = rule.selector;

  // Direct match
  if (criticalSelectors.has(selector)) {
    return true;
  }

  // Check if selector contains critical parts
  for (const criticalSelector of criticalSelectors) {
    if (selector.includes(criticalSelector)) {
      return true;
    }
  }

  // Check for universal selectors that should be included
  const universalSelectors = ["*", ":root", "html", "body"];
  if (universalSelectors.some((us) => selector.includes(us))) {
    return true;
  }

  return false;
}

/**
 * Get rule type from selector
 */
function getTypeFromSelector(selector: string): string {
  if (selector.startsWith("@")) {
    return "at-rule";
  }
  if (selector.includes(":")) {
    return "pseudo";
  }
  if (selector.startsWith(".")) {
    return "class";
  }
  if (selector.startsWith("#")) {
    return "id";
  }
  if (selector.includes("[")) {
    return "attribute";
  }
  return "element";
}

/**
 * Optimize critical CSS
 */
async function optimizeCriticalCSS(css: string, options: { maxSize: number; inline: boolean }): Promise<string> {
  let optimized = css;

  // Remove comments
  optimized = optimized.replace(/\/\*[\s\S]*?\*\//g, "");

  // Remove empty rules
  optimized = optimized.replace(/[^{}]+\{\s*\}/g, "");

  // Minify whitespace
  optimized = optimized
    .replace(/\s+/g, " ")
    .replace(/\s*{\s*/g, "{")
    .replace(/\s*}\s*/g, "}")
    .replace(/\s*:\s*/g, ":")
    .replace(/\s*;\s*/g, ";")
    .trim();

  // If still too large, prioritize rules
  if (Buffer.byteLength(optimized) > options.maxSize) {
    optimized = prioritizeCriticalRules(optimized, options.maxSize);
  }

  return optimized;
}

/**
 * Prioritize critical rules when size limit is exceeded
 */
function prioritizeCriticalRules(css: string, maxSize: number): string {
  const rules = css.match(/[^}]+\}[^{]*/g) || [];

  // Score rules by importance
  const scoredRules = rules.map((rule) => ({
    rule,
    score: calculateRuleImportance(rule),
  }));

  // Sort by importance
  scoredRules.sort((a, b) => b.score - a.score);

  // Take most important rules up to size limit
  let result = "";
  let currentSize = 0;

  for (const { rule } of scoredRules) {
    const ruleSize = Buffer.byteLength(rule);
    if (currentSize + ruleSize <= maxSize) {
      result += rule;
      currentSize += ruleSize;
    }
  }

  return result;
}

/**
 * Calculate importance score for a CSS rule
 */
function calculateRuleImportance(rule: string): number {
  let score = 0;

  // Layout properties are most important
  if (rule.includes("display:") || rule.includes("position:") || rule.includes("flex") || rule.includes("grid")) {
    score += 10;
  }

  // Sizing properties
  if (rule.includes("width:") || rule.includes("height:") || rule.includes("margin:") || rule.includes("padding:")) {
    score += 8;
  }

  // Typography
  if (rule.includes("font") || rule.includes("text") || rule.includes("line-height")) {
    score += 6;
  }

  // Colors and backgrounds
  if (rule.includes("color:") || rule.includes("background")) {
    score += 4;
  }

  // Element selectors get priority
  if (!/[.#]/.test(rule.split("{")[0])) {
    score += 5;
  }

  // Root and body get highest priority
  if (rule.includes(":root") || rule.includes("html") || rule.includes("body")) {
    score += 15;
  }

  return score;
}

/**
 * Generate inline critical CSS for HTML
 */
export function inlineCriticalCSS(
  html: string,
  criticalCSS: string,
  options: {
    noscript?: boolean;
    loadAsync?: boolean;
  } = {}
): string {
  const { noscript = true, loadAsync = true } = options;

  // Create inline style tag
  const inlineStyle = `<style>${criticalCSS}</style>`;

  // Create async CSS loading script
  const asyncScript = loadAsync
    ? `
    <script>
      // Load non-critical CSS asynchronously
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/css/styles.css';
      link.media = 'print';
      link.onload = function() { this.media = 'all'; };
      document.head.appendChild(link);
    </script>
  `
    : "";

  // Create noscript fallback
  const noscriptFallback = noscript
    ? `
    <noscript>
      <link rel="stylesheet" href="/css/styles.css">
    </noscript>
  `
    : "";

  // Insert into HTML head
  let result = html;
  const headEnd = result.indexOf("</head>");

  if (headEnd !== -1) {
    result = result.slice(0, headEnd) + inlineStyle + asyncScript + noscriptFallback + result.slice(headEnd);
  }

  return result;
}
