#!/usr/bin/env node

import { dirname, resolve } from 'node:path';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Color utilities
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function findProjectRoot() {
  let currentDir = process.cwd();
  
  while (currentDir !== dirname(currentDir)) {
    const packageJsonPath = resolve(currentDir, 'package.json');
    
    if (await fileExists(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        if (deps['solid-styles']) {
          return currentDir;
        }
      } catch (error) {
        // Continue searching
      }
    }
    
    currentDir = dirname(currentDir);
  }
  
  return process.cwd();
}

async function detectTypeScript(rootDir) {
  const packageJsonPath = resolve(rootDir, 'package.json');
  const tsconfigPath = resolve(rootDir, 'tsconfig.json');
  
  // Check for tsconfig.json
  if (await fileExists(tsconfigPath)) {
    return true;
  }
  
  // Check for TypeScript in dependencies
  if (await fileExists(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (deps['typescript'] || deps['@types/node']) {
        return true;
      }
    } catch (error) {
      // Continue checking
    }
  }
  
  // Check for .ts/.tsx files in src directory
  const srcDir = resolve(rootDir, 'src');
  if (await fileExists(srcDir)) {
    try {
      const files = await fs.readdir(srcDir);
      return files.some(file => file.endsWith('.ts') || file.endsWith('.tsx'));
    } catch (error) {
      // Continue
    }
  }
  
  return false;
}

async function detectFramework(rootDir) {
  const packageJsonPath = resolve(rootDir, 'package.json');
  
  if (!(await fileExists(packageJsonPath))) return { framework: 'solid', bundler: 'vite', typescript: false };
  
  try {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const typescript = await detectTypeScript(rootDir);
    
    // Debug: Log detected packages (only in verbose mode)
    if (process.env.VERBOSE) {
      log('\n🔍 Detected packages:', 'cyan');
      const relevantPkgs = ['astro', '@astrojs/solid-js', '@astrojs/solid', 'solid-js', '@solidjs/start', 'solid-start', '@tauri-apps/api', '@tauri-apps/plugin-opener'];
      relevantPkgs.forEach(pkg => {
        if (deps[pkg]) log(`  ✓ ${pkg}`, 'green');
      });
      log('');
    }
    
    // Detect Tauri + SolidJS (check for Tauri-specific packages)
    if ((deps['@tauri-apps/api'] || deps['@tauri-apps/plugin-opener'] || deps['@tauri-apps/cli']) && deps['solid-js']) {
      return { framework: 'tauri', bundler: 'vite', typescript };
    }
    
    // Detect Astro + SolidJS (check multiple variations)
    if (deps['astro'] && (deps['@astrojs/solid-js'] || deps['@astrojs/solid'])) {
      return { framework: 'astro', bundler: 'vite', typescript };
    }
    
    // Also check if Astro is present with solid-js (user might have installed solid-js separately)
    if (deps['astro'] && deps['solid-js']) {
      return { framework: 'astro', bundler: 'vite', typescript };
    }
    
    // Detect SolidStart (uses Vinxi)
    if (deps['@solidjs/start'] || deps['solid-start']) {
      return { framework: 'solid-start', bundler: 'vinxi', typescript };
    }
    
    // Detect regular Solid (uses Vite)
    if (deps['solid-js']) {
      return { framework: 'solid', bundler: 'vite', typescript };
    }
    
    return { framework: 'solid', bundler: 'vite', typescript };
  } catch (error) {
    return { framework: 'solid', bundler: 'vite', typescript: false };
  }
}

async function findEntryPoint(rootDir, preferTypeScript = false) {
  // If TypeScript is preferred, check .ts/.tsx files first
  const possibleEntries = preferTypeScript ? [
    'src/index.ts',
    'src/index.tsx', 
    'src/main.ts',
    'src/main.tsx',
    'src/App.ts',
    'src/App.tsx',
    'src/index.js',
    'src/main.js',
    'src/App.js'
  ] : [
    'src/index.js',
    'src/index.ts', 
    'src/index.tsx',
    'src/main.js',
    'src/main.ts',
    'src/App.js',
    'src/App.tsx'
  ];
  
  for (const entry of possibleEntries) {
    const entryPath = resolve(rootDir, entry);
    if (await fileExists(entryPath)) {
      return entryPath;
    }
  }
  
  return null;
}

async function injectThemeImport(filePath, typescript = false) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Check if theme is already imported
    if (content.includes('from "./theme"') || content.includes('from "./src/theme"')) {
      return false; // Already imported
    }
    
    // Find the last import statement
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }
    
    // Add theme import after last import (TypeScript projects might need type import)
    const themeImport = typescript ? 
      'import { theme, type Theme } from "./theme";' : 
      'import { theme } from "./theme";';
    
    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, themeImport);
    } else {
      lines.unshift(themeImport);
    }
    
    await fs.writeFile(filePath, lines.join('\n'));
    return true;
  } catch (error) {
    return false;
  }
}

async function createSolidConfiguration(rootDir, bundler, typescript) {
  log(`🔧 Setting up for SolidJS with ${bundler}...`, 'cyan');
  
  // Create theme file
  const srcDir = resolve(rootDir, 'src');
  await fs.mkdir(srcDir, { recursive: true });
  
  const themeExtension = typescript ? '.ts' : '.js';
  const themeFile = resolve(srcDir, `theme${themeExtension}`);
  if (!(await fileExists(themeFile))) {
    const themeContent = typescript ? `export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  fonts: {
    body: string;
    heading: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export const theme: Theme = {
  colors: {
    primary: '#007acc',
    secondary: '#333',
    background: '#fff',
    text: '#000'
  },
  fonts: {
    body: 'system-ui, sans-serif',
    heading: 'Georgia, serif'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px'
  }
};
` : `export const theme = {
  colors: {
    primary: '#007acc',
    secondary: '#333',
    background: '#fff',
    text: '#000'
  },
  fonts: {
    body: 'system-ui, sans-serif',
    heading: 'Georgia, serif'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px'
  }
};
`;
    
    await fs.writeFile(themeFile, themeContent);
    log(`✅ Created theme${themeExtension}`, 'green');
  }
  
  // Create index.css with base styles
  const indexCss = resolve(srcDir, 'index.css');
  if (!(await fileExists(indexCss))) {
    const cssContent = `/* solid-styles base styles */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  background-color: #ffffff;
  color: #1e293b;
  line-height: 1.5;
}

/* CSS variables for theme colors */
:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
}
`;
    
    await fs.writeFile(indexCss, cssContent);
    log('✅ Created index.css', 'green');
  }
  
  // Try to automatically inject theme import
  const entryPoint = await findEntryPoint(rootDir, typescript);
  if (entryPoint) {
    const injected = await injectThemeImport(entryPoint, typescript);
    if (injected) {
      log('✅ Added theme import to entry file', 'green');
    }
  }
}

async function createSolidStartConfiguration(rootDir, bundler, typescript) {
  log(`🚀 Setting up for SolidStart with ${bundler}...`, 'cyan');
  
  // Create theme file (same as Solid)
  await createSolidConfiguration(rootDir, bundler, typescript);
  
  // Create app.css for SolidStart
  const appCss = resolve(rootDir, 'src', 'app.css');
  if (!(await fileExists(appCss))) {
    const cssContent = `/* SolidStart + solid-styles integration */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

html, body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #ffffff;
  color: #1e293b;
  line-height: 1.5;
}

/* CSS variables for theme colors */
:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
}
`;
    
    await fs.writeFile(appCss, cssContent);
    log('✅ Created app.css for SolidStart', 'green');
  }
}

async function createAstroConfiguration(rootDir, bundler, typescript) {
  log(`🚀 Setting up for Astro + SolidJS with ${bundler}...`, 'cyan');
  
  // Create theme file in src/components
  const componentsDir = resolve(rootDir, 'src', 'components');
  await fs.mkdir(componentsDir, { recursive: true });
  
  const themeExtension = typescript ? '.ts' : '.js';
  const themeFile = resolve(componentsDir, `theme${themeExtension}`);
  
  if (!(await fileExists(themeFile))) {
    const themeContent = typescript ? `export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  fonts: {
    body: string;
    heading: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export const theme: Theme = {
  colors: {
    primary: '#007acc',
    secondary: '#333',
    background: '#fff',
    text: '#000'
  },
  fonts: {
    body: 'system-ui, sans-serif',
    heading: 'Georgia, serif'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  }
};
` : `export const theme = {
  colors: {
    primary: '#007acc',
    secondary: '#333',
    background: '#fff',
    text: '#000'
  },
  fonts: {
    body: 'system-ui, sans-serif',
    heading: 'Georgia, serif'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  }
};
`;
    
    await fs.writeFile(themeFile, themeContent);
    log(`✅ Created components/theme${themeExtension}`, 'green');
  }
  
  // Create global styles
  const stylesDir = resolve(rootDir, 'src', 'styles');
  await fs.mkdir(stylesDir, { recursive: true });
  
  const globalCss = resolve(stylesDir, 'global.css');
  if (!(await fileExists(globalCss))) {
    const cssContent = `/* Astro + solid-styles global styles */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: #ffffff;
  color: #1e293b;
  line-height: 1.5;
}

/* CSS variables for theme colors */
:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
}
`;
    
    await fs.writeFile(globalCss, cssContent);
    log('✅ Created styles/global.css', 'green');
  }
  
  // Update or create astro.config.mjs
  await updateAstroConfig(rootDir, typescript);
}

async function createTauriConfiguration(rootDir, bundler, typescript) {
  log(`🦀 Setting up for Tauri + SolidJS with ${bundler}...`, 'cyan');
  
  // Create theme file (same as Solid)
  await createSolidConfiguration(rootDir, bundler, typescript);
  
  // Check for tauri.conf.json
  const tauriConfigPath = resolve(rootDir, 'src-tauri', 'tauri.conf.json');
  if (await fileExists(tauriConfigPath)) {
    log('✅ Tauri configuration detected', 'green');
  }
  
  log('✅ Tauri + SolidJS project configured', 'green');
}

async function updateAstroConfig(rootDir, typescript) {
  const configFile = typescript ? 'astro.config.ts' : 'astro.config.mjs';
  const configPath = resolve(rootDir, configFile);
  
  if (await fileExists(configPath)) {
    try {
      let config = await fs.readFile(configPath, 'utf-8');
      
      // Check if Lightning CSS plugin is already imported
      if (config.includes('lightningCSSPlugin')) {
        log('⚠️  Lightning CSS plugin already configured', 'yellow');
        return;
      }
      
      // Add import for Lightning CSS plugin
      const importStatement = "import { lightningCSSPlugin } from 'solid-styles/lightning';\n";
      
      // Find the last import statement
      const lines = config.split('\n');
      let lastImportIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          lastImportIndex = i;
        }
      }
      
      if (lastImportIndex >= 0) {
        lines.splice(lastImportIndex + 1, 0, importStatement);
      } else {
        lines.unshift(importStatement);
      }
      
      // Add plugin to vite.plugins array
      config = lines.join('\n');
      
      // Look for vite config
      if (config.includes('vite:')) {
        // Add to existing vite config
        config = config.replace(
          /(vite:\s*{[^}]*plugins:\s*\[)/,
          '$1lightningCSSPlugin(), '
        );
      } else {
        // Add new vite config
        config = config.replace(
          /(integrations:\s*\[[^\]]*\])/,
          '$1,\n  vite: {\n    plugins: [lightningCSSPlugin()]\n  }'
        );
      }
      
      await fs.writeFile(configPath, config);
      log(`✅ Updated ${configFile} with Lightning CSS plugin`, 'green');
    } catch (error) {
      log(`⚠️  Could not auto-update ${configFile}: ${error.message}`, 'yellow');
      log('  Please manually add the Lightning CSS plugin to your Astro config', 'yellow');
    }
  }
}

async function saveConfiguration(framework, rootDir) {
  const configPath = resolve(rootDir, '.framework-config.json');
  const config = {
    framework,
    setupDate: new Date().toISOString(),
    version: '1.0.0',
    features: {
      theming: true,
      components: true,
      typescript: false
    }
  };
  
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  log('✅ Configuration saved', 'green');
}

async function main() {
  try {
    // Show banner
    log('\n🎨 solid-styles setup', 'bright');
    log('┌─────────────────────────────────────────────┐', 'cyan');
    log('│  Setting up solid-styles for your project  │', 'cyan');
    log('└─────────────────────────────────────────────┘', 'cyan');
    log('');
    
    // Get project root
    const rootDir = await findProjectRoot();
    log(`📂 Project root: ${rootDir}`, 'blue');
    
    // Detect framework
    const { framework, bundler, typescript } = await detectFramework(rootDir);
    if (framework === 'tauri') {
      log(`🔍 Detected: Tauri + SolidJS project using ${bundler}${typescript ? ' with TypeScript' : ''}`, 'blue');
    } else if (framework === 'astro') {
      log(`🔍 Detected: Astro + SolidJS project using ${bundler}${typescript ? ' with TypeScript' : ''}`, 'blue');
    } else if (framework === 'solid-start') {
      log(`🔍 Detected: SolidStart project using ${bundler}${typescript ? ' with TypeScript' : ''}`, 'blue');
    } else {
      log(`🔍 Detected: Solid.js project using ${bundler}${typescript ? ' with TypeScript' : ''}`, 'blue');
    }
    
    // Check if already configured
    const configPath = resolve(rootDir, '.framework-config.json');
    if (await fileExists(configPath)) {
      log('⚠️  solid-styles is already configured', 'yellow');
      log('✅ Setup complete! You can start using solid-styles.', 'green');
      return;
    }
    
    // Configure based on framework
    if (framework === 'tauri') {
      await createTauriConfiguration(rootDir, bundler, typescript);
    } else if (framework === 'astro') {
      await createAstroConfiguration(rootDir, bundler, typescript);
    } else if (framework === 'solid-start') {
      await createSolidStartConfiguration(rootDir, bundler, typescript);
    } else {
      await createSolidConfiguration(rootDir, bundler, typescript);
    }
    
    // Save configuration
    await saveConfiguration(framework, rootDir);
    
    // Success message
    log('');
    log('🎉 Setup complete!', 'bright');
    log('');
    
    // Show what was configured
    const themeExt = typescript ? '.ts' : '.js';
    log('📚 Setup complete! Here\'s what was created:', 'cyan');
    if (framework === 'tauri') {
      log('  ✅ Tauri + SolidJS project configured', 'green');
      log(`  ✅ Theme file: ./src/theme${themeExt} → import { theme } from "./src/theme"`, 'green');
      log('  ✅ Global styles: ./src/index.css → import "./src/index.css"', 'green');
      log('', '');
      log('📚 Next steps:', 'cyan');
      log('  1. Import the theme in your main component:', 'blue');
      log('     import { theme } from "./theme";', 'blue');
      log('  2. Use styled components:', 'blue');
      log('     import { styled } from "solid-styles";', 'blue');
      log('  3. Build your Tauri app:', 'blue');
      log('     pnpm tauri dev', 'blue');
    } else if (framework === 'astro') {
      log('  ✅ Astro + SolidJS project configured', 'green');
      log(`  ✅ Theme file: ./src/components/theme${themeExt}`, 'green');
      log('  ✅ Global styles: ./src/styles/global.css', 'green');
      log('  ✅ Lightning CSS plugin added to astro.config', 'green');
      log('', '');
      log('📚 Next steps:', 'cyan');
      log('  1. Import global styles in your layout:', 'blue');
      log('     import "../styles/global.css";', 'blue');
      log('  2. Use styled components in .tsx files:', 'blue');
      log('     import { styled } from "solid-styles";', 'blue');
      log('  3. Add client directive for interactive components:', 'blue');
      log('     <MyComponent client:load />', 'blue');
    } else if (framework === 'solid-start') {
      log('  ✅ SolidStart project configured', 'green');
      log(`  ✅ Theme file: ./src/theme${themeExt} → import { theme } from "./src/theme"`, 'green');
      log('  ✅ Global styles: ./src/app.css → import "./src/app.css"', 'green');
    } else {
      log('  ✅ Solid.js project configured', 'green');
      log(`  ✅ Theme file: ./src/theme${themeExt} → import { theme } from "./src/theme"`, 'green');
      log('  ✅ Global styles: ./src/index.css → import "./src/index.css"', 'green');
    }
    log('  ✅ Config file: ./.framework-config.json', 'green');
    log('');
    log('📚 Documentation: https://github.com/kevinseabourne/solid-styles', 'blue');
    
  } catch (error) {
    log(`❌ Setup failed: ${error.message}`, 'red');
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('🚨 Unhandled error:', error);
  process.exit(1);
});
