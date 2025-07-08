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

  log('✅ Configured for SolidStart with Vinxi', 'green');
}

async function saveConfiguration(framework) {
  const config = {
    framework,
    buildTool: framework === 'solid' ? 'vite' : 'vinxi',
    configuredAt: new Date().toISOString()
  };

  await fs.writeFile(
    resolve(rootDir, '.framework-config.json'),
    JSON.stringify(config, null, 2)
  );
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
