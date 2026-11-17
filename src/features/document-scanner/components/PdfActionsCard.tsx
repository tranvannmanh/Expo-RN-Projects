import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedPressable } from '@/components/themed-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ActionButton } from './ActionButton';

type PdfActionsCardProps = {
  canSaveToDocuments: boolean;
  busy: boolean;
  disabled: boolean;
  onShare: () => void;
  onSaveToDocuments: () => void;
  onChooseLocation: () => void;
};

export function PdfActionsCard(props: PdfActionsCardProps) {
  const theme = useTheme();
  const disabled = props.disabled || props.busy;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedView type="backgroundElement" style={styles.header}>
        <ThemedText type="smallBold">PDF</ThemedText>
        {props.busy && <ActivityIndicator color={theme.primary} />}
      </ThemedView>
      <ThemedText type="small" themeColor="textSecondary">
        {props.canSaveToDocuments
          ? 'Share it, or save a copy to Documents/ScannerApp. Your private copy is kept.'
          : 'Share it, or save a copy to a folder you choose. Your private copy is kept.'}
      </ThemedText>

      <ThemedView type="backgroundElement" style={styles.row}>
        <ActionButton
          label="Share"
          variant="tonal"
          icon={{ ios: 'square.and.arrow.up', android: 'share' }}
          disabled={disabled}
          onPress={props.onShare}
        />
        {props.canSaveToDocuments ? (
          <ActionButton
            label="Save"
            variant="primary"
            icon={{ ios: 'square.and.arrow.down', android: 'download' }}
            disabled={disabled}
            onPress={props.onSaveToDocuments}
          />
        ) : (
          <ActionButton
            label="Save as…"
            variant="primary"
            icon={{ ios: 'folder', android: 'folder_open' }}
            disabled={disabled}
            onPress={props.onChooseLocation}
          />
        )}
      </ThemedView>

      {props.canSaveToDocuments && (
        <ThemedPressable
          type="backgroundElement"
          pressedType="backgroundSelected"
          accessibilityRole="button"
          disabled={disabled}
          onPress={props.onChooseLocation}
          style={styles.link}>
          <ThemedText type="smallBold" themeColor="primary">
            Choose another location…
          </ThemedText>
        </ThemedPressable>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  link: {
    alignSelf: 'center',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
  },
});
