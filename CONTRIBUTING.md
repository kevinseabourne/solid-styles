# Contributing to Solid Styles

Thank you for your interest in contributing to Solid Styles! This document provides guidelines and information for contributors.

## 🚀 Quick Start

1. **Fork the repository** and clone your fork
2. **Install dependencies**: `pnpm install`
3. **Run tests**: `pnpm test`
4. **Start development**: `pnpm run dev`

## 📋 Development Workflow

### Setting up the Development Environment

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/solid-styles.git
cd solid-styles

# Install dependencies
pnpm install

# Run tests to make sure everything works
pnpm test

# Start development mode
pnpm run dev
```

### Before Making Changes

1. **Create a new branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make sure tests pass**:
   ```bash
   pnpm test
   ```

3. **Check TypeScript types**:
   ```bash
   pnpm run type-check
   ```

## 🧪 Testing

We maintain **100% test coverage**. Please ensure:

- **All new features have tests**
- **All bug fixes have regression tests**
- **Tests are readable and well-documented**

```bash
# Run all tests
pnpm test

# Run tests in watch mode during development
pnpm test -- --watch

# Run tests with coverage
pnpm test -- --coverage

# Run specific test file
pnpm test -- src/components/Button.test.tsx
```

### Test Categories

- **Unit Tests**: Individual function/component testing
- **Integration Tests**: Component interaction testing
- **Animation Tests**: Spring physics and animation system
- **Performance Tests**: Bundle size and runtime performance
- **SSR Tests**: Server-side rendering compatibility

## 📝 Code Style

We use automated tools to maintain consistent code style:

```bash
# Format code
pnpm run format

# Lint code
pnpm run lint

# Type checking
pnpm run type-check
```

### Code Guidelines

- **Use TypeScript** for all new code
- **Prefer function components** over class components
- **Use modern JavaScript features** (ES6+, destructuring, arrow functions)
- **Write descriptive variable names**
- **Add JSDoc comments** for public APIs
- **Keep functions small and focused**

## 🎯 What to Contribute

### 🐛 Bug Reports

When reporting bugs, please include:

- **Clear description** of the issue
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Environment details** (Node version, OS, browser)
- **Minimal reproducible example**

### ✨ Feature Requests

For new features:

- **Check existing issues** first
- **Describe the use case** clearly
- **Provide examples** of how it would be used
- **Consider backward compatibility**

### 🔧 Code Contributions

**Good First Issues**:
- Documentation improvements
- Adding examples
- Fixing typos
- Small bug fixes
- Adding tests

**Advanced Contributions**:
- Animation system enhancements
- Performance optimizations
- New styling features
- Build system improvements

## 📋 Pull Request Process

1. **Create descriptive PR title**:
   - `feat: add new animation trigger`
   - `fix: resolve SSR hydration issue`
   - `docs: update README examples`

2. **Fill out the PR template** completely

3. **Ensure all checks pass**:
   - ✅ Tests pass
   - ✅ TypeScript compiles
   - ✅ Linting passes
   - ✅ Bundle size is reasonable

4. **Request review** from maintainers

5. **Address feedback** promptly

6. **Squash commits** before merging (if needed)

## 🏗️ Project Structure

```
solid-styles/
├── src/                    # Core library code
│   ├── components/         # Reusable components
│   ├── hooks/             # Custom hooks
│   └── utils/             # Utility functions
├── animation/             # Animation system
│   ├── hooks/             # Animation hooks
│   ├── spring-bridge.ts   # Spring physics integration
│   └── advanced/          # Advanced animation features
├── lightning/             # Lightning CSS integration
├── utils/                 # Standalone utilities
├── tests/                 # Test files
├── examples/              # Usage examples
└── docs/                  # Documentation
```

## 🌟 Animation System

The animation system is a core feature. When contributing:

- **Test across different data types** (numbers, colors, objects)
- **Consider performance implications**
- **Maintain backward compatibility**
- **Document new animation triggers**
- **Test with accessibility features** (reduced motion)

## 📦 Release Process

Releases are automated via GitHub Actions:

1. **Merge to main** triggers CI/CD
2. **Tag with version** (`git tag v1.2.3`) triggers publish
3. **GitHub release** is created automatically
4. **NPM package** is published automatically

## 🎓 Learning Resources

- **SolidJS Documentation**: https://www.solidjs.com/
- **CSS-in-JS Best Practices**: Research modern patterns
- **Spring Physics**: Understanding animation fundamentals
- **TypeScript**: Advanced type patterns

## 🤝 Code of Conduct

- **Be respectful** and inclusive
- **Give constructive feedback**
- **Help newcomers**
- **Focus on the code, not the person**

## 💬 Getting Help

- **GitHub Issues**: Technical questions and bugs
- **Discussions**: General questions and ideas
- **Discord/Slack**: Real-time community support (if available)

## 🎯 Contribution Ideas

### 🚀 High Impact
- Performance optimizations
- New animation triggers
- Better TypeScript support
- SSR enhancements

### 📚 Documentation
- More examples
- Video tutorials
- Migration guides
- API documentation

### 🧪 Testing
- Edge case testing
- Browser compatibility
- Performance benchmarks
- Accessibility testing

---

**Thank you for contributing to Solid Styles!** 🎉

Every contribution, no matter how small, helps make this library better for the entire SolidJS community.
