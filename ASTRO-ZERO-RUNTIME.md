# Zero-Runtime Mode & Framework Integration

## Understanding solid-styles Modes

solid-styles operates in **two modes**:

### 1️⃣ Runtime Mode (Default)
- Styles generated in the browser
- Works everywhere without configuration
- Bundle size: ~183KB (core) + ~195KB (animations)
- Perfect for prototyping and small projects

### 2️⃣ Zero-Runtime Mode (Lightning CSS)
- Styles extracted at build time  
- Static CSS output
- Bundle size: ~20KB (only runtime resolver for dynamic props)
- **Requires Lightning CSS plugin configuration**
- Production-ready performance

## 🚀 Astro + SolidJS Integration

### Quick Start

```bash
# 1. Install solid-styles in your Astro project
pnpm add solid-styles

# 2. Run the setup script
npx solid-styles setup

# 3. The script will:
#    - Detect Astro + SolidJS
#    - Create theme and global styles
#    - Configure Lightning CSS plugin automatically
```

### Simplified Configuration (Recommended)

Use the Astro integration for the easiest setup:

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import solid from '@astrojs/solid-js';
import solidStyles from 'solid-styles/integrations/astro';

export default defineConfig({
  integrations: [
    solid(),
    solidStyles() // Automatically configures Lightning CSS
  ]
});
```

### Advanced Configuration

Customize the integration with options:

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import solid from '@astrojs/solid-js';
import solidStyles from 'solid-styles/integrations/astro';

export default defineConfig({
  integrations: [
    solid(),
    solidStyles({
      targets: ["> 0.25%", "not dead"],
      minify: true,
      analyzePropPatterns: true,
      maxPropCombinations: 100,
      devMode: false
    })
  ]
});
```

### Manual Vite Plugin Configuration

If you prefer direct Vite plugin control:

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import solid from '@astrojs/solid-js';
import { lightningCSSPlugin } from 'solid-styles/lightning';

export default defineConfig({
  integrations: [solid()],
  vite: {
    plugins: [lightningCSSPlugin()]
  }
});
```

### Using in Astro

**1. Create a SolidJS component** (`src/components/Button.tsx`):

```tsx
import { styled } from 'solid-styles';

const StyledButton = styled.button`
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  
  &:hover {
    background: #2563eb;
  }
`;

export function Button(props) {
  return <StyledButton>{props.children}</StyledButton>;
}
```

**2. Use in Astro page** (`.astro` file):

```astro
---
import { Button } from '../components/Button';
---

<html>
  <body>
    <h1>My Astro Page</h1>
    
    <!-- Static component - no JavaScript -->
    <Button>Static Button</Button>
    
    <!-- Interactive component - requires JavaScript -->
    <Button client:load>Interactive Button</Button>
  </body>
</html>
```

### ⚡ Zero-Runtime Benefits in Astro

With Lightning CSS plugin configured:

✅ **Build-time extraction**: Styles compiled to static CSS  
✅ **Minimal JavaScript**: Only ~20KB for dynamic props  
✅ **Island architecture**: Works perfectly with Astro's islands  
✅ **SSR compatible**: No hydration mismatches  
✅ **Optimized**: Automatic vendor prefixing and minification  

## 🎯 Vite + SolidJS Integration

### Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { lightningCSSPlugin } from 'solid-styles/lightning';

export default defineConfig({
  plugins: [
    solid(),
    lightningCSSPlugin({
      targets: ["> 0.25%", "not dead"],
      minify: true,
      analyzePropPatterns: true
    })
  ]
});
```

### Usage

```tsx
// src/App.tsx
import { styled } from 'solid-styles';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

export function App() {
  return (
    <Container>
      <h1>My Vite App</h1>
    </Container>
  );
}
```

## 🚂 Vinxi/SolidStart Integration

### Configuration

```typescript
// app.config.ts
import { defineConfig } from '@solidjs/start/config';
import { lightningCSSPlugin } from 'solid-styles/lightning';

export default defineConfig({
  vite: {
    plugins: [lightningCSSPlugin()]
  }
});
```

## 📊 Bundle Size Comparison

| Mode | Core Size | Animation Size | Total |
|------|-----------|---------------|-------|
| **Runtime** | 183 KB | 195 KB | 378 KB |
| **Zero-Runtime** | 20 KB | 25 KB | 45 KB |

*Sizes are ESM, uncompressed. Gzip reduces by ~70%.*

## 🔧 Lightning CSS Plugin Options

```typescript
lightningCSSPlugin({
  // Browser targets for autoprefixing
  targets: ["> 0.25%", "not dead"],
  
  // Minify output CSS
  minify: true,
  
  // Analyze component props for static extraction
  analyzePropPatterns: true,
  
  // Maximum prop combinations to generate
  maxPropCombinations: 100,
  
  // Files to process
  include: [/\.[jt]sx?$/],
  exclude: [/node_modules/],
  
  // Custom CSS output path
  outputPath: './dist/styles.css'
})
```

## 🎨 When to Use Each Mode

### Use Runtime Mode When:
- Prototyping quickly
- Small projects (<10 components)
- Highly dynamic styling (styles change frequently)
- Don't want build configuration

### Use Zero-Runtime Mode When:
- Production applications
- Performance is critical
- Large codebases (>20 components)
- Static or semi-static styling
- Want optimal bundle size

## 💡 Best Practices

### For Astro Projects

1. **Use `client:load` for interactive components**
   ```astro
   <InteractiveButton client:load />
   ```

2. **Import global styles in layout**
   ```astro
   ---
   import '../styles/global.css';
   ---
   ```

3. **Keep styled components in `.tsx` files**
   - Not `.astro` files
   - Better type safety
   - Works with Lightning CSS extraction

### For All Projects

1. **Colocate styles with components**
   ```
   components/
     Button/
       Button.tsx        # Component + styles
       index.ts          # Export
   ```

2. **Use theme for consistency**
   ```tsx
   const Button = styled.button`
     color: ${props => props.theme.colors.primary};
   `;
   ```

3. **Static styles over dynamic**
   ```tsx
   // ✅ Good - static, extractable
   const Button = styled.button`
     padding: 12px;
   `;
   
   // ⚠️ Less optimal - dynamic
   const Button = styled.button<{ size: number }>`
     padding: ${props => props.size}px;
   `;
   ```

## 🐛 Troubleshooting

### "process is not defined"
**Fixed in v1.4.2+**. Update to latest version:
```bash
pnpm update solid-styles
```

### Lightning CSS not extracting styles
1. Check plugin is in config
2. Verify file patterns match (`.tsx`/`.jsx`)
3. Check console for extraction errors

### Styles not applying in Astro
1. Ensure component has `client:*` directive if interactive
2. Import global CSS in layout
3. Check browser console for errors

### TypeScript errors with `import.meta.env`
Fixed in v1.4.2+. The package includes proper type declarations.

## 📚 Examples

See the `/examples` directory for complete working examples:
- `astro.config.example.mjs` - Astro configuration
- `vite.config.example.ts` - Vite configuration  
- `astro-button-example.tsx` - Astro component usage

## 🎯 Migration from Runtime to Zero-Runtime

No code changes needed! Just add the Lightning CSS plugin:

```diff
  // astro.config.mjs
  import { defineConfig } from 'astro/config';
  import solid from '@astrojs/solid-js';
+ import { lightningCSSPlugin } from 'solid-styles/lightning';

  export default defineConfig({
    integrations: [solid()],
+   vite: {
+     plugins: [lightningCSSPlugin()]
+   }
  });
```

Then rebuild:
```bash
pnpm build
```

Your bundle size will drop from ~378KB to ~45KB automatically! 🎉
