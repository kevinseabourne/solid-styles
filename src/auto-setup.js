/**
 * Smart detection for solid-styles setup
 * Provides helpful guidance instead of silent setup
 * Respects security-conscious developers who use --ignore-scripts
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'

// Only run in development
if (process.env.NODE_ENV !== 'production') {
  // Track if we've already shown the message this session
  let hasShownMessage = false
  
  function findProjectRoot() {
    let currentDir = process.cwd()
    
    // Look for package.json with solid-styles dependency
    while (currentDir !== dirname(currentDir)) {
      const packageJsonPath = join(currentDir, 'package.json')
      
      if (existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
          const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
          
          if (deps['solid-styles']) {
            return currentDir
          }
        } catch (e) {
          // Continue searching
        }
      }
      
      currentDir = dirname(currentDir)
    }
    
    return process.cwd()
  }
  
  function detectFramework(rootDir) {
    const packageJsonPath = join(rootDir, 'package.json')
    
    if (!existsSync(packageJsonPath)) return null
    
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
      
      if (deps['@solidjs/start'] || deps['solid-start']) {
        return 'solid-start'
      }
      
      if (deps['solid-js']) {
        return 'solid'
      }
      
      return null
    } catch (e) {
      return null
    }
  }
  
  function checkSetupStatus() {
    try {
      const projectRoot = findProjectRoot()
      const framework = detectFramework(projectRoot)
      
      if (!framework) return
      
      // Check if already configured
      const configPath = join(projectRoot, '.framework-config.json')
      if (existsSync(configPath)) {
        return // Already setup - all good!
      }
      
      // Show helpful setup message (only once per session)
      if (!hasShownMessage) {
        hasShownMessage = true
        showSetupGuidance(framework)
      }
      
    } catch (error) {
      // Fail silently - don't break user's app
    }
  }
  
  function showSetupGuidance(framework) {
    console.log('')
    console.log('\x1b[36m🎨 solid-styles detected!\x1b[0m')
    console.log('\x1b[2m┌─────────────────────────────────────────────┐\x1b[0m')
    console.log('\x1b[2m│\x1b[0m  \x1b[33mSetup required to get started\x1b[0m              \x1b[2m│\x1b[0m')
    console.log('\x1b[2m│\x1b[0m                                           \x1b[2m│\x1b[0m')
    console.log('\x1b[2m│\x1b[0m  \x1b[32mRun:\x1b[0m \x1b[1mnpx solid-styles setup\x1b[0m          \x1b[2m│\x1b[0m')
    console.log('\x1b[2m│\x1b[0m                                           \x1b[2m│\x1b[0m')
    console.log('\x1b[2m│\x1b[0m  This creates your theme.js and config      \x1b[2m│\x1b[0m')
    console.log('\x1b[2m│\x1b[0m  files so you can start building!           \x1b[2m│\x1b[0m')
    console.log('\x1b[2m└─────────────────────────────────────────────┘\x1b[0m')
    console.log('')
  }
  
  // Run detection (guidance only, no file creation)
  checkSetupStatus()
}
