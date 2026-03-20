# Theming System - Usage Guide

## Overview

The theming system converts domain configuration (colors, fonts) into CSS variables that dynamically style the entire application. This allows different domains (fitness, business, healthcare) to have completely different visual appearances without code changes.

## Architecture

```
BrandingConfig (from /api/config)
    ↓
createThemeFromBranding()
    ↓
Theme object (colors, fonts, sizes)
    ↓
themeToCSSVariables()
    ↓
CSS Variables (--color-primary, --font-family, etc.)
    ↓
Applied to DOM by ThemeProvider
    ↓
Used by Tailwind classes + custom CSS
```

## How It Works

### 1. Theme Service (`lib/theme.ts`)

Provides utilities to work with themes:

```typescript
import { createThemeFromBranding, applyThemeToDOM } from '@/lib/theme';

// Create theme from branding config
const theme = createThemeFromBranding(brandingConfig);

// Convert to CSS variables
const cssString = themeToCSSVariables(theme);

// Apply to DOM
applyThemeToDOM(theme);
```

### 2. Theme Provider Component

Automatically applies theme when app loads:

```typescript
<ConfigProvider>
  <ThemeProvider>
    <App />
  </ThemeProvider>
</ConfigProvider>
```

### 3. CSS Variables

All CSS variables are defined in `app/theme.css` and set dynamically:

```css
:root {
  --color-primary: #ff6b35;
  --color-secondary: #004e89;
  --color-accent: #f7b801;
  --font-family: Inter, system-ui, sans-serif;
  --font-size-base: 16px;
  /* ... more variables ... */
}
```

### 4. Tailwind Integration

Tailwind config uses CSS variables for colors, fonts, spacing:

```js
colors: {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  accent: 'var(--color-accent)',
  // ... etc
}
```

## Using Theme Colors in Components

### Via Tailwind Classes

```jsx
// Button with primary color (changes per domain)
<button className="bg-primary text-white hover:bg-primary-dark">
  Click me
</button>

// Text with secondary color
<h1 className="text-secondary">Heading</h1>

// Background with accent
<div className="bg-accent">Accent section</div>
```

### Via CSS Variables Directly

```jsx
<div style={{ color: 'var(--color-primary)' }}>
  This color changes per domain
</div>
```

### Via Theme Hook

```typescript
import { useBrandingValue } from '@/contexts/ConfigContext';

export function Header() {
  const primaryColor = useBrandingValue('primaryColor');
  
  return (
    <header style={{ backgroundColor: primaryColor }}>
      Header
    </header>
  );
}
```

## Available CSS Variables

### Colors

```css
--color-primary          /* Domain primary color */
--color-primary-light    /* Lighter shade of primary */
--color-primary-dark     /* Darker shade of primary */

--color-secondary        /* Domain secondary color */
--color-secondary-light
--color-secondary-dark

--color-accent           /* Accent color */
--color-text             /* Text color */
--color-background       /* Background color */

--color-border           /* Border color */
--color-success          /* Success/green */
--color-warning          /* Warning/amber */
--color-error            /* Error/red */
```

### Typography

```css
--font-family            /* Font family */
--font-size-small        /* Small text (12px default) */
--font-size-base         /* Base text (16px default) */
--font-size-large        /* Large text (20px default) */
--font-size-xlarge       /* Extra large text (32px default) */
```

### Spacing

```css
--spacing-xs   /* 0.25rem */
--spacing-sm   /* 0.5rem */
--spacing-md   /* 1rem */
--spacing-lg   /* 1.5rem */
--spacing-xl   /* 2rem */
--spacing-2xl  /* 3rem */
```

### Border Radius

```css
--radius-sm    /* 0.25rem */
--radius-md    /* 0.5rem */
--radius-lg    /* 1rem */
--radius-full  /* 9999px */
```

### Shadows

```css
--shadow-sm    /* Small shadow */
--shadow-md    /* Medium shadow */
--shadow-lg    /* Large shadow */
--shadow-xl    /* Extra large shadow */
```

### Transitions

```css
--transition-fast  /* 150ms */
--transition-base  /* 250ms */
--transition-slow  /* 350ms */
```

## Examples

### Example 1: Themed Button Component

```jsx
'use client';

import { useBrandingValue } from '@/contexts/ConfigContext';

export function ThemedButton({ children, onClick }) {
  const primaryColor = useBrandingValue('primaryColor');
  
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-md text-white transition-fast hover:opacity-80"
      style={{ backgroundColor: primaryColor }}
    >
      {children}
    </button>
  );
}

// Or simpler with Tailwind:
export function ThemedButtonSimple({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-dark transition-fast"
    >
      {children}
    </button>
  );
}
```

### Example 2: Themed Card Component

```jsx
export function Card({ title, children }) {
  return (
    <div className="border border-border rounded-lg shadow-md p-lg bg-background">
      <h3 className="text-lg font-semibold text-secondary mb-md">
        {title}
      </h3>
      <div className="text-base text-text">
        {children}
      </div>
    </div>
  );
}
```

### Example 3: Dynamic Header Component

```jsx
'use client';

import { useBranding } from '@/contexts/ConfigContext';

export function DynamicHeader() {
  const branding = useBranding();

  return (
    <header
      style={{
        backgroundColor: branding.primaryColor,
        color: branding.backgroundColor,
        fontFamily: branding.fontFamily,
      }}
      className="p-lg shadow-lg"
    >
      <img src={branding.brandLogo} alt={branding.brandName} height={40} />
      <h1 className="text-xl font-bold mt-md">{branding.brandName}</h1>
    </header>
  );
}
```

## Domain Examples

### Fitness Domain

```json
{
  "primaryColor": "#ff6b35",    // Orange/red for energy
  "secondaryColor": "#004e89",  // Deep blue for trust
  "accentColor": "#f7b801",     // Gold for achievement
  "fontFamily": "Inter, system-ui, sans-serif"
}
```

Looks like: Energetic, sporty, motivating

### Business Domain

```json
{
  "primaryColor": "#1e40af",    // Professional blue
  "secondaryColor": "#0f766e",  // Teal for stability
  "accentColor": "#fbbf24",     // Gold for premium
  "fontFamily": "Segoe UI, Roboto, sans-serif"
}
```

Looks like: Professional, corporate, trustworthy

### Healthcare Domain

```json
{
  "primaryColor": "#0891b2",    // Cyan for healthcare
  "secondaryColor": "#059669",  // Green for wellness
  "accentColor": "#f59e0b",     // Amber for caution
  "fontFamily": "Trebuchet MS, system-ui, sans-serif"
}
```

Looks like: Medical, professional, caring

## Adding New Theme Properties

To add a new theme property:

### 1. Add to Backend Schema

```typescript
// backend/src/config/schema.ts
export interface BrandingConfig {
  // ... existing fields
  accentColorLight?: string;
}
```

### 2. Add to Frontend Schema

```typescript
// frontend/config/schema.ts
export interface FrontendBrandingConfig {
  // ... existing fields
  accentColorLight?: string;
}
```

### 3. Add to Domain Configs

```json
{
  "branding": {
    "accentColorLight": "#fcd34d"
  }
}
```

### 4. Update Theme Utility

```typescript
// frontend/lib/theme.ts
export interface ThemeColors {
  // ... existing colors
  accentLight: string;
}

export function createThemeFromBranding(branding) {
  // ... existing code
  return {
    colors: {
      // ... existing colors
      accentLight: branding.accentColorLight,
    },
    // ...
  };
}
```

### 5. Use in Components

```jsx
<div className="bg-accent-light">Light accent section</div>
```

## Performance Considerations

- **CSS Variables are performant**: Modern browsers handle CSS variables efficiently
- **No runtime overhead**: Theme is applied once on app load
- **Caching**: Config is cached, only fetched once
- **No re-renders**: Theme changes don't cause React re-renders (they're CSS-only)

## Browser Support

- **Chrome**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support (iOS 9.1+)
- **Edge**: ✅ Full support
- **IE 11**: ❌ CSS variables not supported (consider fallback if needed)

## Debugging

### Check Applied CSS Variables

```javascript
// In browser console
getComputedStyle(document.documentElement).getPropertyValue('--color-primary');
// Returns: #ff6b35
```

### Print Theme Summary

```typescript
import { getConfigService } from '@/services/config.service';
import { createThemeFromBranding } from '@/lib/theme';

const branding = getConfigService().getBranding();
const theme = createThemeFromBranding(branding);
console.log('Applied Theme:', theme);
```

### Verify Theme Provider is Working

Open DevTools → Elements → Check `<style id="theme-variables">` exists in `<head>`

## Best Practices

### 1. Use Semantic Color Names

❌ Bad:
```jsx
<div style={{ color: 'var(--color-primary)' }}>Text</div>
```

✅ Good:
```jsx
<button className="bg-primary text-white">Click</button>
```

### 2. Fallback to Tailwind When Possible

❌ Bad:
```jsx
<div style={{ backgroundColor: brandingConfig.primaryColor }}>
  Custom section
</div>
```

✅ Good:
```jsx
<div className="bg-primary">
  Section
</div>
```

### 3. Leverage Derived Colors

Use `-light` and `-dark` variants instead of adding more colors:

```jsx
<button className="bg-primary hover:bg-primary-dark">
  Hover effect
</button>
```

## Troubleshooting

### Theme Not Applying

1. Check ConfigProvider and ThemeProvider are in layout
2. Verify backend `/api/config` returns branding data
3. Check browser console for errors
4. Open DevTools and check `<style id="theme-variables">` exists

### Colors Not Changing

1. Verify Tailwind classes use color variables
2. Check CSS variable names match exactly
3. Clear browser cache
4. Rebuild: `npm run build`

### Performance Issues

1. CSS variables are lightweight - unlikely to be the cause
2. Check if too many re-renders happening
3. Profile with DevTools Performance tab
