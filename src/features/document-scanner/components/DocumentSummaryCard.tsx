import { StyleSheet } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedPressable } from '@/components/themed-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { ICON_SIZE } from '../constants';
import type { ScannedDocument } from '../types/document';
import { formatDocumentDate } from '../utils/documentName';
import { useT } from '@/shared/i18n';

type DocumentSummaryCardProps = {
  document: ScannedDocument;
  disabled?: boolean;
  onRename: () => void;
};

export function DocumentSummaryCard({ document, disabled, onRename }: DocumentSummaryCardProps) {
  const t = useT();

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedView type="backgroundElement" style={styles.titleRow}>
        <ThemedText type="smallBold" style={styles.title} numberOfLines={2}>
          {document.name}
        </ThemedText>
        <ThemedPressable
          type="backgroundElement"
          pressedType="backgroundSelected"
          accessibilityRole="button"
          accessibilityLabel={t.documents.renameTitle}
          hitSlop={Spacing.two}
          disabled={disabled}
          onPress={onRename}
          style={styles.iconButton}>
          <AppIcon ios="pencil" android="edit" size={ICON_SIZE.medium} color="primary" />
        </ThemedPressable>
      </ThemedView>

      <ThemedText type="small" themeColor="textSecondary">
        {t.documents.summary(document.pageCount, formatDocumentDate(document.createdAt, t.locale))}
      </ThemedText>

      <ThemedView type="backgroundSelected" style={styles.chip}>
        <AppIcon ios="doc.richtext" android="picture_as_pdf" size={ICON_SIZE.small} />
        <ThemedText type="small">
          {document.pdfPath ? t.documents.pdfReady : t.documents.pdfStale}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.four,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
  },
  iconButton: {
    padding: Spacing.two,
    borderRadius: Spacing.four,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
  },
});
