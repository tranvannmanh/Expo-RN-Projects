/**
 * Monochrome palette. Neutral greys keep the UI out of the way so photo colours are judged
 * accurately; the only hues are the error red and the R/G/B curve channels.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Palette = {
  black: '#0B0B0C',
  ink: '#141416',
  graphite: '#1E1E21',
  graphiteHigh: '#2A2A2E',
  line: '#3A3A3F',
  grey: '#8C8C92',
  greyLight: '#C6C6CB',
  silver: '#E4E4E7',
  snow: '#F2F2F3',
  white: '#FFFFFF',
  /** Launcher icon background; used only for the splash. */
  brand: '#00A2A2',
  red: '#C8423F',
  redLight: '#E5605C',
} as const;

export const Colors = {
  light: {
    text: Palette.ink,
    background: Palette.white,
    backgroundElement: Palette.snow,
    backgroundSelected: Palette.silver,
    textSecondary: Palette.grey,
    accent: Palette.ink,
    accentText: Palette.white,
    border: Palette.silver,
    danger: Palette.red,
  },
  dark: {
    text: Palette.snow,
    background: Palette.black,
    backgroundElement: Palette.graphite,
    backgroundSelected: Palette.graphiteHigh,
    textSecondary: Palette.grey,
    accent: Palette.white,
    accentText: Palette.black,
    border: Palette.line,
    danger: Palette.redLight,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Motion = {
  /** Duration (ms) for theme color transitions */
  colorDuration: 250,
  /** Opacity applied to touchables while pressed */
  pressedOpacity: 0.7,
  /** Opacity applied to disabled controls */
  disabledOpacity: 0.5,
  /** Scale applied to animated buttons while pressed */
  pressedScale: 0.96,
  spring: {
    damping: 15,
    stiffness: 300,
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/** Photo editor is always dark so colours are judged against a neutral surround. */
export const EditorColors = {
  background: Palette.black,
  surface: Palette.ink,
  surfaceHigh: Palette.graphiteHigh,
  border: Palette.line,
  text: Palette.greyLight,
  textMuted: Palette.grey,
  accent: Palette.white,
  accentText: Palette.black,
  danger: Palette.redLight,
  overlay: 'rgba(11, 11, 12, 0.65)',
  cardLabel: 'rgba(11, 11, 12, 0.72)',
  grid: 'rgba(255, 255, 255, 0.35)',
  gridFaint: 'rgba(255, 255, 255, 0.12)',
  curveRgb: Palette.white,
  curveR: '#E5605C',
  curveG: '#5FBF7A',
  curveB: '#5F9FE5',
} as const;

export const Radius = {
  small: 6,
  medium: 10,
  large: 16,
  pill: 999,
} as const;
