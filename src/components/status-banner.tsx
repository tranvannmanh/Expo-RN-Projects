import { StyleSheet } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { AppError } from '@/shared/errors/appError';
import { useT } from '@/shared/i18n';

const ICON_SIZE = 24;

type StatusBannerProps =
  | { variant: 'cancelled' }
  | { variant: 'success'; message: string }
  | { variant: 'info'; message: string }
  | { variant: 'error'; error: AppError };

export function StatusBanner(props: StatusBannerProps) {
  const t = useT();
  const isError = props.variant === 'error';
  const surface = isError ? 'dangerSurface' : 'backgroundElement';

  const message =
    props.variant === 'error'
      ? t.errors[props.error.code]
      : props.variant === 'cancelled'
        ? t.errors.SCAN_CANCELLED
        : props.message;

  return (
    <ThemedView
      type={surface}
      style={styles.container}
      accessibilityRole={isError ? 'alert' : 'text'}
      accessibilityLiveRegion="polite">
      <AppIcon
        ios={isError ? 'exclamationmark.triangle' : props.variant === 'success' ? 'checkmark.circle' : 'info.circle'}
        android={isError ? 'error' : props.variant === 'success' ? 'check_circle' : 'info'}
        size={ICON_SIZE}
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
