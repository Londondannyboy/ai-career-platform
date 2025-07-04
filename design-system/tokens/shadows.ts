/**
 * Quest Design System - Shadow Tokens
 * 
 * Elevation system using layered shadows for depth and hierarchy.
 * Shadows adapt to light and dark themes automatically.
 */

// Shadow color bases
const shadowColors = {
  light: {
    umbra: 'rgba(0, 0, 0, 0.12)',      // Main shadow
    penumbra: 'rgba(0, 0, 0, 0.08)',   // Soft edge
    ambient: 'rgba(0, 0, 0, 0.04)',    // Ambient light
  },
  dark: {
    umbra: 'rgba(0, 0, 0, 0.24)',      // Stronger in dark mode
    penumbra: 'rgba(0, 0, 0, 0.16)',   
    ambient: 'rgba(0, 0, 0, 0.08)',    
  },
} as const;

// Elevation scale - Material Design inspired but adapted for Quest
export const shadows = {
  none: 'none',
  
  // Subtle elevation for cards and surfaces
  sm: `
    0 1px 2px 0 ${shadowColors.light.umbra},
    0 1px 3px 0 ${shadowColors.light.penumbra}
  `,
  
  // Default elevation for interactive elements
  base: `
    0 2px 4px -1px ${shadowColors.light.umbra},
    0 4px 6px -1px ${shadowColors.light.penumbra}
  `,
  
  // Medium elevation for dropdowns and tooltips
  md: `
    0 4px 6px -2px ${shadowColors.light.umbra},
    0 10px 15px -3px ${shadowColors.light.penumbra}
  `,
  
  // High elevation for modals and popovers
  lg: `
    0 10px 15px -3px ${shadowColors.light.umbra},
    0 20px 25px -5px ${shadowColors.light.penumbra}
  `,
  
  // Maximum elevation for notifications
  xl: `
    0 20px 25px -5px ${shadowColors.light.umbra},
    0 25px 50px -12px ${shadowColors.light.penumbra}
  `,
  
  // Extra large for special emphasis
  '2xl': `
    0 25px 50px -12px ${shadowColors.light.umbra},
    0 50px 100px -20px ${shadowColors.light.ambient}
  `,
  
  // Inner shadows for pressed states
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  
  // Focus ring shadows
  focus: {
    primary: '0 0 0 3px rgba(59, 130, 246, 0.5)',
    accent: '0 0 0 3px rgba(139, 92, 246, 0.5)',
    error: '0 0 0 3px rgba(239, 68, 68, 0.5)',
    success: '0 0 0 3px rgba(34, 197, 94, 0.5)',
  },
  
  // Colored glows for special effects
  glow: {
    primary: '0 0 20px rgba(59, 130, 246, 0.35)',
    accent: '0 0 20px rgba(139, 92, 246, 0.35)',
    success: '0 0 20px rgba(34, 197, 94, 0.35)',
    warning: '0 0 20px rgba(245, 158, 11, 0.35)',
    error: '0 0 20px rgba(239, 68, 68, 0.35)',
  },
} as const;

// Dark mode shadows
export const shadowsDark = {
  none: 'none',
  
  sm: `
    0 1px 2px 0 ${shadowColors.dark.umbra},
    0 1px 3px 0 ${shadowColors.dark.penumbra}
  `,
  
  base: `
    0 2px 4px -1px ${shadowColors.dark.umbra},
    0 4px 6px -1px ${shadowColors.dark.penumbra}
  `,
  
  md: `
    0 4px 6px -2px ${shadowColors.dark.umbra},
    0 10px 15px -3px ${shadowColors.dark.penumbra}
  `,
  
  lg: `
    0 10px 15px -3px ${shadowColors.dark.umbra},
    0 20px 25px -5px ${shadowColors.dark.penumbra}
  `,
  
  xl: `
    0 20px 25px -5px ${shadowColors.dark.umbra},
    0 25px 50px -12px ${shadowColors.dark.penumbra}
  `,
  
  '2xl': `
    0 25px 50px -12px ${shadowColors.dark.umbra},
    0 50px 100px -20px ${shadowColors.dark.ambient}
  `,
  
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.12)',
  
  // Focus rings are the same in dark mode
  focus: shadows.focus,
  
  // Glows are slightly stronger in dark mode
  glow: {
    primary: '0 0 30px rgba(59, 130, 246, 0.5)',
    accent: '0 0 30px rgba(139, 92, 246, 0.5)',
    success: '0 0 30px rgba(34, 197, 94, 0.5)',
    warning: '0 0 30px rgba(245, 158, 11, 0.5)',
    error: '0 0 30px rgba(239, 68, 68, 0.5)',
  },
} as const;

// Interactive state shadows
export const interactiveShadows = {
  // Button states
  button: {
    rest: shadows.sm,
    hover: shadows.base,
    active: shadows.inner,
    disabled: 'none',
  },
  
  // Card states
  card: {
    rest: shadows.sm,
    hover: shadows.md,
    active: shadows.base,
  },
  
  // Input states
  input: {
    rest: 'none',
    focus: shadows.focus.primary,
    error: shadows.focus.error,
    success: shadows.focus.success,
  },
  
  // Dropdown and popover
  dropdown: shadows.lg,
  popover: shadows.lg,
  tooltip: shadows.md,
  
  // Modal and dialog
  modal: shadows.xl,
  dialog: shadows.xl,
  
  // Navigation
  navbar: shadows.base,
  sidebar: shadows.base,
} as const;

// CSS custom properties for shadows
export const shadowVars = {
  // Light mode shadows
  '--shadow-sm': shadows.sm,
  '--shadow-base': shadows.base,
  '--shadow-md': shadows.md,
  '--shadow-lg': shadows.lg,
  '--shadow-xl': shadows.xl,
  '--shadow-2xl': shadows['2xl'],
  '--shadow-inner': shadows.inner,
  
  // Focus shadows
  '--shadow-focus-primary': shadows.focus.primary,
  '--shadow-focus-accent': shadows.focus.accent,
  '--shadow-focus-error': shadows.focus.error,
  '--shadow-focus-success': shadows.focus.success,
  
  // Glow effects
  '--shadow-glow-primary': shadows.glow.primary,
  '--shadow-glow-accent': shadows.glow.accent,
  '--shadow-glow-success': shadows.glow.success,
  '--shadow-glow-warning': shadows.glow.warning,
  '--shadow-glow-error': shadows.glow.error,
  
  // Interactive shadows
  '--shadow-button-rest': interactiveShadows.button.rest,
  '--shadow-button-hover': interactiveShadows.button.hover,
  '--shadow-button-active': interactiveShadows.button.active,
  '--shadow-card-rest': interactiveShadows.card.rest,
  '--shadow-card-hover': interactiveShadows.card.hover,
  '--shadow-dropdown': interactiveShadows.dropdown,
  '--shadow-modal': interactiveShadows.modal,
};

// Utility function to get appropriate shadow for theme
export function getShadow(
  elevation: keyof typeof shadows,
  theme: 'light' | 'dark' = 'light'
): string {
  const shadowSet = theme === 'light' ? shadows : shadowsDark;
  return shadowSet[elevation] as string;
}

// Create elevation classes
export function createElevationClasses() {
  const elevations = ['sm', 'base', 'md', 'lg', 'xl', '2xl'] as const;
  const classes: Record<string, any> = {};
  
  elevations.forEach(elevation => {
    classes[`.elevation-${elevation}`] = {
      boxShadow: `var(--shadow-${elevation})`,
      transition: 'box-shadow 200ms ease-out',
    };
  });
  
  return classes;
}

// Type definitions
export type ShadowElevation = keyof typeof shadows;
export type FocusShadow = keyof typeof shadows.focus;
export type GlowShadow = keyof typeof shadows.glow;
export type InteractiveShadow = keyof typeof interactiveShadows;