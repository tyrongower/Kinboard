/**
 * Kinboard Design System - Mobile Theme
 * Matches the frontend design system from globals.css
 * Dark theme optimized for mobile devices (phones/tablets)
 */
import { MD3DarkTheme as DefaultTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

const fontConfig = {
  displayLarge: {
    fontFamily: 'System',
    fontSize: 57,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 64,
  },
  displayMedium: {
    fontFamily: 'System',
    fontSize: 45,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 52,
  },
  displaySmall: {
    fontFamily: 'System',
    fontSize: 36,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 44,
  },
  headlineLarge: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 40,
  },
  headlineMedium: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 36,
  },
  headlineSmall: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 32,
  },
  titleLarge: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 28,
  },
  titleMedium: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  titleSmall: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  bodyLarge: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
    lineHeight: 16,
  },
  labelLarge: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelMedium: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  labelSmall: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
};

/**
 * Kinboard Dark Theme (Mobile)
 * Matches frontend globals.css dark theme (default)
 */
export const theme: MD3Theme = {
  ...DefaultTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...DefaultTheme.colors,
    // Brand colors - Kinboard (Dark Theme)
    primary: '#60a5fa', // blue-400 (matches --color-primary in dark theme)
    primaryContainer: '#1e3a8a', // blue-900
    onPrimary: '#ffffff',
    onPrimaryContainer: '#dbeafe', // blue-100

    // Accent/Secondary colors
    secondary: '#34d399', // emerald-400 (matches --color-accent)
    secondaryContainer: '#064e3b', // emerald-900
    onSecondary: '#ffffff',
    onSecondaryContainer: '#d1fae5', // emerald-100

    // Tertiary (for additional accent)
    tertiary: '#22d3ee', // cyan-400
    tertiaryContainer: '#083344', // cyan-900
    onTertiary: '#ffffff',
    onTertiaryContainer: '#cffafe', // cyan-100

    // Status colors
    error: '#f87171', // red-400 (matches --color-error dark)
    onError: '#ffffff',
    errorContainer: '#7f1d1d', // red-900
    onErrorContainer: '#fecaca', // red-200

    // Background colors (dark theme)
    background: '#0f1419', // matches --color-bg dark theme
    onBackground: '#f1f5f9', // matches --color-text dark theme

    // Surface colors
    surface: '#232936', // matches --color-surface dark theme
    onSurface: '#f1f5f9', // matches --color-text dark theme
    surfaceVariant: '#2d3548', // matches --color-surface-hover dark theme
    onSurfaceVariant: '#94a3b8', // matches --color-text-secondary dark theme

    // Other
    outline: '#334155', // slate-700 (matches --color-divider dark)
    outlineVariant: '#475569', // slate-600
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#f1f5f9', // slate-100
    inverseOnSurface: '#0f172a', // slate-900
    inversePrimary: '#3b82f6', // blue-500

    // Elevation colors (surfaces raised above background)
    elevation: {
      level0: 'transparent',
      level1: '#1a1f2e', // matches --color-bg-elevated
      level2: '#232936',
      level3: '#2d3548',
      level4: '#334155',
      level5: '#3e4c5e',
    },

    // Disabled state
    surfaceDisabled: 'rgba(241, 245, 249, 0.12)',
    onSurfaceDisabled: 'rgba(241, 245, 249, 0.38)',
    backdrop: 'rgba(15, 20, 25, 0.7)',
  },
  roundness: 12, // Matches --radius-md (12px)
};

/**
 * Additional Kinboard color constants
 * These match the design system from globals.css
 */
export const colors = {
  // Status colors (extended)
  success: '#22c55e', // green-500 (matches --color-success)
  successMuted: 'rgba(34, 197, 94, 0.15)',
  warning: '#fbbf24', // amber-400 (matches --color-warning)
  warningMuted: 'rgba(251, 191, 36, 0.15)',
  error: '#f87171', // red-400 (matches frontend --color-error dark)
  errorMuted: 'rgba(248, 113, 113, 0.15)',

  // Text colors (Dark theme)
  textPrimary: '#f1f5f9', // slate-100 (matches --color-text dark)
  textSecondary: '#94a3b8', // slate-400 (matches --color-text-secondary dark)
  textMuted: '#64748b', // slate-500 (matches --color-text-muted dark)

  // Border/divider colors
  border: '#334155', // slate-700
  divider: '#334155', // slate-700 (matches --color-divider dark)

  // Additional brand colors
  primaryLight: '#93c5fd', // blue-300
  primaryHover: '#3b82f6', // blue-500
  primaryMuted: 'rgba(96, 165, 250, 0.15)',

  accentLight: '#6ee7b7', // emerald-300
  accentHover: '#10b981', // emerald-500
  accentMuted: 'rgba(52, 211, 153, 0.15)',
};

/**
 * Kinboard spacing/sizing constants
 * Matches design tokens from globals.css
 */
export const spacing = {
  touchTarget: 44, // Minimum touch target (matches --touch-target)
  touchTargetLarge: 56, // Large touch target (matches --touch-target-lg)

  // Standard spacing scale
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

/**
 * Kinboard border radius scale
 * Matches design tokens from globals.css
 */
export const radius = {
  sm: 8, // matches --radius-sm
  md: 12, // matches --radius-md
  lg: 16, // matches --radius-lg
  xl: 20, // matches --radius-xl
  full: 9999, // matches --radius-full
};

/**
 * Shadow styles matching Kinboard design system
 */
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
};
