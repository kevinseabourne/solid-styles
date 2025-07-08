#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function promptUser() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    log('\n🎯 Solid Styles for SolidJS Setup', 'bright');
    log('=====================================\n', 'bright');

    // Check if already configured
    const configPath = resolve(rootDir, '.framework-config.json');
    if (await fileExists(configPath)) {
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
      log(`ℹ️  Already configured for ${config.framework}`, 'yellow');
      
      let reconfigure;
      try {
        reconfigure = await rl.question(
          `${colors.cyan}Would you like to reconfigure? (y/N): ${colors.reset}`
        );
        
        // Handle EOF
        if (reconfigure === null) {
          log('\n✅ Keeping existing configuration.', 'green');
          return null;
        }
      } catch (error) {
        log('\n✅ Keeping existing configuration.', 'green');
        return null;
      }
      
      if (reconfigure.toLowerCase() !== 'y') {
        log('\n✅ Keeping existing configuration.', 'green');
        return null;
      }
    }

    log('Please select your framework:\n', 'cyan');
    log('  1) Solid.js (Vite)', 'green');
    log('  2) SolidStart (Vinxi)\n', 'green');

    let choice;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (!choice || !['1', '2'].includes(choice)) {
      if (attempts >= maxAttempts) {
        log(`\n❌ Too many invalid attempts. Exiting setup.`, 'red');
        return null;
      }
      
      try {
        choice = await rl.question(
          `${colors.cyan}Enter your choice (1 or 2): ${colors.reset}`
        );
        
        // Handle EOF (Ctrl+D)
        if (choice === null) {
          log('\n❌ Input cancelled. Exiting setup.', 'red');
          return null;
        }
        
        if (!['1', '2'].includes(choice.trim())) {
          attempts++;
          log(`❌ Invalid choice. Please enter 1 or 2. (${attempts}/${maxAttempts})`, 'red');
        }
      } catch (error) {
        log('\n❌ Input error. Exiting setup.', 'red');
        return null;
      }
    }

    const framework = choice === '1' ? 'solid' : 'solidstart';
    return framework;
  } finally {
    // Always close readline interface
    rl.close();
  }
}

async function configureForSolid() {
  log('\n🔧 Configuring for Solid.js with Vite...', 'blue');

  // Update package.json scripts
  const packageJsonPath = resolve(rootDir, 'package.json');
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
  
  packageJson.scripts = {
    ...packageJson.scripts,
    "build": "vite build && tsc --emitDeclarationOnly",
    "dev": "vite",
    "preview": "vite preview"
  };

  // Ensure Vite is in devDependencies
  if (!packageJson.devDependencies.vite) {
    packageJson.devDependencies.vite = "^5.0.0";
    packageJson.devDependencies["vite-plugin-solid"] = "^2.0.0";
  }

  // Remove Vinxi if present
  delete packageJson.devDependencies.vinxi;

  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

  // Create/update vite.config.ts
  const viteConfig = `import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [solid()],
  
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        animation: resolve(__dirname, "src/animation/index.ts"),
        "utils/spring": resolve(__dirname, "src/utils/spring.ts"),
        "utils/gradient": resolve(__dirname, "src/utils/gradient.ts"),
        lightning: resolve(__dirname, "src/lightning/index.ts"),
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) => {
        const ext = format === "es" ? "js" : "cjs";
        return \`\${entryName}.\${ext}\`;
      },
    },
    
    rollupOptions: {
      external: ["solid-js", "solid-js/web", "solid-js/store"],
      output: {
        preserveModules: false,
        globals: {
          "solid-js": "Solid",
          "solid-js/web": "SolidWeb",
          "solid-js/store": "SolidStore",
        },
      },
    },
    
    target: "esnext",
    sourcemap: true,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
      mangle: {
        properties: false,
      },
      format: {
        comments: false,
      },
    },
  },
  
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
    conditions: ["solid", "development|production"],
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },
  
  optimizeDeps: {
    extensions: ["jsx", "tsx"],
    esbuildOptions: {
      target: "esnext",
      jsx: "preserve",
    },
  },
  
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "tests/",
        "examples/",
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    transformMode: {
      web: [/\\.[jt]sx?$/],
    },
    deps: {
      optimizer: {
        web: {
          include: ["solid-js"],
        },
      },
    },
  },
});
`;

  await fs.writeFile(resolve(rootDir, 'vite.config.ts'), viteConfig);

  // Remove app.config.js if it exists
  const appConfigPath = resolve(rootDir, 'app.config.js');
  if (await fileExists(appConfigPath)) {
    await fs.unlink(appConfigPath);
  }

  // Create starter files for Solid.js
  await createStarterFiles('solid');

  log('✅ Configured for Solid.js with Vite', 'green');
}

async function configureForSolidStart() {
  log('\n🔧 Configuring for SolidStart with Vinxi...', 'blue');

  // Update package.json scripts
  const packageJsonPath = resolve(rootDir, 'package.json');
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
  
  packageJson.scripts = {
    ...packageJson.scripts,
    "build": "vinxi build",
    "dev": "vinxi dev",
    "preview": "vinxi preview"
  };

  // Ensure Vinxi is in devDependencies
  if (!packageJson.devDependencies.vinxi) {
    packageJson.devDependencies.vinxi = "^0.4.0";
  }

  // Remove Vite if not needed for testing
  // Keep vite-plugin-solid as it's used by Vinxi
  if (packageJson.devDependencies.vite && !packageJson.devDependencies.vitest) {
    delete packageJson.devDependencies.vite;
  }

  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

  // app.config.js already exists from previous setup
  // Remove vite.config.ts if it exists
  const viteConfigPath = resolve(rootDir, 'vite.config.ts');
  if (await fileExists(viteConfigPath)) {
    await fs.unlink(viteConfigPath);
  }

  // Create starter files for SolidStart
  await createStarterFiles('solidstart');

  log('✅ Configured for SolidStart with Vinxi', 'green');
}

async function createStarterFiles(framework) {
  log('\n🎨 Creating starter files...', 'blue');
  
  // Determine target directory - user's project (not our library)
  const targetDir = process.cwd();
  
  // Create directory structure
  const stylesDir = resolve(targetDir, 'src/styles');
  const componentsDir = resolve(targetDir, 'src/components');
  
  await fs.mkdir(stylesDir, { recursive: true });
  await fs.mkdir(componentsDir, { recursive: true });
  
  // 1. Create global.css with modern reset + CSS variables
  const globalStyles = `/* Modern CSS Reset + Solid Styles Base */
*,
*::before,
*::after {
  box-sizing: border-box;
}

* {
  margin: 0;
  padding: 0;
}

body {
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

img,
picture,
video,
canvas,
svg {
  display: block;
  max-width: 100%;
}

input,
button,
textarea,
select {
  font: inherit;
}

p,
h1,
h2,
h3,
h4,
h5,
h6 {
  overflow-wrap: break-word;
}

/* CSS Variables for Theming */
:root {
  /* Colors */
  --color-primary: #3b82f6;
  --color-primary-dark: #2563eb;
  --color-secondary: #64748b;
  --color-accent: #8b5cf6;
  
  /* Semantic colors */
  --color-background: #ffffff;
  --color-surface: #f8fafc;
  --color-text: #0f172a;
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;
  
  /* Status colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #06b6d4;
  
  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  
  /* Typography */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  
  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  
  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-normal: 250ms ease-in-out;
  --transition-slow: 350ms ease-in-out;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #0f172a;
    --color-surface: #1e293b;
    --color-text: #f8fafc;
    --color-text-muted: #94a3b8;
    --color-border: #334155;
  }
}

[data-theme="dark"] {
  --color-background: #0f172a;
  --color-surface: #1e293b;
  --color-text: #f8fafc;
  --color-text-muted: #94a3b8;
  --color-border: #334155;
}
`;
  
  await fs.writeFile(resolve(stylesDir, 'global.css'), globalStyles);
  
  // 2. Create theme.ts with comprehensive theme system
  const themeConfig = `import { createSignal } from 'solid-js';

export interface Theme {
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  typography: {
    fontSizes: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
    };
    fontWeights: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

export const lightTheme: Theme = {
  colors: {
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    secondary: '#64748b',
    accent: '#8b5cf6',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  typography: {
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  },
};

export const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    border: '#334155',
  },
};

// Theme state management
export const [currentTheme, setCurrentTheme] = createSignal<'light' | 'dark'>(
  (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) 
    ? 'dark' 
    : 'light'
);

export const theme = () => currentTheme() === 'dark' ? darkTheme : lightTheme;

// Toggle theme function
export const toggleTheme = () => {
  const newTheme = currentTheme() === 'light' ? 'dark' : 'light';
  setCurrentTheme(newTheme);
  
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  }
};

// Initialize theme on load
if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
  if (savedTheme) {
    setCurrentTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }
}
`;
  
  await fs.writeFile(resolve(stylesDir, 'theme.ts'), themeConfig);
  
  // 3. Create ThemeProvider component
  const themeProvider = `import { createContext, useContext, JSX, ParentComponent } from 'solid-js';
import { theme, currentTheme, toggleTheme, type Theme } from '../styles/theme';

export interface ThemeContextType {
  theme: () => Theme;
  currentTheme: () => 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: ParentComponent = (props) => {
  const contextValue: ThemeContextType = {
    theme,
    currentTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {props.children}
    </ThemeContext.Provider>
  );
};

// Example styled component using the theme
export const Button = (props: {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: JSX.Element;
  onClick?: () => void;
}) => {
  const { theme } = useTheme();
  
  const baseStyles = {
    'font-family': 'inherit',
    border: 'none',
    cursor: 'pointer',
    'border-radius': theme().borderRadius.md,
    transition: theme().transitions.fast,
    'font-weight': theme().typography.fontWeights.medium,
  };
  
  const variantStyles = {
    primary: {
      'background-color': theme().colors.primary,
      color: 'white',
      '&:hover': {
        'background-color': theme().colors.primaryDark,
      },
    },
    secondary: {
      'background-color': theme().colors.surface,
      color: theme().colors.text,
      border: \`1px solid \${theme().colors.border}\`,
      '&:hover': {
        'background-color': theme().colors.border,
      },
    },
  };
  
  const sizeStyles = {
    sm: {
      padding: \`\${theme().spacing.xs} \${theme().spacing.sm}\`,
      'font-size': theme().typography.fontSizes.sm,
    },
    md: {
      padding: \`\${theme().spacing.sm} \${theme().spacing.md}\`,
      'font-size': theme().typography.fontSizes.base,
    },
    lg: {
      padding: \`\${theme().spacing.md} \${theme().spacing.lg}\`,
      'font-size': theme().typography.fontSizes.lg,
    },
  };
  
  return (
    <button
      style={{
        ...baseStyles,
        ...variantStyles[props.variant || 'primary'],
        ...sizeStyles[props.size || 'md'],
      }}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
};
`;
  
  await fs.writeFile(resolve(componentsDir, 'ThemeProvider.tsx'), themeProvider);
  
  // 4. Update entry file based on framework
  await updateEntryFile(framework, targetDir);
  
  log('✅ Created starter files:', 'green');
  log('  📁 src/styles/global.css - Modern CSS reset + variables', 'cyan');
  log('  📁 src/styles/theme.ts - Complete theme system', 'cyan');
  log('  📁 src/components/ThemeProvider.tsx - Theme context + example button', 'cyan');
}

async function updateEntryFile(framework, targetDir) {
  let entryFile, entryContent;
  
  if (framework === 'solid') {
    // Solid.js - update src/index.tsx or create it
    entryFile = resolve(targetDir, 'src/index.tsx');
    
    if (await fileExists(entryFile)) {
      // Read existing file and add imports
      const existing = await fs.readFile(entryFile, 'utf-8');
      if (!existing.includes('./styles/global.css')) {
        entryContent = `import './styles/global.css';
import { render } from 'solid-js/web';
import { ThemeProvider } from './components/ThemeProvider';

${existing}`;
      }
    } else {
      // Create new entry file
      entryContent = `import './styles/global.css';
import { render } from 'solid-js/web';
import { ThemeProvider } from './components/ThemeProvider';

import { styled } from 'solid-styles';
import { useTheme } from './components/ThemeProvider';

const Container = styled.div\`
  padding: \${(props) => props.theme?.spacing?.xl || '2rem'};
  background: \${(props) => props.theme?.colors?.background || '#ffffff'};
  color: \${(props) => props.theme?.colors?.text || '#000000'};
  min-height: 100vh;
  font-family: \${(props) => props.theme?.typography?.fontFamily || 'system-ui, sans-serif'};
\`;

const Title = styled.h1\`
  font-size: \${(props) => props.theme?.typography?.fontSizes?.['2xl'] || '1.875rem'};
  font-weight: \${(props) => props.theme?.typography?.fontWeights?.bold || '700'};
  color: \${(props) => props.theme?.colors?.primary || '#007bff'};
  margin-bottom: \${(props) => props.theme?.spacing?.md || '1rem'};
\`;

const Description = styled.p\`
  font-size: \${(props) => props.theme?.typography?.fontSizes?.lg || '1.125rem'};
  color: \${(props) => props.theme?.colors?.textSecondary || '#6c757d'};
  margin-bottom: \${(props) => props.theme?.spacing?.lg || '1.5rem'};
\`;

function App() {
  const { theme } = useTheme();
  
  return (
    <ThemeProvider>
      <Container theme={theme()}>
        <Title theme={theme()}>Welcome to Solid Styles!</Title>
        <Description theme={theme()}>Your global styles and theme system are ready to use.</Description>
      </Container>
    </ThemeProvider>
  );
}

render(() => <App />, document.getElementById('root')!);
`;
    }
  } else {
    // SolidStart - update src/app.tsx or src/root.tsx
    const appFile = resolve(targetDir, 'src/app.tsx');
    const rootFile = resolve(targetDir, 'src/root.tsx');
    
    entryFile = await fileExists(appFile) ? appFile : rootFile;
    
    if (await fileExists(entryFile)) {
      const existing = await fs.readFile(entryFile, 'utf-8');
      if (!existing.includes('./styles/global.css')) {
        entryContent = `import './styles/global.css';
import { ThemeProvider } from './components/ThemeProvider';

${existing}`;
      }
    } else {
      // Create app.tsx for SolidStart
      entryFile = appFile;
      entryContent = `import './styles/global.css';
import { ThemeProvider } from './components/ThemeProvider';

import { styled } from 'solid-styles';
import { useTheme } from './components/ThemeProvider';

const Container = styled.div\`
  padding: \${(props) => props.theme?.spacing?.xl || '2rem'};
  background: \${(props) => props.theme?.colors?.background || '#ffffff'};
  color: \${(props) => props.theme?.colors?.text || '#000000'};
  min-height: 100vh;
  font-family: \${(props) => props.theme?.typography?.fontFamily || 'system-ui, sans-serif'};
\`;

const Title = styled.h1\`
  font-size: \${(props) => props.theme?.typography?.fontSizes?.['2xl'] || '1.875rem'};
  font-weight: \${(props) => props.theme?.typography?.fontWeights?.bold || '700'};
  color: \${(props) => props.theme?.colors?.primary || '#007bff'};
  margin-bottom: \${(props) => props.theme?.spacing?.md || '1rem'};
\`;

const Description = styled.p\`
  font-size: \${(props) => props.theme?.typography?.fontSizes?.lg || '1.125rem'};
  color: \${(props) => props.theme?.colors?.textSecondary || '#6c757d'};
  margin-bottom: \${(props) => props.theme?.spacing?.lg || '1.5rem'};
\`;

export default function App() {
  const { theme } = useTheme();
  
  return (
    <ThemeProvider>
      <Container theme={theme()}>
        <Title theme={theme()}>Welcome to Solid Styles with SolidStart!</Title>
        <Description theme={theme()}>Your global styles and theme system are ready to use.</Description>
      </Container>
    </ThemeProvider>
  );
}
`;
    }
  }
  
  if (entryContent) {
    await fs.writeFile(entryFile, entryContent);
    log(`  📁 Updated ${entryFile.split('/').pop()} with imports`, 'cyan');
  }
}

async function saveConfiguration(framework) {
  const configPath = resolve(rootDir, '.framework-config.json');
  const config = {
    framework,
    configuredAt: new Date().toISOString(),
    version: '1.0.0'
  };
  
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  log(`\n💾 Configuration saved to .framework-config.json`, 'cyan');
}

async function detectPackageManager() {
  let packageManager = 'npm';
  if (await fileExists(resolve(rootDir, 'pnpm-lock.yaml'))) {
    packageManager = 'pnpm';
  } else if (await fileExists(resolve(rootDir, 'yarn.lock'))) {
    packageManager = 'yarn';
  }
  return packageManager;
}

async function installDependencies() {
  log('\n📦 Installing dependencies...', 'yellow');
  
  try {
    const packageManager = await detectPackageManager();

    // Use stdio: 'inherit' to prevent hanging and show progress
    const { spawn } = await import('node:child_process');
    const child = spawn(packageManager, ['install'], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true
    });
    
    await new Promise((resolve, reject) => {
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`${packageManager} install timed out after 5 minutes`));
      }, 5 * 60 * 1000); // 5 minutes
      
      child.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`${packageManager} install failed with code ${code}`));
        }
      });
      
      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
    
    log('✅ Dependencies installed', 'green');
  } catch (error) {
    log('⚠️  Failed to install dependencies automatically', 'yellow');
    log(`   Please run your package manager's install command manually`, 'yellow');
    log(`   Error: ${error.message}`, 'red');
  }
}

async function main() {
  try {
    // Validate we're in the right directory
    const packageJsonPath = resolve(rootDir, 'package.json');
    if (!(await fileExists(packageJsonPath))) {
      log('❌ Error: package.json not found. Please run this script from the project root.', 'red');
      process.exit(1);
    }
    
    const framework = await promptUser();
    
    if (!framework) {
      log('\n👋 Setup cancelled. No changes made.', 'yellow');
      return;
    }

    if (framework === 'solid') {
      await configureForSolid();
    } else {
      await configureForSolidStart();
    }

    await saveConfiguration(framework);
    
    // Ask if user wants to install dependencies
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    let shouldInstall;
    try {
      shouldInstall = await rl.question(
        `\n${colors.cyan}Would you like to install/update dependencies now? (Y/n): ${colors.reset}`
      );
      
      // Handle EOF (Ctrl+D)
      if (shouldInstall === null) {
        log('\n👋 Input cancelled. Skipping dependency installation.', 'yellow');
        shouldInstall = 'n';
      }
    } catch (error) {
      log('\n⚠️  Input error. Skipping dependency installation.', 'yellow');
      shouldInstall = 'n';
    } finally {
      rl.close();
    }
    
    // Detect package manager early to avoid issues later
    const packageManager = await detectPackageManager();
    
    if (shouldInstall.toLowerCase() !== 'n') {
      log('\n📦 Installing dependencies...', 'cyan');
      await installDependencies();
    } else {
      log('\n⏭️  Skipping dependency installation.', 'yellow');
    }
    
    log('\n🎉 Setup complete!', 'bright');
    log('\nYou can now use the following commands:', 'cyan');
    log(`  ${packageManager} run dev     - Start development server`, 'green');
    log(`  ${packageManager} run build   - Build the library`, 'green');
    log(`  ${packageManager} run test    - Run tests`, 'green');
    
    log(`\nTo reconfigure later, run: ${packageManager} run setup`, 'yellow');
  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, 'red');
    log('\nIf this error persists, please check your node_modules and package.json', 'yellow');
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
