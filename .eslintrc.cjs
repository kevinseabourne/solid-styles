module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    '@typescript-eslint',
    'solid',
  ],
  rules: {
    // Basic rules
    'no-console': 'warn',
    'no-unused-vars': 'off', // Turn off base rule
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // Solid.js specific rules
    'solid/reactivity': 'warn',
    'solid/no-destructure': 'warn',
    'solid/prefer-for': 'warn',
  },
  settings: {
    'solid/typescript': true,
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.js',
    '*.d.ts',
  ],
};
