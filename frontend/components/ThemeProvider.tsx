/**
 * Theme Provider Component
 * Applies theme CSS variables based on domain configuration
 * Must be used inside ConfigProvider
 */

'use client';

import { useEffect } from 'react';
import { useBranding } from '../contexts/ConfigContext';
import { createThemeFromBranding, applyThemeToDOM } from '../lib/theme';

/**
 * ThemeProvider Component
 * Applies dynamic theming based on branding configuration
 * 
 * Usage:
 * <ConfigProvider>
 *   <ThemeProvider>
 *     <App />
 *   </ThemeProvider>
 * </ConfigProvider>
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const branding = useBranding();

  useEffect(() => {
    // Create theme from branding config
    const theme = createThemeFromBranding(branding);

    // Apply theme to DOM
    applyThemeToDOM(theme);

    console.log('[THEME PROVIDER] Theme applied:', branding.domain);
  }, [branding]);

  return <>{children}</>;
}

export default ThemeProvider;
