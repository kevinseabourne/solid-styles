#!/usr/bin/env node

import { dirname, resolve } from 'node:path';

import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

// Detect if we're running as a postinstall hook and find the correct project root
async function findProjectRoot() {
  // If running directly from the solid-styles package
  const directRoot = resolve(__dirname, '..');
  
  // Check if we're running as a postinstall hook (inside node_modules)
  const isPostinstall = __dirname.includes('node_modules');
  
  console.log('🔍 Debug Info:');
  console.log(`Current __dirname: ${__dirname}`);
  console.log(`Is postinstall: ${isPostinstall}`);
  console.log(`Direct root: ${directRoot}`);
  
  if (isPostinstall) {
    // We're in node_modules/solid-styles/scripts, need to find the actual project root
    let currentDir = __dirname;
    
    // Traverse upward until we find the project root (outside node_modules)
    while (currentDir.includes('node_modules')) {
      currentDir = dirname(currentDir);
    }
    
    // Go up one more level to get to the actual project root
    const projectRoot = dirname(currentDir);
    
    console.log(`Detected project root: ${projectRoot}`);
    
    // Verify this is a valid project by checking for package.json
    const packageJsonPath = resolve(projectRoot, 'package.json');
    if (await fileExists(packageJsonPath)) {
      console.log('✅ Found package.json in project root');
      return projectRoot;
    }
    
    // Fallback: try the parent of node_modules
    const fallbackRoot = dirname(currentDir);
    const fallbackPackageJson = resolve(fallbackRoot, 'package.json');
    console.log(`Trying fallback root: ${fallbackRoot}`);
    
    if (await fileExists(fallbackPackageJson)) {
      console.log('✅ Found package.json in fallback root');
      return fallbackRoot;
    }
  }
  
  console.log('Using direct root (development mode)');
  return directRoot;
}

// Test the function
findProjectRoot().then(async (rootDir) => {
  console.log(`\n🎯 Final project root: ${rootDir}`);
  
  const packageJsonPath = resolve(rootDir, 'package.json');
  if (await fileExists(packageJsonPath)) {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    console.log(`📦 Project name: ${packageJson.name}`);
    console.log('✅ Setup would work correctly');
  } else {
    console.log('❌ No package.json found - setup would fail');
  }
}).catch(console.error);
