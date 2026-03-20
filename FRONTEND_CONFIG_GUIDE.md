# Frontend Configuration System - Usage Guide

## Overview

The frontend configuration system provides a centralized way to access domain-specific branding, features, and business logic throughout your React application.

## Architecture

```
ConfigService (singleton)
    ↓ fetches from
Backend /api/config endpoint
    ↓ cached in
ConfigContext (React Context)
    ↓ accessed via
Custom Hooks (useBranding, useFeatures, etc.)
    ↓ used in
Components
```

## Setup

### 1. Environment Variables

Add to your `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 2. Wrap Your App with ConfigProvider

In `app/layout.tsx`:

```typescript
import { ConfigProvider } from '../contexts/ConfigContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ConfigProvider>
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
```

## Usage Examples

### 1. Get Full Configuration

```typescript
'use client';

import { useDomainConfig } from '@/contexts/ConfigContext';

export function MyComponent() {
  const { config, loading, error } = useDomainConfig();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>Domain: {config.domain}</div>;
}
```

### 2. Use Branding

```typescript
import { useBranding, useBrandingValue } from '@/contexts/ConfigContext';

export function Header() {
  const branding = useBranding();
  const primaryColor = useBrandingValue('primaryColor');

  return (
    <header style={{ backgroundColor: primaryColor }}>
      <img src={branding.brandLogo} alt={branding.brandName} />
      <h1>{branding.brandName}</h1>
    </header>
  );
}
```

### 3. Check Feature Flags

```typescript
import { useFeatureEnabled, useFeatures } from '@/contexts/ConfigContext';

export function VoiceChat() {
  const voiceInputEnabled = useFeatureEnabled('voiceInput');
  const voiceOutputEnabled = useFeatureEnabled('voiceOutput');
  const features = useFeatures();

  if (!voiceInputEnabled) {
    return <div>Voice input is not enabled for this domain</div>;
  }

  return (
    <div>
      <VoiceInput />
      {voiceOutputEnabled && <VoiceOutput />}
    </div>
  );
}
```

### 4. Get Business Logic Settings

```typescript
import { useBusinessLogic } from '@/contexts/ConfigContext';

export function Pricing() {
  const { currency, supportedLanguages, defaultLanguage } = useBusinessLogic();

  return (
    <div>
      <p>Currency: {currency}</p>
      <p>Default Language: {defaultLanguage}</p>
      <p>Supported: {supportedLanguages.join(', ')}</p>
    </div>
  );
}
```

### 5. Get Domain ID

```typescript
import { useDomain } from '@/contexts/ConfigContext';

export function Analytics() {
  const domain = useDomain();

  const trackEvent = (event: string) => {
    console.log(`[${domain}] ${event}`);
  };

  return <div onClick={() => trackEvent('clicked')} />;
}
```

## Hook Reference

### `useDomainConfig()`

Returns the full configuration object and loading state.

```typescript
const { config, loading, error, isFeatureEnabled } = useDomainConfig();
```

### `useBranding()`

Returns branding configuration (colors, logo, fonts, etc.).

```typescript
const branding = useBranding();
// branding.primaryColor, branding.brandName, etc.
```

### `useFeatures()`

Returns all feature flags.

```typescript
const features = useFeatures();
// features.voiceInput, features.videoSupport, etc.
```

### `useBusinessLogic()`

Returns business logic configuration.

```typescript
const logic = useBusinessLogic();
// logic.currency, logic.supportedLanguages, etc.
```

### `useFeatureEnabled(feature)`

Check if a specific feature is enabled.

```typescript
const voiceEnabled = useFeatureEnabled('voiceInput');
if (voiceEnabled) {
  // Show voice input UI
}
```

### `useDomain()`

Get the current domain ID.

```typescript
const domain = useDomain();
// 'fitness', 'business', etc.
```

### `useBrandingValue(key)`

Get a specific branding value.

```typescript
const primaryColor = useBrandingValue('primaryColor');
const logoUrl = useBrandingValue('brandLogo');
```

## Best Practices

### 1. Use Specific Hooks When Possible

❌ Bad:
```typescript
const { config } = useDomainConfig();
const color = config.branding.primaryColor;
```

✅ Good:
```typescript
const color = useBrandingValue('primaryColor');
```

### 2. Handle Loading State

❌ Bad:
```typescript
const { config } = useDomainConfig();
return <div>{config.branding.brandName}</div>; // Might be undefined
```

✅ Good:
```typescript
const { config, loading } = useDomainConfig();
if (loading) return <Skeleton />;
return <div>{config.branding.brandName}</div>;
```

### 3. Conditional Rendering Based on Features

✅ Good:
```typescript
const voiceSupported = useFeatureEnabled('voiceInput');

return (
  <div>
    {voiceSupported && <VoiceInput />}
    <TextInput />
  </div>
);
```

### 4. Apply Branding Globally

Create a theme hook for consistency:

```typescript
export function useTheme() {
  const branding = useBranding();
  
  return {
    colors: {
      primary: branding.primaryColor,
      secondary: branding.secondaryColor,
      text: branding.textColor,
      bg: branding.backgroundColor,
    },
    fonts: branding.fontFamily,
  };
}
```

## Configuration Loading Flow

1. App starts → `ConfigProvider` mounts
2. `useEffect` calls `initializeConfig()`
3. `ConfigService` fetches `/api/config` from backend
4. Response is normalized and cached
5. Config context is updated
6. Components re-render with new config

If fetch fails, defaults are used as fallback.

## Debugging

### Print Configuration Summary

```typescript
import { getConfigService } from '@/services/config.service';

// In your component or console
getConfigService().printSummary();
```

### Check Config in Browser Console

```javascript
// Access the config service
import { getConfigService } from './services/config.service';
const config = getConfigService().getConfig();
console.log(config);
```

### Monitor Loading State

```typescript
export function ConfigDebug() {
  const { config, loading, error } = useDomainConfig();

  return (
    <div style={{ position: 'fixed', bottom: 0, right: 0, padding: '10px' }}>
      <p>Loading: {loading ? '⏳' : '✅'}</p>
      <p>Domain: {config.domain}</p>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
}
```

## Extending Configuration

To add new configuration properties:

1. Update `backend/src/config/schema.ts` to add the field
2. Update `frontend/config/schema.ts` to include the public version
3. Update domain JSON files (e.g., `fitness.json`)
4. Create new hook in `ConfigContext.tsx` if needed
5. Update components to use the new config

Example - Add a "support email" field:

```typescript
// backend/src/config/schema.ts
export interface BrandingConfig {
  // ... existing fields
  supportEmail: string;
}

// frontend/config/schema.ts
export interface FrontendBrandingConfig {
  // ... existing fields
  supportEmail: string;
}

// Add hook
export function useSupportEmail(): string {
  return useBrandingValue('supportEmail');
}

// Use in component
const supportEmail = useSupportEmail();
```

## Common Patterns

### Setting Up Domain-Specific Styles

```typescript
export function useStyles() {
  const branding = useBranding();

  return {
    container: {
      backgroundColor: branding.backgroundColor,
      color: branding.textColor,
      fontFamily: branding.fontFamily,
    },
    button: {
      backgroundColor: branding.primaryColor,
      color: branding.backgroundColor,
    },
    heading: {
      color: branding.secondaryColor,
    },
  };
}
```

### Conditional Feature Modules

```typescript
export function ChatApp() {
  const voiceInput = useFeatureEnabled('voiceInput');
  const videoSupport = useFeatureEnabled('videoSupport');

  return (
    <div>
      <TextInput />
      {voiceInput && <VoiceInput />}
      {videoSupport && <VideoChat />}
    </div>
  );
}
```

## Troubleshooting

### Config Not Loading

1. Check that `ConfigProvider` wraps your app
2. Verify backend is running on correct port
3. Check `NEXT_PUBLIC_API_URL` environment variable
4. Open browser console for error messages

### Hooks Throwing "Not in ConfigProvider"

Make sure the component using the hook is wrapped by `ConfigProvider`.

### Stale Config in Development

Clear browser cache and restart dev server.

### TypeScript Errors

Make sure your `.d.ts` files are generated correctly:
```bash
npm run build
```
