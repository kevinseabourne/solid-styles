/**
 * VS Code Extension for solid-styles
 * Detects solid-styles in package.json and offers setup
 */

const vscode = require('vscode')
const fs = require('fs')
const path = require('path')

function activate(context) {
  console.log('solid-styles extension is now active!')
  
  // Check for solid-styles when workspace opens
  checkForSolidStyles()
  
  // Watch for package.json changes
  const watcher = vscode.workspace.createFileSystemWatcher('**/package.json')
  watcher.onDidChange(checkForSolidStyles)
  watcher.onDidCreate(checkForSolidStyles)
  
  // Register setup command
  const setupCommand = vscode.commands.registerCommand('solid-styles.setup', async () => {
    await runSetup()
  })
  
  context.subscriptions.push(setupCommand, watcher)
}

async function checkForSolidStyles() {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
  if (!workspaceFolder) return
  
  const packageJsonPath = path.join(workspaceFolder.uri.fsPath, 'package.json')
  
  if (!fs.existsSync(packageJsonPath)) return
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
    
    if (deps['solid-styles']) {
      // Check if already configured
      const configPath = path.join(workspaceFolder.uri.fsPath, '.framework-config.json')
      
      if (!fs.existsSync(configPath)) {
        // Show setup notification
        const action = await vscode.window.showInformationMessage(
          '🎨 solid-styles detected! Would you like to set it up?',
          'Setup Now',
          'Later',
          'Don\'t Ask Again'
        )
        
        if (action === 'Setup Now') {
          await runSetup()
        } else if (action === 'Don\'t Ask Again') {
          // Create a marker file to remember this choice
          fs.writeFileSync(
            path.join(workspaceFolder.uri.fsPath, '.solid-styles-no-setup'),
            ''
          )
        }
      }
    }
  } catch (error) {
    console.error('Error checking for solid-styles:', error)
  }
}

async function runSetup() {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
  if (!workspaceFolder) return
  
  const terminal = vscode.window.createTerminal('solid-styles setup')
  terminal.show()
  terminal.sendText('npx solid-styles setup')
  
  vscode.window.showInformationMessage('✅ solid-styles setup started in terminal!')
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
}

// package.json for VS Code extension
const extensionPackageJson = {
  "name": "solid-styles",
  "displayName": "solid-styles",
  "description": "Auto-setup for solid-styles design system",
  "version": "1.0.0",
  "engines": {
    "vscode": "^1.70.0"
  },
  "categories": ["Other"],
  "activationEvents": [
    "onLanguage:javascript",
    "onLanguage:typescript",
    "onLanguage:javascriptreact",
    "onLanguage:typescriptreact"
  ],
  "main": "./extension.js",
  "contributes": {
    "commands": [
      {
        "command": "solid-styles.setup",
        "title": "Setup solid-styles"
      }
    ]
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./"
  },
  "devDependencies": {
    "@types/node": "^16.x",
    "@types/vscode": "^1.70.0",
    "typescript": "^4.x"
  }
}
