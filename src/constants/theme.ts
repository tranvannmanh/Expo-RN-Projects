/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * Palette taken from the launcher icon (assets/launcher.icon): cream #F2EFE8, ink #14171F and
 * orange #FF6A3D. In light mode the orange is deepened to #C4441B so buttons (white text 5.0:1)
 * and links on cream (4.4:1) stay readable; dark mode uses the icon orange with ink text (6.3:1).
 * `danger` is a crimson (hue ≈340°) kept well away from the orange primary (≈15°) so
 * destructive actions never look like ordinary links.
 */
export const Colors = {
  light: {
    text: '#14171F',
    background: '#F2EFE8',
    backgroundElement: '#E7E2D8',
    backgroundSelected: '#DAD4C8',
    textSecondary: '#5C6170',
    primary: '#C4441B',
    primaryPressed: '#A63815',
    onPrimary: '#FFFFFF',
    danger: '#B3164B',
    dangerSurface: '#FBE3EA',
    scrim: '#000000',
    onScrim: '#ffffff',
  },
  dark: {
    text: '#F2EFE8',
    background: '#14171F',
    backgroundElement: '#20242E',
    backgroundSelected: '#2C313C',
    textSecondary: '#A9ACB4',
    primary: '#FF6A3D',
    primaryPressed: '#E5582D',
    onPrimary: '#14171F',
    danger: '#FF7FA3',
    dangerSurface: '#3D1A26',
    scrim: '#000000',
    onScrim: '#ffffff',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * App typeface: Google Sans (SIL OFL 1.1, assets/fonts; official Android static build v14.000,
 * unmodified). Covers the full Vietnamese alphabet. Embedded at build time by the expo-font
 * config plugin (app.json), so it works offline.
 * Available weights: 400 / 500 / 700 — use only these (there is no 600).
 * Trademark terms (assets/fonts/GoogleSans-TRADEMARKS.md): never use "Google" in the app name
 * or imply affiliation with Google.
 */
export const APP_FONT_FAMILY = Platform.select({
  ios: 'Google Sans',
  android: 'GoogleSans',
  default: 'Google Sans',
});

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
