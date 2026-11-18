import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedStackHeader } from '@/components/themed-stack-header';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export const SCREEN_PADDING = Spacing.four;

type ScreenLayoutProps = {
  children: ReactNode;
  /** Header title; omit to keep the one from the root layout. */
  title?: string;
  /** Pinned below the scroll area (primary actions). */
  footer?: ReactNode;
};

/**
 * Scrollable content + optional pinned footer, centred and width-capped on tablets.
 * Also keeps the native header in sync with the light/dark theme.
 */
export function ScreenLayout({ children, footer, title }: ScreenLayoutProps) {
  return (
    <ThemedView style={styles.root}>
      <ThemedStackHeader title={title} />
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        {footer && <ThemedView style={styles.footer}>{footer}</ThemedView>}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  content: {
    gap: Spacing.three,
    padding: SCREEN_PADDING,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: Spacing.three,
  },
});
