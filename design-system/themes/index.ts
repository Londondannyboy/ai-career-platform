/**
 * Quest Design System - Theme System
 * 
 * Complete theme management with light/dark modes,
 * custom properties, and theme switching utilities.
 */

import { lightTheme, darkTheme } from '../tokens/colors';
import { typographyVars } from '../tokens/typography';
import { spacingVars } from '../tokens/spacing';
import { shadowVars } from '../tokens/shadows';
import { animationVars } from '../tokens/animations';

// Theme configuration
export interface ThemeConfig {
  name: string;
  displayName: string;
  colors: Record<string, string>;
  isDark: boolean;
}

// Base theme structure
export const baseTheme = {
  ...typographyVars,
  ...spacingVars,
  ...shadowVars,
  ...animationVars,
} as const;

// Light theme configuration
export const lightThemeConfig: ThemeConfig = {
  name: 'light',
  displayName: 'Light',
  colors: lightTheme,
  isDark: false,
};

// Dark theme configuration
export const darkThemeConfig: ThemeConfig = {
  name: 'dark',
  displayName: 'Dark',
  colors: darkTheme,
  isDark: true,
};

// Available themes
export const themes = {
  light: lightThemeConfig,
  dark: darkThemeConfig,
} as const;

export type ThemeName = keyof typeof themes;

// Theme context type
export interface ThemeContextType {
  theme: ThemeName;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeName) => void;
}

// Theme storage key
const THEME_STORAGE_KEY = 'quest-theme';

// Utility functions
export function getSystemTheme(): ThemeName {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function getStoredTheme(): ThemeName | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored && (stored === 'light' || stored === 'dark') ? stored : null;
}

export function setStoredTheme(theme: ThemeName): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function getInitialTheme(): ThemeName {
  // Priority: stored preference > system preference > light
  return getStoredTheme() ?? getSystemTheme();
}

export function applyTheme(themeName: ThemeName): void {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  const theme = themes[themeName];
  
  // Apply base theme variables
  Object.entries(baseTheme).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  
  // Apply theme-specific colors
  Object.entries(theme.colors).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  
  // Update theme class
  root.classList.remove('light', 'dark');
  root.classList.add(themeName);
  
  // Update color-scheme for better browser integration
  root.style.colorScheme = theme.isDark ? 'dark' : 'light';
  
  // Store the theme
  setStoredTheme(themeName);
}

// Theme switching utilities
export function createThemeToggle() {
  return function toggleTheme(currentTheme: ThemeName): ThemeName {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    return newTheme;
  };
}

// System theme change listener
export function createSystemThemeListener(
  callback: (theme: ThemeName) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e: MediaQueryListEvent) => {
    const systemTheme = e.matches ? 'dark' : 'light';
    // Only apply if user hasn't set a preference
    if (!getStoredTheme()) {
      callback(systemTheme);
    }
  };
  
  mediaQuery.addEventListener('change', handleChange);
  
  return () => mediaQuery.removeEventListener('change', handleChange);
}

// CSS-in-JS theme object for styled-components or emotion
export function createCSSTheme(themeName: ThemeName) {
  const theme = themes[themeName];
  
  return {
    name: themeName,
    isDark: theme.isDark,
    colors: theme.colors,
    // Transform CSS custom properties to JS object
    tokens: Object.entries({ ...baseTheme, ...theme.colors }).reduce(
      (acc, [key, value]) => {
        // Convert --property-name to propertyName
        const jsKey = key.replace(/^--/, '').replace(/-([a-z])/g, (_, letter) => 
          letter.toUpperCase()
        );
        acc[jsKey] = value;
        return acc;
      },
      {} as Record<string, string>
    ),
  };
}

// Theme validation
export function isValidTheme(theme: string): theme is ThemeName {
  return theme === 'light' || theme === 'dark';
}

// Initialize theme system
export function initializeTheme(): ThemeName {
  const initialTheme = getInitialTheme();
  applyTheme(initialTheme);
  return initialTheme;
}

// Export theme constants for use in components
export const THEME_CLASSES = {
  light: 'light',
  dark: 'dark',
} as const;

export const THEME_ATTRIBUTES = {
  'data-theme': 'data-theme',
  'color-scheme': 'color-scheme',
} as const;

// Component props type for theme-aware components
export interface ThemeAwareProps {
  theme?: ThemeName;
  className?: string;
}

// HOC for theme-aware styling
export function withThemeClass<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P & ThemeAwareProps> {
  return function ThemedComponent({ theme, className = '', ...props }: P & ThemeAwareProps) {
    const themeClass = theme ? THEME_CLASSES[theme] : '';
    const combinedClassName = [themeClass, className].filter(Boolean).join(' ');
    
    return React.createElement(Component, {
      ...(props as P),
      className: combinedClassName
    });
  };
}