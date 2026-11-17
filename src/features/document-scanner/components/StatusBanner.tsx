import { StyleSheet } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { ICON_SIZE } from '../constants';
import type { DocumentError } from '../types/errors';
import { documentErrorMessage } from '../utils/documentErrorMessage';

type StatusBannerProps =
  | { variant: 'cancelled' }
  | { variant: 'success'; message: string }
  | { variant: 'error'; error: DocumentError };

export function StatusBanner(props: StatusBannerProps) {
  const isError = props.variant === 'error';
  const surface = isError ? 'dangerSurface' : 'backgroundElement';

  const message =
    props.variant === 'error'
      ? documentErrorMessage(props.error.code)
      : props.variant === 'success'
        ? props.message
        : documentErrorMessage('SCAN_CANCELLED');

  return (
    <ThemedView
      type={surface}
      style={styles.container}
      accessibilityRole={isError ? 'alert' : 'text'}
      accessibilityLiveRegion="polite">
      <AppIcon
        ios={isError ? 'exclamationmark.triangle' : props.variant === 'success' ? 'checkmark.circle' : 'info.circle'}
        android={isError ? 'error' : props.variant === 'success' ? 'check_circle' : 'info'}
        size={ICON_SIZE.medium}
        color={isError ? 'danger' : props.variant === 'success' ? 'primary' : 'textSecondary'}
      />
      <ThemedView type={surface} style={styles.body}>
        <ThemedText type="small" themeColor={isError ? 'danger' : 'text'}>
          {message}
        </ThemedText>
        {isError && (
          <ThemedText type="code" themeColor="textSecondary">
            {props.error.code}
          </ThemedText>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  body: {
    flex: 1,
    gap: Spacing.one,
  },
});
