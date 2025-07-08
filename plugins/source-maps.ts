/**
 * Source Maps Plugin
 *
 * Generates accurate source maps for solid-styles
 * Maintains mapping from original code to generated CSS
 */

// Type declarations for source-map module
interface SourceMapMapping {
  generated: { line: number; column: number };
  source: string;
  original: { line: number; column: number };
  name?: string;
}

interface SourceMapConsumerMapping {
  source: string;
  generatedLine: number;
  generatedColumn: number;
  originalLine: number;
  originalColumn: number;
  name?: string;
}

interface SourceMapGeneratorInterface {
  addMapping(mapping: SourceMapMapping): void;
  setSourceContent(source: string, content: string): void;
  toString(): string;
}

interface SourceMapConsumerInterface {
  sources: string[];
  eachMapping(callback: (mapping: SourceMapConsumerMapping) => void): void;
  sourceContentFor(source: string): string | null;
  destroy(): void;
}

interface SourceMapModule {
  SourceMapGenerator: new (options: { file: string; sourceRoot?: string }) => SourceMapGeneratorInterface;
  SourceMapConsumer: new (map: string) => SourceMapConsumerInterface;
}

// Safe import function for optional dependencies
function safeImport(moduleName: string): any {
  try {
    return require(moduleName);
  } catch (e) {
    console.warn(`[Source Maps] Optional dependency ${moduleName} not found. Source maps will be limited.`);
    return null;
  }
}

// Lazy load source-map module
function getSourceMapGenerator():
  | (new (options: { file: string; sourceRoot?: string }) => SourceMapGeneratorInterface)
  | null {
  const sourceMap = safeImport("source-map");
  return sourceMap?.SourceMapGenerator || null;
}

function getSourceMapConsumer(): (new (map: string) => SourceMapConsumerInterface) | null {
  const sourceMap = safeImport("source-map");
  return sourceMap?.SourceMapConsumer || null;
}

// Safe import for source-map types
function getSourceMapModule(): SourceMapModule | null {
  const sourceMap = safeImport("source-map");
  if (!sourceMap) return null;

  return {
    SourceMapGenerator: sourceMap.SourceMapGenerator,
    SourceMapConsumer: sourceMap.SourceMapConsumer,
  };
}

import path from "path";

export interface SourceMapOptions {
  /**
   * Whether to generate inline source maps
   * @default false
   */
  inline?: boolean;

  /**
   * Whether to include source content in maps
   * @default true
   */
  includeContent?: boolean;

  /**
   * Source root URL
   */
  sourceRoot?: string;

  /**
   * Output directory for source map files
   */
  outputDir?: string;
}

export interface ComponentSource {
  /**
   * Component name
   */
  name: string;

  /**
   * Original source file path
   */
  file: string;

  /**
   * Line number in source file
   */
  line: number;

  /**
   * Column number in source file
   */
  column: number;

  /**
   * Original source content
   */
  content?: string;

  /**
   * Generated CSS
   */
  css: string;

  /**
   * Generated class name
   */
  className: string;
}

/**
 * Generate source map for styled components
 */
export function generateSourceMap(
  components: ComponentSource[],
  options: SourceMapOptions = {}
): { css: string; map: string } {
  const { inline = false, includeContent = true, sourceRoot = "", outputDir = "dist" } = options;

  const SourceMapGeneratorClass = getSourceMapGenerator();
  if (!SourceMapGeneratorClass) {
    // Fallback when source-map is not available
    const basicMap = JSON.stringify({
      version: 3,
      sources: components.map((c) => c.file),
      names: components.map((c) => c.name),
      mappings: "",
      sourcesContent: includeContent ? components.map((c) => c.content || "") : undefined,
    });

    const cssOutput = components.map((c) => c.css).join("\n");
    return { css: cssOutput, map: basicMap };
  }

  const generator = new SourceMapGeneratorClass({
    file: "solid-styles.css",
    sourceRoot,
  });

  let cssOutput = "";
  let currentLine = 1;
  let currentColumn = 1;

  // Process each component
  components.forEach((component) => {
    // Add source mapping
    generator.addMapping({
      generated: {
        line: currentLine,
        column: currentColumn,
      },
      source: component.file,
      original: {
        line: component.line,
        column: component.column,
      },
      name: component.name,
    });

    // Add source content if requested
    if (includeContent && component.content) {
      generator.setSourceContent(component.file, component.content);
    }

    // Add CSS with comment
    const cssWithComment = `/* ${component.name} from ${component.file}:${component.line}:${component.column} */\n${component.css}\n`;
    cssOutput += cssWithComment;

    // Update position tracking
    const lines = cssWithComment.split("\n");
    currentLine += lines.length - 1;

    if (lines.length > 1) {
      currentColumn = lines[lines.length - 1].length + 1;
    } else {
      currentColumn += cssWithComment.length;
    }
  });

  // Generate source map
  const sourceMap = generator.toString();

  // Add source map reference
  if (inline) {
    const base64Map = Buffer.from(sourceMap).toString("base64");
    cssOutput += `\n/*# sourceMappingURL=data:application/json;base64,${base64Map} */`;
  } else {
    cssOutput += `\n/*# sourceMappingURL=solid-styles.css.map */`;
  }

  return {
    css: cssOutput,
    map: sourceMap,
  };
}

/**
 * Extract component source information from code
 */
export function extractComponentSource(code: string, filePath: string): ComponentSource[] {
  const components: ComponentSource[] = [];

  // Regular expression to match styled components
  const styledRegex = /(?:const|let|var)\s+(\w+)\s*=\s*styled(?:\.\w+|\(['"`]\w+['"`]\))?\s*`([^`]+)`/g;

  // Split code into lines for line number tracking
  const lines = code.split("\n");

  let match;
  while ((match = styledRegex.exec(code)) !== null) {
    const componentName = match[1];
    const cssContent = match[2];
    const matchIndex = match.index;

    // Calculate line and column
    let currentIndex = 0;
    let line = 1;
    let column = 1;

    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + 1; // +1 for newline

      if (currentIndex + lineLength > matchIndex) {
        column = matchIndex - currentIndex + 1;
        break;
      }

      currentIndex += lineLength;
      line++;
    }

    // Generate class name
    const className = `sc-${componentName}-${generateHash(cssContent)}`;

    components.push({
      name: componentName,
      file: filePath,
      line,
      column,
      content: code,
      css: `.${className} {\n${cssContent}\n}`,
      className,
    });
  }

  return components;
}

/**
 * Create source map for a single component
 */
export function createComponentSourceMap(component: ComponentSource, options: SourceMapOptions = {}): string {
  const SourceMapGeneratorClass = getSourceMapGenerator();
  if (!SourceMapGeneratorClass) {
    // Fallback when source-map is not available
    return JSON.stringify({
      version: 3,
      file: `${component.className}.css`,
      sourceRoot: options.sourceRoot || "",
      sources: [component.file],
      names: [component.name],
      mappings: "AAAA",
      sourcesContent: options.includeContent ? [component.content || ""] : undefined,
    });
  }

  const generator = new SourceMapGeneratorClass({
    file: `${component.className}.css`,
    sourceRoot: options.sourceRoot || "",
  });

  // Add mapping for the component
  generator.addMapping({
    generated: { line: 1, column: 1 },
    source: component.file,
    original: { line: component.line, column: component.column },
    name: component.name,
  });

  // Add source content
  if (options.includeContent && component.content) {
    generator.setSourceContent(component.file, component.content);
  }

  return generator.toString();
}

/**
 * Merge multiple source maps
 */
export async function mergeSourceMaps(maps: string[]): Promise<string> {
  const sourceMapModule = getSourceMapModule();
  if (!sourceMapModule) {
    // Fallback: just return a basic combined map
    return JSON.stringify({
      version: 3,
      sources: [],
      names: [],
      mappings: "",
      sourcesContent: [],
    });
  }

  const { SourceMapConsumer, SourceMapGenerator } = sourceMapModule;

  const generator = new SourceMapGenerator({
    file: "solid-styles-merged.css",
  });

  // Process each map
  for (const mapString of maps) {
    const consumer = new SourceMapConsumer(mapString);

    consumer.eachMapping((mapping: SourceMapConsumerMapping) => {
      if (mapping.source) {
        generator.addMapping({
          generated: {
            line: mapping.generatedLine,
            column: mapping.generatedColumn,
          },
          source: mapping.source,
          original: {
            line: mapping.originalLine,
            column: mapping.originalColumn,
          },
          name: mapping.name || undefined,
        });
      }
    });

    // Copy source contents
    consumer.sources.forEach((source: string) => {
      const content = consumer.sourceContentFor(source);
      if (content) {
        generator.setSourceContent(source, content);
      }
    });

    consumer.destroy();
  }

  return generator.toString();
}

/**
 * Validate source map
 */
export async function validateSourceMap(css: string, sourceMap: string): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    const sourceMapModule = getSourceMapModule();
    if (!sourceMapModule) {
      errors.push("Source map module not available");
      return { valid: false, errors };
    }

    const { SourceMapConsumer } = sourceMapModule;
    const consumer = new SourceMapConsumer(sourceMap);

    // Check that all sources exist
    consumer.sources.forEach((source: string) => {
      if (!source) {
        errors.push("Empty source path found");
      }
    });

    // Validate mappings
    let hasValidMappings = false;
    consumer.eachMapping((mapping: SourceMapConsumerMapping) => {
      hasValidMappings = true;

      if (!mapping.source) {
        errors.push(`Mapping without source at ${mapping.generatedLine}:${mapping.generatedColumn}`);
      }

      if (mapping.originalLine < 1 || mapping.originalColumn < 0) {
        errors.push(`Invalid original position: ${mapping.originalLine}:${mapping.originalColumn}`);
      }
    });

    if (!hasValidMappings) {
      errors.push("No valid mappings found");
    }

    consumer.destroy();

    // Check CSS has source map reference
    if (!css.includes("sourceMappingURL")) {
      errors.push("CSS missing source map reference");
    }
  } catch (error) {
    errors.push(`Source map parsing error: ${(error as Error).message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate hash for content
 */
function generateHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 8);
}

/**
 * Create development-friendly source maps
 */
export function createDevSourceMap(component: ComponentSource): string {
  const devMap = {
    version: 3,
    file: `${component.className}.css`,
    sourceRoot: "",
    sources: [component.file],
    names: [component.name],
    mappings: "AAAA",
    sourcesContent: [component.content || ""],
  };

  return JSON.stringify(devMap, null, 2);
}

/**
 * Source map plugin for build tools
 */
export function sourceMapPlugin(options: SourceMapOptions = {}) {
  const cache = new Map();

  return {
    name: "solid-styles-source-maps",
    cache,

    async transform(code: string, id: string) {
      if (!id.match(/\.(tsx?|jsx?)$/)) return;

      const components = extractComponentSource(code, id);
      if (components.length === 0) return;

      // Generate source maps for components
      const sourceMaps = components.map((component) => createComponentSourceMap(component, options));

      // Store for later processing
      cache.set(id, { components, sourceMaps });

      return null;
    },

    async generateBundle() {
      const allComponents: ComponentSource[] = [];

      // Collect all components
      for (const [id, data] of cache) {
        allComponents.push(...data.components);
      }

      // Generate combined source map
      const { css, map } = generateSourceMap(allComponents, options);

      // Emit files using context
      const emitFile = (this as any).emitFile;
      if (emitFile) {
        emitFile({
          type: "asset",
          fileName: "solid-styles.css",
          source: css,
        });

        if (!options.inline) {
          emitFile({
            type: "asset",
            fileName: "solid-styles.css.map",
            source: map,
          });
        }
      }
    },
  };
}
