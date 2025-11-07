#!/usr/bin/env node

/**
 * Post-build script to copy additional files to dist
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filesToCopy = [
  { src: 'README.md', dest: 'dist/README.md' },
  { src: 'LICENSE', dest: 'dist/LICENSE' },
];

const dirsToCopy = [
  { src: 'lightning', dest: 'dist/lightning', exclude: ['.test.ts', '.test.tsx'] },
];

function copyFile(src, dest) {
  try {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied ${src} → ${dest}`);
  } catch (err) {
    console.error(`✗ Failed to copy ${src}:`, err.message);
  }
}

function copyDir(src, dest, exclude = []) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Skip excluded patterns
    if (exclude.some(pattern => entry.name.includes(pattern))) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, exclude);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

console.log('\n📦 Post-build: Copying additional files...\n');

// Copy individual files
filesToCopy.forEach(({ src, dest }) => {
  if (fs.existsSync(src)) {
    copyFile(src, dest);
  }
});

// Copy directories
dirsToCopy.forEach(({ src, dest, exclude }) => {
  if (fs.existsSync(src)) {
    copyDir(src, dest, exclude);
    console.log(`✓ Copied directory ${src} → ${dest}`);
  }
});

console.log('\n✅ Post-build complete!\n');
