/**
 * Quest Design System - Spacing Tokens
 * 
 * Consistent spacing scale based on a 4px grid system.
 * All spacing values are multiples of the base unit.
 */

// Base spacing unit (4px)
export const BASE_UNIT = 4;

// Spacing scale - using rem values for better accessibility
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px - base unit
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px
  3.5: '0.875rem',   // 14px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  9: '2.25rem',      // 36px
  10: '2.5rem',      // 40px
  11: '2.75rem',     // 44px
  12: '3rem',        // 48px
  14: '3.5rem',      // 56px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  28: '7rem',        // 112px
  32: '8rem',        // 128px
  36: '9rem',        // 144px
  40: '10rem',       // 160px
  44: '11rem',       // 176px
  48: '12rem',       // 192px
  52: '13rem',       // 208px
  56: '14rem',       // 224px
  60: '15rem',       // 240px
  64: '16rem',       // 256px
  72: '18rem',       // 288px
  80: '20rem',       // 320px
  96: '24rem',       // 384px
} as const;

// Layout spacing - for consistent component spacing
export const layout = {
  // Page margins
  page: {
    mobile: spacing[4],      // 16px
    tablet: spacing[6],      // 24px
    desktop: spacing[8],     // 32px
    wide: spacing[12],       // 48px
  },
  
  // Section spacing
  section: {
    xs: spacing[8],          // 32px
    sm: spacing[12],         // 48px
    md: spacing[16],         // 64px
    lg: spacing[24],         // 96px
    xl: spacing[32],         // 128px
  },
  
  // Component spacing
  component: {
    xs: spacing[2],          // 8px
    sm: spacing[3],          // 12px
    md: spacing[4],          // 16px
    lg: spacing[6],          // 24px
    xl: spacing[8],          // 32px
  },
  
  // Content spacing (between elements)
  content: {
    xs: spacing[1],          // 4px
    sm: spacing[2],          // 8px
    md: spacing[3],          // 12px
    lg: spacing[4],          // 16px
    xl: spacing[6],          // 24px
  },
  
  // Grid gaps
  grid: {
    xs: spacing[2],          // 8px
    sm: spacing[4],          // 16px
    md: spacing[6],          // 24px
    lg: spacing[8],          // 32px
    xl: spacing[12],         // 48px
  },
} as const;

// Container widths
export const containers = {
  xs: '20rem',        // 320px
  sm: '24rem',        // 384px
  md: '28rem',        // 448px
  lg: '32rem',        // 512px
  xl: '36rem',        // 576px
  '2xl': '42rem',     // 672px
  '3xl': '48rem',     // 768px
  '4xl': '56rem',     // 896px
  '5xl': '64rem',     // 1024px
  '6xl': '72rem',     // 1152px
  '7xl': '80rem',     // 1280px
  full: '100%',
  prose: '65ch',      // Optimal reading width
} as const;

// Breakpoints for responsive design
export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Border radius scale
export const borderRadius = {
  none: '0',
  sm: '0.125rem',     // 2px
  base: '0.25rem',    // 4px
  md: '0.375rem',     // 6px
  lg: '0.5rem',       // 8px
  xl: '0.75rem',      // 12px
  '2xl': '1rem',      // 16px
  '3xl': '1.5rem',    // 24px
  full: '9999px',     // Fully rounded
} as const;

// Z-index scale for layering
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  notification: 80,
  splash: 90,
} as const;

// Aspect ratios for media
export const aspectRatios = {
  square: '1 / 1',
  video: '16 / 9',
  videoVertical: '9 / 16',
  photo: '4 / 3',
  photoWide: '3 / 2',
  photoUltraWide: '21 / 9',
  golden: '1.618 / 1',
} as const;

// CSS custom properties for spacing
export const spacingVars = {
  // Spacing scale
  '--space-0': spacing[0],
  '--space-px': spacing.px,
  '--space-0-5': spacing[0.5],
  '--space-1': spacing[1],
  '--space-1-5': spacing[1.5],
  '--space-2': spacing[2],
  '--space-2-5': spacing[2.5],
  '--space-3': spacing[3],
  '--space-3-5': spacing[3.5],
  '--space-4': spacing[4],
  '--space-5': spacing[5],
  '--space-6': spacing[6],
  '--space-7': spacing[7],
  '--space-8': spacing[8],
  '--space-9': spacing[9],
  '--space-10': spacing[10],
  '--space-11': spacing[11],
  '--space-12': spacing[12],
  '--space-14': spacing[14],
  '--space-16': spacing[16],
  '--space-20': spacing[20],
  '--space-24': spacing[24],
  '--space-28': spacing[28],
  '--space-32': spacing[32],
  
  // Layout tokens
  '--layout-page-mobile': layout.page.mobile,
  '--layout-page-tablet': layout.page.tablet,
  '--layout-page-desktop': layout.page.desktop,
  '--layout-page-wide': layout.page.wide,
  
  // Border radius
  '--radius-sm': borderRadius.sm,
  '--radius-base': borderRadius.base,
  '--radius-md': borderRadius.md,
  '--radius-lg': borderRadius.lg,
  '--radius-xl': borderRadius.xl,
  '--radius-2xl': borderRadius['2xl'],
  '--radius-3xl': borderRadius['3xl'],
  '--radius-full': borderRadius.full,
};

// Utility functions
export function getSpacing(value: keyof typeof spacing): string {
  return spacing[value];
}

export function getBreakpoint(size: keyof typeof breakpoints): string {
  return breakpoints[size];
}

export function createMediaQuery(breakpoint: keyof typeof breakpoints): string {
  return `@media (min-width: ${breakpoints[breakpoint]})`;
}

// Type definitions
export type SpacingScale = keyof typeof spacing;
export type LayoutSpacing = keyof typeof layout;
export type Container = keyof typeof containers;
export type Breakpoint = keyof typeof breakpoints;
export type BorderRadius = keyof typeof borderRadius;
export type ZIndex = keyof typeof zIndex;
export type AspectRatio = keyof typeof aspectRatios;