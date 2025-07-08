/**
 * Tree-Shaking Optimization
 *
 * Removes unused styled components and their styles
 * to minimize bundle size
 */

import type { Plugin } from "vite";

// Safe import helper for optional dependencies
function safeBabelImport(moduleName: string) {
  try {
    return require(moduleName);
  } catch (e) {
    console.warn(`[Tree Shaking] Optional dependency ${moduleName} not found. Tree shaking will be limited.`);
    return null;
  }
}

export interface TreeShakingOptions {
  /**
   * Whether to analyze imports
   * @default true
   */
  analyzeImports?: boolean;

  /**
   * Whether to remove unused components
   * @default true
   */
  removeUnused?: boolean;

  /**
   * Whether to inline small components
   * @default false
   */
  inlineSmall?: boolean;

  /**
   * Size threshold for inlining (in characters)
   * @default 200
   */
  inlineThreshold?: number;

  /**
   * Whether to generate report
   * @default false
   */
  generateReport?: boolean;

  /**
   * Custom markers for used components
   */
  usedMarkers?: string[];
}

export interface ComponentUsage {
  name: string;
  file: string;
  used: boolean;
  size: number;
  references: string[];
  canBeInlined: boolean;
}

export interface TreeShakingReport {
  totalComponents: number;
  usedComponents: number;
  removedComponents: number;
  inlinedComponents: number;
  sizeBefore: number;
  sizeAfter: number;
  savings: number;
  savingsPercent: number;
  components: ComponentUsage[];
}

type UsageMap = Map<string, Set<string>>;

interface StyledImportAnalysis {
  components: Map<string, ComponentUsage>;
  hasStyled: boolean;
  imports: string[];
}

/**
 * Analyzes code for styled component usage patterns
 */
function analyzeStyledComponentUsage(code: string): StyledImportAnalysis {
  // Try to get babel modules
  const parser = safeBabelImport("@babel/parser");
  const traverse = safeBabelImport("@babel/traverse");
  const generator = safeBabelImport("@babel/generator");
  const t = safeBabelImport("@babel/types");

  if (!parser || !traverse || !generator || !t) {
    // Fallback analysis when babel is not available
    return {
      components: new Map(),
      hasStyled: code.includes("styled"),
      imports: [],
    };
  }

  try {
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
    });

    const analysis: StyledImportAnalysis = {
      components: new Map(),
      hasStyled: false,
      imports: [],
    };

    const traverseDefault = traverse.default || traverse;

    traverseDefault(ast, {
      ImportDeclaration(path: any) {
        if (path.node.source.value.includes("styled")) {
          analysis.hasStyled = true;
          analysis.imports.push(path.node.source.value);
        }
      },
      CallExpression(path: any) {
        if (
          t.isMemberExpression(path.node.callee) &&
          t.isIdentifier(path.node.callee.object) &&
          path.node.callee.object.name === "styled"
        ) {
          const tagName = t.isIdentifier(path.node.callee.property) ? path.node.callee.property.name : "unknown";

          if (!analysis.components.has(tagName)) {
            analysis.components.set(tagName, {
              name: tagName,
              file: "",
              used: false,
              size: 0,
              references: [],
              canBeInlined: false,
            });
          }
        }
      },
    });

    return analysis;
  } catch (error) {
    console.warn("[Tree Shaking] Failed to parse code:", error);
    return {
      components: new Map(),
      hasStyled: code.includes("styled"),
      imports: [],
    };
  }
}

/**
 * Analyze component usage in a file
 */
export function analyzeComponentUsage(
  code: string,
  filePath: string,
  options: TreeShakingOptions = {}
): ComponentUsage[] {
  const { analyzeImports = true, inlineThreshold = 200 } = options;

  // Get babel modules safely
  const parser = safeBabelImport("@babel/parser");
  const traverse = safeBabelImport("@babel/traverse");
  const generator = safeBabelImport("@babel/generator");
  const t = safeBabelImport("@babel/types");

  if (!parser || !traverse || !generator || !t) {
    console.warn("[Tree Shaking] Babel dependencies not available, skipping analysis");
    return [];
  }

  const ast = parser.parse(code, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });

  const components: Map<string, ComponentUsage> = new Map();
  const componentReferences: Map<string, Set<string>> = new Map();

  const traverseDefault = traverse.default || traverse;

  // First pass: Find all styled component definitions
  traverseDefault(ast, {
    VariableDeclarator(path: any) {
      const id = path.node.id;
      const init = path.node.init;

      if (
        t.isIdentifier(id) &&
        init &&
        t.isCallExpression(init) &&
        ((t.isIdentifier(init.callee) && init.callee.name === "styled") ||
          (t.isMemberExpression(init.callee) &&
            t.isIdentifier(init.callee.object) &&
            init.callee.object.name === "styled"))
      ) {
        const componentName = id.name;
        const componentCode = generator.default ? generator.default(init).code : generator(init).code;

        components.set(componentName, {
          name: componentName,
          file: filePath,
          used: false,
          size: componentCode.length,
          references: [],
          canBeInlined: componentCode.length <= inlineThreshold,
        });

        componentReferences.set(componentName, new Set());
      }
    },
  });

  // Second pass: Find all component usages
  traverseDefault(ast, {
    JSXIdentifier(path: any) {
      const name = path.node.name;

      if (components.has(name)) {
        const component = components.get(name)!;
        component.used = true;

        // Track where it's used
        const parentFunction = path.getFunctionParent();
        if (parentFunction) {
          const funcName = getFunctionName(parentFunction, t);
          component.references.push(funcName);
          componentReferences.get(name)!.add(funcName);
        }
      }
    },

    Identifier(path: any) {
      const name = path.node.name;

      // Check if it's used in a non-JSX context
      if (components.has(name) && !path.isReferencedIdentifier() && !path.isBindingIdentifier()) {
        const component = components.get(name)!;
        component.used = true;
      }
    },
  });

  // Analyze imports if requested
  if (analyzeImports) {
    traverseDefault(ast, {
      ImportSpecifier(path: any) {
        const imported = path.node.imported;
        if (t.isIdentifier(imported) && components.has(imported.name)) {
          components.get(imported.name)!.used = true;
        }
      },

      ExportSpecifier(path: any) {
        const exported = path.node.exported;
        if (t.isIdentifier(exported) && components.has(exported.name)) {
          components.get(exported.name)!.used = true;
        }
      },

      ExportDefaultDeclaration(path: any) {
        const declaration = path.node.declaration;
        if (t.isIdentifier(declaration) && components.has(declaration.name)) {
          components.get(declaration.name)!.used = true;
        }
      },
    });
  }

  return Array.from(components.values());
}

/**
 * Remove unused components from code
 */
export function removeUnusedComponents(
  code: string,
  usage: ComponentUsage[],
  options: TreeShakingOptions = {}
): { code: string; removed: string[] } {
  const { removeUnused = true, inlineSmall = false } = options;

  if (!removeUnused) {
    return { code, removed: [] };
  }

  // Get babel modules safely
  const parser = safeBabelImport("@babel/parser");
  const traverse = safeBabelImport("@babel/traverse");
  const generator = safeBabelImport("@babel/generator");
  const t = safeBabelImport("@babel/types");

  if (!parser || !traverse || !generator || !t) {
    console.warn("[Tree Shaking] Babel dependencies not available, skipping optimization");
    return { code, removed: [] };
  }

  const ast = parser.parse(code, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });

  const removed: string[] = [];
  const toInline = new Map<string, string>();

  // Collect components to remove or inline
  usage.forEach((component) => {
    if (!component.used) {
      removed.push(component.name);
    } else if (inlineSmall && component.canBeInlined) {
      // Mark for inlining
      toInline.set(component.name, "");
    }
  });

  const traverseDefault = traverse.default || traverse;

  // Remove unused components
  traverseDefault(ast, {
    VariableDeclaration(path: any) {
      const declarations = path.node.declarations.filter((decl: any) => {
        if (t.isIdentifier(decl.id) && removed.includes(decl.id.name)) {
          return false;
        }
        return true;
      });

      if (declarations.length === 0) {
        path.remove();
      } else if (declarations.length < path.node.declarations.length) {
        path.node.declarations = declarations;
      }
    },
  });

  // Inline small components if requested
  if (inlineSmall && toInline.size > 0) {
    traverseDefault(ast, {
      JSXElement(path: any) {
        const opening = path.node.openingElement;
        if (t.isJSXIdentifier(opening.name) && toInline.has(opening.name.name)) {
          // Replace with inline styles
          const inlineStyle = {
            type: "JSXAttribute",
            name: { type: "JSXIdentifier", name: "style" },
            value: { type: "JSXExpressionContainer", expression: t.objectExpression([]) },
          };

          opening.attributes.push(inlineStyle as any);
          opening.name.name = "div"; // Convert to div

          if (path.node.closingElement && t.isJSXIdentifier(path.node.closingElement.name)) {
            path.node.closingElement.name.name = "div";
          }
        }
      },
    });
  }

  const optimizedCode = generator.default
    ? generator.default(ast, {
        retainLines: true,
        compact: false,
      }).code
    : generator(ast, {
        retainLines: true,
        compact: false,
      }).code;

  return {
    code: optimizedCode,
    removed,
  };
}

/**
 * Generate tree-shaking report
 */
export function generateTreeShakingReport(
  originalCode: string,
  optimizedCode: string,
  usage: ComponentUsage[]
): TreeShakingReport {
  const totalComponents = usage.length;
  const usedComponents = usage.filter((c) => c.used).length;
  const removedComponents = totalComponents - usedComponents;
  const inlinedComponents = usage.filter((c) => c.used && c.canBeInlined).length;

  const sizeBefore = originalCode.length;
  const sizeAfter = optimizedCode.length;
  const savings = sizeBefore - sizeAfter;
  const savingsPercent = (savings / sizeBefore) * 100;

  return {
    totalComponents,
    usedComponents,
    removedComponents,
    inlinedComponents,
    sizeBefore,
    sizeAfter,
    savings,
    savingsPercent,
    components: usage,
  };
}

/**
 * Tree-shaking plugin for build tools
 */
export function treeShakingPlugin(options: TreeShakingOptions = {}) {
  const componentUsageMap = new Map<string, ComponentUsage[]>();
  let report: TreeShakingReport | null = null;

  return {
    name: "styled-components-tree-shaking",

    async transform(code: string, id: string) {
      if (!id.match(/\.(tsx?|jsx?)$/)) return;

      // Analyze component usage
      const usage = analyzeComponentUsage(code, id, options);
      componentUsageMap.set(id, usage);

      // Remove unused components
      const { code: optimizedCode, removed } = removeUnusedComponents(code, usage, options);

      if (removed.length > 0) {
        console.log(`[Tree-shaking] Removed ${removed.length} unused components from ${id}`);
      }

      return {
        code: optimizedCode,
        map: null,
      };
    },

    generateBundle(this: any) {
      if (options.generateReport) {
        // Aggregate all usage data
        const allUsage: ComponentUsage[] = [];
        let totalOriginalSize = 0;
        let totalOptimizedSize = 0;

        componentUsageMap.forEach((usage) => {
          allUsage.push(...usage);
          usage.forEach((component) => {
            totalOriginalSize += component.size;
            if (component.used) {
              totalOptimizedSize += component.size;
            }
          });
        });

        // Generate report
        report = {
          totalComponents: allUsage.length,
          usedComponents: allUsage.filter((c) => c.used).length,
          removedComponents: allUsage.filter((c) => !c.used).length,
          inlinedComponents: allUsage.filter((c) => c.used && c.canBeInlined).length,
          sizeBefore: totalOriginalSize,
          sizeAfter: totalOptimizedSize,
          savings: totalOriginalSize - totalOptimizedSize,
          savingsPercent: ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100,
          components: allUsage,
        };

        // Emit report - add safe check for emitFile
        if (this.emitFile) {
          this.emitFile({
            type: "asset",
            fileName: "tree-shaking-report.json",
            source: JSON.stringify(report, null, 2),
          });
        }

        console.log(`[Tree-shaking] Report generated: tree-shaking-report.json`);
        console.log(
          `[Tree-shaking] Removed ${report.removedComponents} components, saved ${report.savings} bytes (${report.savingsPercent.toFixed(2)}%)`
        );
      }
    },
  };
}

/**
 * Helper to get function name
 */
function getFunctionName(path: any, t: any): string {
  const node = path.node;

  if (t.isFunctionDeclaration(node) && node.id) {
    return node.id.name;
  }

  if (t.isVariableDeclarator(path.parent) && t.isIdentifier(path.parent.id)) {
    return path.parent.id.name;
  }

  if (t.isObjectProperty(path.parent) && t.isIdentifier(path.parent.key)) {
    return path.parent.key.name;
  }

  return "<anonymous>";
}

/**
 * Mark component as used (for manual marking)
 */
export function markComponentAsUsed(usage: ComponentUsage[], componentName: string): void {
  const component = usage.find((c) => c.name === componentName);
  if (component) {
    component.used = true;
  }
}

/**
 * Analyze cross-file dependencies
 */
export async function analyzeCrossFileDependencies(files: Map<string, string>): Promise<Map<string, Set<string>>> {
  const dependencies = new Map<string, Set<string>>();

  // Get babel modules safely
  const parser = safeBabelImport("@babel/parser");
  const traverse = safeBabelImport("@babel/traverse");

  if (!parser || !traverse) {
    console.warn("[Tree Shaking] Babel dependencies not available, skipping cross-file analysis");
    return dependencies;
  }

  for (const [filePath, code] of files) {
    try {
      const ast = parser.parse(code, {
        sourceType: "module",
        plugins: ["jsx", "typescript"],
      });

      const fileDeps = new Set<string>();
      const traverseDefault = traverse.default || traverse;

      traverseDefault(ast, {
        ImportDeclaration(path: any) {
          const source = path.node.source.value;
          if (source.startsWith(".")) {
            fileDeps.add(source);
          }
        },
      });

      dependencies.set(filePath, fileDeps);
    } catch (error) {
      console.warn(`[Tree Shaking] Failed to analyze dependencies for ${filePath}:`, error);
      dependencies.set(filePath, new Set());
    }
  }

  return dependencies;
}
