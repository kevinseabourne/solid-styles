# Changelog

## 1.1.0

### Minor Changes

- 2727513: Enhanced README with interactive FAQ dropdowns for better user experience
  - Added collapsible dropdown sections for manual global styles and themes setup
  - Removed redundant manual setup section to eliminate duplication
  - Improved documentation organization with step-by-step instructions
  - Better progressive disclosure - users can access detailed help when needed
  - Cleaner main README while maintaining comprehensive setup guides

All notable changes to the `solid-styles` project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- GitHub Actions CI/CD pipeline
- Automated testing across multiple Node.js versions and operating systems
- Bundle size monitoring
- Security scanning with CodeQL
- Automated NPM publishing on version tags
- Contributing guidelines and issue templates

## [1.0.1] - 2025-01-09

### Changed

- Updated test coverage display from 99% to 100%
- Enhanced README with multiple package manager installation options (npm, yarn, bun, pnpm)
- Clarified module architecture documentation
- Improved module descriptions and removed misleading Lightning CSS import section
- Reordered utility sections for better organization

### Fixed

- Corrected module import documentation to match actual package.json exports
- Removed non-existent Lightning CSS import example

## [1.0.0] - 2025-01-09

### Added

- Initial release of solid-styles
- Zero-runtime CSS-in-JS with Lightning CSS optimization
- Spring physics animation system with 25+ triggers
- TypeScript-first development with full type safety
- SSR-ready with automatic hydration
- Modular architecture (Core, Animation, Utilities)
- Interactive setup script for framework selection
- Comprehensive error handling and boundaries
- 100% test coverage
- Production-ready build system

### Features

- **Styled Components**: Full CSS-in-JS API compatible with SolidJS
- **Animation System**:
  - Custom spring physics engine
  - 25+ animation triggers (hover, scroll, mount, etc.)
  - Gesture support and advanced interactions
  - Keyframe animations and staggered effects
- **Performance**:
  - Zero-runtime overhead for static styles
  - Lightning CSS optimization at build time
  - Tree-shakable modular architecture
  - Bundle size optimization
- **Developer Experience**:
  - TypeScript declarations
  - Interactive setup script
  - Comprehensive documentation
  - Error boundaries and debugging tools
  - Support for both Vite and Vinxi (SolidStart)

### Technical

- ESM and CJS compatibility
- Source maps generation
- Automatic dependency detection
- Post-install setup hooks
- Framework-agnostic utilities
- Advanced gradient interpolation
- Spring physics utilities for custom animations

---

## Legend

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability fixes
