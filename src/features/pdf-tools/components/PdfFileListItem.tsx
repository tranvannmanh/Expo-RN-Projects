import { StyleSheet } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedPressable } from '@/components/themed-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { ICON, LIST_THUMB_WIDTH } from '../constants';
import type { PdfFile } from '../types/pdfFile';
import { formatBytes } from '../utils/formatBytes';
import { PdfThumbnail } from './PdfThumbnail';
import { type Messages, useT } from '@/shared/i18n';

type PdfFileListItemProps = {
  file: PdfFile;
  disabled?: boolean;
  onPress: () => void;
  onDelete: () => void;
};

export function pdfFileSummary(file: PdfFile, t: Messages): string {
  return t.pdfTools.summary(file.pageCount, formatBytes(file.sizeBytes));
}

export function PdfFileListItem({ file, disabled, onPress, onDelete }: PdfFileListItemProps) {
  const t = useT();
  return (
    <ThemedPressable
      type="backgroundElement"
      pressedType="backgroundSelected"
      accessibilityRole="button"
      accessibilityLabel={`${file.name}, ${pdfFileSummary(file, t)}`}
      disabled={disabled}
      onPress={onPress}
      style={styles.row}>
      <PdfThumbnail path={file.thumbnailPath} width={LIST_THUMB_WIDTH} />
      <ThemedView type="backgroundElement" style={styles.body}>
        <ThemedText type="smallBold" numberOfLines={2}>
          {file.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {pdfFileSummary(file, t)}
        </ThemedText>
        <ThemedView type="backgroundSelected" style={styles.badge}>
          <ThemedText type="small">{t.pdfTools.source[file.source]}</ThemedText>
        </ThemedView>
      </ThemedView>
      <ThemedPressable
        type="backgroundElement"
        pressedType="dangerSurface"
        accessibilityRole="button"
        accessibilityLabel={t.documents.deleteItem(file.name)}
        hitSlop={Spacing.two}
        disabled={disabled}
        onPress={onDelete}
        style={styles.deleteButton}>
        <AppIcon ios="trash" android="delete" size={ICON.medium} color="danger" />
      </ThemedPressable>
    </ThemedPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: Spacing.three,
  },
  body: {
    flex: 1,
    gap: Spacing.one,
    alignItems: 'flex-start',
  },
  deleteButton: {
    padding: Spacing.two,
    borderRadius: Spacing.four,
  },
  badge: {
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
  },
});
