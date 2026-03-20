/**
 * Theme Utility
 * Converts branding configuration into CSS variables
 * Enables dynamic theming based on domain configuration
 */

import { FrontendBrandingConfig } from '../config/schema';

/**
 * Theme color scheme derived from branding
 */
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
  // Derived colors
  primaryLight: string;
  primaryDark: string;
  secondaryLight: string;
  secondaryDark: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

/**
 * Complete theme object
 */
export interface Theme {
  colors: ThemeColors;
  fonts: {
    family: string;
  };
  fontSizes: {
    small: string;
    base: string;
    large: string;
    xlarge: string;
  };
}

/**
 * Generate derived colors from base colors
 */
function generateDerivedColors(
  primary: string,
  secondary: string,
  accent: string,
  text: string,
  bg: string
): Omit<ThemeColors, 'primary' | 'secondary' | 'accent' | 'text' | 'background'> {
  return {
    primaryLight: lightenColor(primary, 20),
    primaryDark: darkenColor(primary, 20),
    secondaryLight: lightenColor(secondary, 20),
    secondaryDark: darkenColor(secondary, 20),
    border: lightenColor(text, 80),
    success: '#10b981', // Green
    warning: '#f59e0b', // Amber
    error: '#ef4444', // Red
  };
}

/**
 * Lighten a hex color
 */
function lightenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

/**
 * Darken a hex color
 */
function darkenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

/**
 * Create theme object from branding configuration
 */
export function createThemeFromBranding(branding: FrontendBrandingConfig): Theme {
  const baseColors = {
    primary: branding.primaryColor,
    secondary: branding.secondaryColor,
    accent: branding.accentColor,
    text: branding.textColor,
    background: branding.backgroundColor,
  };

  const derivedColors = generateDerivedColors(
    baseColors.primary,
    baseColors.secondary,
    baseColors.accent,
    baseColors.text,
    baseColors.background
  );

  return {
    colors: {
      ...baseColors,
      ...derivedColors,
    },
    fonts: {
      family: branding.fontFamily,
    },
    fontSizes: branding.fontSize,
  };
}

/**
 * Convert theme to CSS variables
 * Generates a string of CSS variable declarations
 */
export function themeToCSSVariables(theme: Theme): string {
  const cssVars: string[] = [];

  // Color variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    cssVars.push(`--color-${camelToKebab(key)}: ${value};`);
  });

  // Font variables
  cssVars.push(`--font-family: ${theme.fonts.family};`);

  // Font size variables
  Object.entries(theme.fontSizes).forEach(([key, value]) => {
    cssVars.push(`--font-size-${key}: ${value};`);
  });

  return cssVars.join('\n  ');
}

/**
 * Apply theme to DOM root element
 */
export function applyThemeToDOM(theme: Theme): void {
  const root = document.documentElement;
  const cssVars = themeToCSSVariables(theme);

  // Get existing style or create new one
  let styleId = 'theme-variables';
  let styleElement = document.getElementById(styleId) as HTMLStyleElement;

  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }

  // Set the CSS variables
  styleElement.textContent = `:root {\n  ${cssVars}\n}`;

  // Also set inline for immediate effect
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${camelToKebab(key)}`, value);
  });

  root.style.setProperty('--font-family', theme.fonts.family);

  Object.entries(theme.fontSizes).forEach(([key, value]) => {
    root.style.setProperty(`--font-size-${key}`, value);
  });

  console.log('[THEME] Applied theme to DOM');
}

/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Get CSS variable value
 */
export function getCSSVariable(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
}

/**
 * Get color from theme
 */
export function getThemeColor(colorName: keyof ThemeColors, theme: Theme): string {
  return theme.colors[colorName];
}
