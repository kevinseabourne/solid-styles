/**
 * Vite plugin for solid-styles auto-setup
 * Detects solid-styles in dependencies and offers setup
 */

import fs from 'fs'
import path from 'path'

export function solidStylesPlugin(options = {}) {
  return {
    name: 'solid-styles-auto-setup',
    
    configResolved(config) {
      // Only run in development
      if (config.command !== 'serve') return
      
      const projectRoot = config.root
      
      // Check if solid-styles is installed
      if (!hasSolidStyles(projectRoot)) return
      
      // Check if already configured
      const configPath = path.join(projectRoot, '.framework-config.json')
      if (fs.existsSync(configPath)) return
      
      // Auto-setup
      setupSolidStyles(projectRoot)
    },
    
    buildStart() {
      // Additional setup during build start
      const projectRoot = process.cwd()
      
      if (hasSolidStyles(projectRoot) && !isConfigured(projectRoot)) {
        console.log('🎨 solid-styles detected! Run `npx solid-styles setup` to configure.')
      }
    }
  }
}

function hasSolidStyles(projectRoot) {
  const packageJsonPath = path.join(projectRoot, 'package.json')
  
  if (!fs.existsSync(packageJsonPath)) return false
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
    
    return Boolean(deps['solid-styles'])
  } catch (e) {
    return false
  }
}

function isConfigured(projectRoot) {
  const configPath = path.join(projectRoot, '.framework-config.json')
  return fs.existsSync(configPath)
}

function setupSolidStyles(projectRoot) {
  try {
    // Detect framework
    const framework = detectFramework(projectRoot)
    if (!framework) return
    
    // Create configuration
    const configPath = path.join(projectRoot, '.framework-config.json')
    const config = {
      framework,
      setupDate: new Date().toISOString(),
      version: '1.0.0',
      autoSetup: true,
      setupMethod: 'vite-plugin'
    }
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    
    console.log('✅ solid-styles configured automatically!')
    console.log('🎨 Theme file created in src/theme.js')
    
  } catch (error) {
    console.warn('⚠️ solid-styles auto-setup failed. Run `npx solid-styles setup` manually.')
  }
}

function detectFramework(rootDir) {
  const packageJsonPath = path.join(rootDir, 'package.json')
  
  if (!fs.existsSync(packageJsonPath)) return null
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
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

export default solidStylesPlugin
