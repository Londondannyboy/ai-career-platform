/**
 * Quest Design System - Typography Tokens
 * 
 * Defines the complete typography system including font families,
 * sizes, weights, line heights, and responsive scaling.
 */

// Font families
export const fontFamilies = {
  sans: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ].join(', '),
  
  mono: [
    'JetBrains Mono',
    'Fira Code',
    'Monaco',
    'Consolas',
    'Courier New',
    'monospace',
  ].join(', '),
  
  display: [
    'Cal Sans',
    'Inter',
    'sans-serif',
  ].join(', '),
} as const;

// Font weights
export const fontWeights = {
  thin: 100,
  extralight: 200,
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const;

// Base font sizes (in rem)
export const fontSizes = {
  '2xs': '0.625rem',   // 10px
  xs: '0.75rem',       // 12px
  sm: '0.875rem',      // 14px
  base: '1rem',        // 16px
  lg: '1.125rem',      // 18px
  xl: '1.25rem',       // 20px
  '2xl': '1.5rem',     // 24px
  '3xl': '1.875rem',   // 30px
  '4xl': '2.25rem',    // 36px
  '5xl': '3rem',       // 48px
  '6xl': '3.75rem',    // 60px
  '7xl': '4.5rem',     // 72px
  '8xl': '6rem',       // 96px
} as const;

// Line heights
export const lineHeights = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

// Letter spacing
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

// Typography scale with responsive sizing
export const typeScale = {
  // Display - For hero sections and major headings
  display: {
    fontSize: 'clamp(2.5rem, 5vw + 1rem, 4.5rem)',
    lineHeight: lineHeights.tight,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.tight,
    fontFamily: fontFamilies.display,
  },
  
  // Headings
  h1: {
    fontSize: 'clamp(2rem, 4vw + 0.5rem, 3rem)',
    lineHeight: lineHeights.tight,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.tight,
    fontFamily: fontFamilies.sans,
  },
  
  h2: {
    fontSize: 'clamp(1.5rem, 3vw + 0.25rem, 2.25rem)',
    lineHeight: lineHeights.snug,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.tight,
    fontFamily: fontFamilies.sans,
  },
  
  h3: {
    fontSize: 'clamp(1.25rem, 2vw + 0.25rem, 1.875rem)',
    lineHeight: lineHeights.snug,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.sans,
  },
  
  h4: {
    fontSize: 'clamp(1.125rem, 1.5vw + 0.125rem, 1.5rem)',
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.sans,
  },
  
  h5: {
    fontSize: 'clamp(1rem, 1vw + 0.125rem, 1.25rem)',
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.sans,
  },
  
  h6: {
    fontSize: '1.125rem',
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.wide,
    fontFamily: fontFamilies.sans,
  },
  
  // Body text
  bodyLarge: {
    fontSize: '1.125rem',
    lineHeight: lineHeights.relaxed,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.sans,
  },
  
  body: {
    fontSize: '1rem',
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.sans,
  },
  
  bodySmall: {
    fontSize: '0.875rem',
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.sans,
  },
  
  // UI text
  label: {
    fontSize: '0.875rem',
    lineHeight: lineHeights.tight,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.wide,
    fontFamily: fontFamilies.sans,
  },
  
  caption: {
    fontSize: '0.75rem',
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.wide,
    fontFamily: fontFamilies.sans,
  },
  
  overline: {
    fontSize: '0.75rem',
    lineHeight: lineHeights.tight,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.widest,
    fontFamily: fontFamilies.sans,
    textTransform: 'uppercase' as const,
  },
  
  // Code
  code: {
    fontSize: '0.875rem',
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.mono,
  },
  
  codeBlock: {
    fontSize: '0.875rem',
    lineHeight: lineHeights.relaxed,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.mono,
  },
} as const;

// Text decoration utilities
export const textDecoration = {
  underline: 'underline',
  overline: 'overline',
  lineThrough: 'line-through',
  none: 'none',
} as const;

// Text transform utilities
export const textTransform = {
  uppercase: 'uppercase',
  lowercase: 'lowercase',
  capitalize: 'capitalize',
  none: 'none',
} as const;

// Typography CSS custom properties
export const typographyVars = {
  '--font-sans': fontFamilies.sans,
  '--font-mono': fontFamilies.mono,
  '--font-display': fontFamilies.display,
  
  // Font size scale
  '--text-2xs': fontSizes['2xs'],
  '--text-xs': fontSizes.xs,
  '--text-sm': fontSizes.sm,
  '--text-base': fontSizes.base,
  '--text-lg': fontSizes.lg,
  '--text-xl': fontSizes.xl,
  '--text-2xl': fontSizes['2xl'],
  '--text-3xl': fontSizes['3xl'],
  '--text-4xl': fontSizes['4xl'],
  '--text-5xl': fontSizes['5xl'],
  '--text-6xl': fontSizes['6xl'],
  '--text-7xl': fontSizes['7xl'],
  '--text-8xl': fontSizes['8xl'],
  
  // Line height scale
  '--leading-none': String(lineHeights.none),
  '--leading-tight': String(lineHeights.tight),
  '--leading-snug': String(lineHeights.snug),
  '--leading-normal': String(lineHeights.normal),
  '--leading-relaxed': String(lineHeights.relaxed),
  '--leading-loose': String(lineHeights.loose),
  
  // Letter spacing scale
  '--tracking-tighter': letterSpacing.tighter,
  '--tracking-tight': letterSpacing.tight,
  '--tracking-normal': letterSpacing.normal,
  '--tracking-wide': letterSpacing.wide,
  '--tracking-wider': letterSpacing.wider,
  '--tracking-widest': letterSpacing.widest,
};

// Utility function to apply typography scale
export function applyTypographyScale(element: HTMLElement, scale: keyof typeof typeScale) {
  const styles = typeScale[scale];
  Object.entries(styles).forEach(([property, value]) => {
    element.style[property as any] = value;
  });
}

// Type definitions
export type FontFamily = keyof typeof fontFamilies;
export type FontWeight = keyof typeof fontWeights;
export type FontSize = keyof typeof fontSizes;
export type LineHeight = keyof typeof lineHeights;
export type LetterSpacing = keyof typeof letterSpacing;
export type TypeScale = keyof typeof typeScale;