/**
 * Quest Design System - Animation Tokens
 * 
 * Motion design system for meaningful animations that enhance
 * user experience without being distracting.
 */

// Duration scale in milliseconds
export const durations = {
  instant: 0,
  fast: 150,
  normal: 200,
  moderate: 300,
  slow: 400,
  slower: 600,
  slowest: 1000,
} as const;

// CSS duration values
export const duration = {
  instant: '0ms',
  fast: '150ms',
  normal: '200ms',
  moderate: '300ms',
  slow: '400ms',
  slower: '600ms',
  slowest: '1000ms',
} as const;

// Easing curves - cubic-bezier values
export const easings = {
  // Standard easings
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  
  // Custom Quest easings
  questEnter: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',  // Smooth entrance
  questExit: 'cubic-bezier(0.55, 0.06, 0.68, 0.19)',   // Quick exit
  questEmphasized: 'cubic-bezier(0.2, 0, 0, 1)',       // Material emphasized
  questStandard: 'cubic-bezier(0.4, 0, 0.2, 1)',       // Material standard
  
  // Bounce and spring effects
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  
  // Sharp movements
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  
  // Anticipation (overshoot then settle)
  anticipate: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
} as const;

// Predefined animation combinations
export const animations = {
  // Micro-interactions (hover, focus, active states)
  micro: {
    duration: duration.fast,
    easing: easings.questStandard,
  },
  
  // UI transitions (tabs, accordions, toggles)
  transition: {
    duration: duration.normal,
    easing: easings.questStandard,
  },
  
  // Page transitions
  page: {
    duration: duration.moderate,
    easing: easings.questEmphasized,
  },
  
  // Modal and overlay animations
  modal: {
    duration: duration.moderate,
    easing: easings.questEnter,
  },
  
  // Toast and notification animations
  notification: {
    duration: duration.slow,
    easing: easings.spring,
  },
  
  // Loading and skeleton animations
  loading: {
    duration: duration.slower,
    easing: easings.easeInOut,
  },
  
  // 3D graph animations
  graph: {
    duration: duration.slow,
    easing: easings.questEmphasized,
  },
} as const;

// Keyframe animations
export const keyframes = {
  // Fade animations
  fadeIn: {
    '0%': { opacity: 0 },
    '100%': { opacity: 1 },
  },
  
  fadeOut: {
    '0%': { opacity: 1 },
    '100%': { opacity: 0 },
  },
  
  fadeInUp: {
    '0%': { opacity: 0, transform: 'translateY(10px)' },
    '100%': { opacity: 1, transform: 'translateY(0)' },
  },
  
  fadeInDown: {
    '0%': { opacity: 0, transform: 'translateY(-10px)' },
    '100%': { opacity: 1, transform: 'translateY(0)' },
  },
  
  // Scale animations
  scaleIn: {
    '0%': { opacity: 0, transform: 'scale(0.95)' },
    '100%': { opacity: 1, transform: 'scale(1)' },
  },
  
  scaleOut: {
    '0%': { opacity: 1, transform: 'scale(1)' },
    '100%': { opacity: 0, transform: 'scale(0.95)' },
  },
  
  // Slide animations
  slideInLeft: {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(0)' },
  },
  
  slideInRight: {
    '0%': { transform: 'translateX(100%)' },
    '100%': { transform: 'translateX(0)' },
  },
  
  slideOutLeft: {
    '0%': { transform: 'translateX(0)' },
    '100%': { transform: 'translateX(-100%)' },
  },
  
  slideOutRight: {
    '0%': { transform: 'translateX(0)' },
    '100%': { transform: 'translateX(100%)' },
  },
  
  // Rotation animations
  spin: {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
  
  // Pulse animation for loading states
  pulse: {
    '0%': { opacity: 1 },
    '50%': { opacity: 0.5 },
    '100%': { opacity: 1 },
  },
  
  // Shimmer effect for skeletons
  shimmer: {
    '0%': { backgroundPosition: '-468px 0' },
    '100%': { backgroundPosition: '468px 0' },
  },
  
  // Bounce animation
  bounce: {
    '0%, 100%': { 
      transform: 'translateY(-25%)',
      animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
    },
    '50%': {
      transform: 'translateY(0)',
      animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
    },
  },
  
  // Shake animation for errors
  shake: {
    '0%, 100%': { transform: 'translateX(0)' },
    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-10px)' },
    '20%, 40%, 60%, 80%': { transform: 'translateX(10px)' },
  },
  
  // Wiggle animation for attention
  wiggle: {
    '0%, 100%': { transform: 'rotate(-3deg)' },
    '50%': { transform: 'rotate(3deg)' },
  },
  
  // Breathing animation for emphasis
  breathe: {
    '0%, 100%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.05)' },
  },
} as const;

// Component-specific animations
export const componentAnimations = {
  // Button animations
  button: {
    hover: {
      transform: 'translateY(-1px)',
      boxShadow: 'var(--shadow-button-hover)',
      transition: `all ${duration.fast} ${easings.questStandard}`,
    },
    active: {
      transform: 'translateY(0)',
      transition: `all ${duration.fast} ${easings.sharp}`,
    },
  },
  
  // Card animations
  card: {
    hover: {
      transform: 'translateY(-2px)',
      boxShadow: 'var(--shadow-card-hover)',
      transition: `all ${duration.normal} ${easings.questStandard}`,
    },
  },
  
  // Input animations
  input: {
    focus: {
      borderColor: 'var(--color-primary)',
      boxShadow: 'var(--shadow-focus-primary)',
      transition: `all ${duration.fast} ${easings.questStandard}`,
    },
  },
  
  // Modal animations
  modal: {
    backdrop: {
      animation: `fadeIn ${duration.moderate} ${easings.questEnter}`,
    },
    content: {
      animation: `scaleIn ${duration.moderate} ${easings.questEnter}`,
    },
  },
  
  // Dropdown animations
  dropdown: {
    enter: {
      animation: `fadeInDown ${duration.normal} ${easings.questEnter}`,
    },
    exit: {
      animation: `fadeOut ${duration.fast} ${easings.questExit}`,
    },
  },
  
  // Toast animations
  toast: {
    enter: {
      animation: `slideInRight ${duration.moderate} ${easings.spring}`,
    },
    exit: {
      animation: `slideOutRight ${duration.normal} ${easings.questExit}`,
    },
  },
  
  // Loading animations
  spinner: {
    animation: `spin ${duration.slower} ${easings.linear} infinite`,
  },
  
  skeleton: {
    animation: `pulse ${duration.slower} ${easings.easeInOut} infinite`,
  },
  
  shimmer: {
    animation: `shimmer ${duration.slower} ${easings.easeInOut} infinite`,
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
    backgroundSize: '468px 100%',
  },
} as const;

// CSS custom properties for animations
export const animationVars = {
  // Durations
  '--duration-instant': duration.instant,
  '--duration-fast': duration.fast,
  '--duration-normal': duration.normal,
  '--duration-moderate': duration.moderate,
  '--duration-slow': duration.slow,
  '--duration-slower': duration.slower,
  '--duration-slowest': duration.slowest,
  
  // Easings
  '--easing-linear': easings.linear,
  '--easing-ease': easings.ease,
  '--easing-ease-in': easings.easeIn,
  '--easing-ease-out': easings.easeOut,
  '--easing-ease-in-out': easings.easeInOut,
  '--easing-quest-enter': easings.questEnter,
  '--easing-quest-exit': easings.questExit,
  '--easing-quest-emphasized': easings.questEmphasized,
  '--easing-quest-standard': easings.questStandard,
  '--easing-bounce': easings.bounce,
  '--easing-spring': easings.spring,
  '--easing-sharp': easings.sharp,
  '--easing-anticipate': easings.anticipate,
};

// Motion preferences
export const motionPreferences = {
  // Respect user's motion preferences
  respectMotionPreference: `
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
  `,
  
  // High contrast mode adjustments
  highContrast: `
    @media (prefers-contrast: high) {
      * {
        transition-duration: 0ms !important;
      }
    }
  `,
} as const;

// Utility functions
export function createAnimation(
  keyframe: keyof typeof keyframes,
  duration: keyof typeof duration,
  easing: keyof typeof easings,
  iterations: number | 'infinite' = 1
): string {
  return `${keyframe} ${duration} ${easings[easing]} ${iterations}`;
}

export function createTransition(
  properties: string[],
  duration: keyof typeof duration,
  easing: keyof typeof easings = 'questStandard'
): string {
  return properties
    .map(prop => `${prop} ${duration} ${easings[easing]}`)
    .join(', ');
}

// Type definitions
export type Duration = keyof typeof duration;
export type Easing = keyof typeof easings;
export type Keyframe = keyof typeof keyframes;
export type ComponentAnimation = keyof typeof componentAnimations;