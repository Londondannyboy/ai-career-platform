/**
 * Quest Design System - Color Tokens
 * 
 * This file defines all color tokens used throughout the Quest platform.
 * Colors are defined using HSL values for easy manipulation and theming.
 */

// Raw color palette - These should rarely be used directly
export const palette = {
  // Primary - Professional Blue
  blue: {
    50: 'hsl(210, 100%, 97%)',
    100: 'hsl(210, 100%, 94%)',
    200: 'hsl(210, 100%, 86%)',
    300: 'hsl(210, 100%, 75%)',
    400: 'hsl(210, 100%, 60%)',
    500: 'hsl(210, 100%, 50%)', // Primary
    600: 'hsl(210, 100%, 42%)',
    700: 'hsl(210, 100%, 35%)',
    800: 'hsl(210, 100%, 28%)',
    900: 'hsl(210, 100%, 22%)',
    950: 'hsl(210, 100%, 15%)',
  },
  
  // Accent - Energetic Purple
  purple: {
    50: 'hsl(270, 100%, 97%)',
    100: 'hsl(270, 100%, 94%)',
    200: 'hsl(270, 100%, 86%)',
    300: 'hsl(270, 100%, 75%)',
    400: 'hsl(270, 100%, 60%)',
    500: 'hsl(270, 100%, 50%)', // Accent
    600: 'hsl(270, 100%, 42%)',
    700: 'hsl(270, 100%, 35%)',
    800: 'hsl(270, 100%, 28%)',
    900: 'hsl(270, 100%, 22%)',
    950: 'hsl(270, 100%, 15%)',
  },
  
  // Neutral - Sophisticated Grays
  gray: {
    50: 'hsl(210, 20%, 98%)',
    100: 'hsl(210, 20%, 96%)',
    200: 'hsl(210, 20%, 90%)',
    300: 'hsl(210, 20%, 82%)',
    400: 'hsl(210, 20%, 65%)',
    500: 'hsl(210, 20%, 50%)',
    600: 'hsl(210, 20%, 40%)',
    700: 'hsl(210, 20%, 30%)',
    800: 'hsl(210, 20%, 20%)',
    900: 'hsl(210, 20%, 13%)',
    950: 'hsl(210, 20%, 7%)',
  },
  
  // Semantic Colors
  green: {
    50: 'hsl(140, 85%, 96%)',
    500: 'hsl(140, 85%, 42%)', // Success
    600: 'hsl(140, 85%, 35%)',
  },
  
  amber: {
    50: 'hsl(40, 95%, 96%)',
    500: 'hsl(40, 95%, 50%)', // Warning
    600: 'hsl(40, 95%, 42%)',
  },
  
  red: {
    50: 'hsl(0, 85%, 96%)',
    500: 'hsl(0, 85%, 55%)', // Error
    600: 'hsl(0, 85%, 45%)',
  },
} as const;

// Semantic color tokens - Use these in components
export const colors = {
  // Background colors
  background: {
    primary: 'var(--color-background)',
    secondary: 'var(--color-background-secondary)',
    tertiary: 'var(--color-background-tertiary)',
    elevated: 'var(--color-background-elevated)',
    overlay: 'var(--color-background-overlay)',
  },
  
  // Text colors
  text: {
    primary: 'var(--color-text-primary)',
    secondary: 'var(--color-text-secondary)',
    tertiary: 'var(--color-text-tertiary)',
    disabled: 'var(--color-text-disabled)',
    inverse: 'var(--color-text-inverse)',
  },
  
  // Border colors
  border: {
    default: 'var(--color-border-default)',
    subtle: 'var(--color-border-subtle)',
    strong: 'var(--color-border-strong)',
  },
  
  // Interactive colors
  primary: {
    default: 'var(--color-primary)',
    hover: 'var(--color-primary-hover)',
    active: 'var(--color-primary-active)',
    disabled: 'var(--color-primary-disabled)',
  },
  
  // Accent colors
  accent: {
    default: 'var(--color-accent)',
    hover: 'var(--color-accent-hover)',
    active: 'var(--color-accent-active)',
    subtle: 'var(--color-accent-subtle)',
  },
  
  // Semantic colors
  semantic: {
    success: 'var(--color-success)',
    successSubtle: 'var(--color-success-subtle)',
    warning: 'var(--color-warning)',
    warningSubtle: 'var(--color-warning-subtle)',
    error: 'var(--color-error)',
    errorSubtle: 'var(--color-error-subtle)',
    info: 'var(--color-info)',
    infoSubtle: 'var(--color-info-subtle)',
  },
  
  // Chart/Visualization colors
  visualization: {
    blue: palette.blue[500],
    purple: palette.purple[500],
    green: palette.green[500],
    amber: palette.amber[500],
    red: palette.red[500],
    // Extended palette for complex visualizations
    extended: [
      'hsl(200, 85%, 50%)', // Cyan
      'hsl(160, 85%, 45%)', // Teal
      'hsl(30, 90%, 55%)',  // Orange
      'hsl(330, 85%, 55%)', // Pink
      'hsl(50, 90%, 50%)',  // Yellow
    ],
  },
} as const;

// Theme-specific color mappings
export const lightTheme = {
  '--color-background': palette.gray[50],
  '--color-background-secondary': palette.gray[100],
  '--color-background-tertiary': palette.gray[200],
  '--color-background-elevated': '#ffffff',
  '--color-background-overlay': 'hsla(0, 0%, 0%, 0.5)',
  
  '--color-text-primary': palette.gray[900],
  '--color-text-secondary': palette.gray[700],
  '--color-text-tertiary': palette.gray[500],
  '--color-text-disabled': palette.gray[400],
  '--color-text-inverse': '#ffffff',
  
  '--color-border-default': palette.gray[300],
  '--color-border-subtle': palette.gray[200],
  '--color-border-strong': palette.gray[400],
  
  '--color-primary': palette.blue[600],
  '--color-primary-hover': palette.blue[700],
  '--color-primary-active': palette.blue[800],
  '--color-primary-disabled': palette.blue[300],
  
  '--color-accent': palette.purple[600],
  '--color-accent-hover': palette.purple[700],
  '--color-accent-active': palette.purple[800],
  '--color-accent-subtle': palette.purple[100],
  
  '--color-success': palette.green[600],
  '--color-success-subtle': palette.green[50],
  '--color-warning': palette.amber[600],
  '--color-warning-subtle': palette.amber[50],
  '--color-error': palette.red[600],
  '--color-error-subtle': palette.red[50],
  '--color-info': palette.blue[600],
  '--color-info-subtle': palette.blue[50],
};

export const darkTheme = {
  '--color-background': palette.gray[950],
  '--color-background-secondary': palette.gray[900],
  '--color-background-tertiary': palette.gray[800],
  '--color-background-elevated': palette.gray[900],
  '--color-background-overlay': 'hsla(0, 0%, 0%, 0.7)',
  
  '--color-text-primary': palette.gray[50],
  '--color-text-secondary': palette.gray[300],
  '--color-text-tertiary': palette.gray[400],
  '--color-text-disabled': palette.gray[600],
  '--color-text-inverse': palette.gray[900],
  
  '--color-border-default': palette.gray[700],
  '--color-border-subtle': palette.gray[800],
  '--color-border-strong': palette.gray[600],
  
  '--color-primary': palette.blue[500],
  '--color-primary-hover': palette.blue[400],
  '--color-primary-active': palette.blue[300],
  '--color-primary-disabled': palette.blue[700],
  
  '--color-accent': palette.purple[500],
  '--color-accent-hover': palette.purple[400],
  '--color-accent-active': palette.purple[300],
  '--color-accent-subtle': palette.purple[900],
  
  '--color-success': palette.green[500],
  '--color-success-subtle': palette.green[900],
  '--color-warning': palette.amber[500],
  '--color-warning-subtle': palette.amber[900],
  '--color-error': palette.red[500],
  '--color-error-subtle': palette.red[900],
  '--color-info': palette.blue[500],
  '--color-info-subtle': palette.blue[900],
};

// Utility function to apply theme
export function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement;
  const themeColors = theme === 'light' ? lightTheme : darkTheme;
  
  Object.entries(themeColors).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
}

// Type definitions for TypeScript
export type ColorToken = keyof typeof colors;
export type SemanticColor = keyof typeof colors.semantic;
export type VisualizationColor = keyof typeof colors.visualization;