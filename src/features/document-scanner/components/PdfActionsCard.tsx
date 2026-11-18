import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedPressable } from '@/components/themed-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ActionButton } from '@/components/action-button';
import { useT } from '@/shared/i18n';

type PdfActionsCardProps = {
  canSaveToDocuments: boolean;
  busy: boolean;
  disabled: boolean;
  onShare: () => void;
  onSaveToDocuments: () => void;
  onChooseLocation: () => void;
  onOpenInPdfTools: () => void;
};

export function PdfActionsCard(props: PdfActionsCardProps) {
  const theme = useTheme();
  const t = useT();
  const disabled = props.disabled || props.busy;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedView type="backgroundElement" style={styles.header}>
        <ThemedText type="smallBold">{t.documents.pdfCardTitle}</ThemedText>
        {props.busy && <ActivityIndicator color={theme.primary} />}
      </ThemedView>
      <ThemedText type="small" themeColor="textSecondary">
        {props.canSaveToDocuments
          ? t.documents.pdfCardPublic
          : t.documents.pdfCardPicker}
      </ThemedText>

      <ThemedView type="backgroundElement" style={styles.row}>
        <ActionButton
          label={t.common.share}
          variant="tonal"
          icon={{ ios: 'square.and.arrow.up', android: 'share' }}
          disabled={disabled}
          onPress={props.onShare}
        />
        {props.canSaveToDocuments ? (
          <ActionButton
            label={t.common.save}
            variant="primary"
            icon={{ ios: 'square.and.arrow.down', android: 'download' }}
            disabled={disabled}
            onPress={props.onSaveToDocuments}
          />
        ) : (
          <ActionButton
            label={t.common.saveAs}
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
            {t.documents.chooseAnotherLocation}
          </ThemedText>
        </ThemedPressable>
      )}
      <ThemedPressable
        type="backgroundElement"
        pressedType="backgroundSelected"
        accessibilityRole="button"
        disabled={disabled}
        onPress={props.onOpenInPdfTools}
        style={styles.link}>
        <ThemedText type="smallBold" themeColor="primary">
          {t.documents.openInPdfTools}
        </ThemedText>
      </ThemedPressable>
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
