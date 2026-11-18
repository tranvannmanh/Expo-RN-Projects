import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedPressable } from '@/components/themed-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { ICON_SIZE, LIST_COVER_WIDTH, PAGE_ASPECT_RATIO } from '../constants';
import { toFileUri } from '../services/documentFileStorage';
import type { DocumentSummary } from '../types/document';
import { formatDocumentDate } from '../utils/documentName';
import { useT } from '@/shared/i18n';

type DocumentListItemProps = {
  document: DocumentSummary;
  disabled?: boolean;
  onPress: () => void;
  onDelete: () => void;
};

export function DocumentListItem({ document, disabled, onPress, onDelete }: DocumentListItemProps) {
  const t = useT();
  const pages = t.common.pages(document.pageCount);

  return (
    <ThemedPressable
      type="backgroundElement"
      pressedType="backgroundSelected"
      accessibilityRole="button"
      accessibilityLabel={`${document.name}, ${pages}`}
      disabled={disabled}
      onPress={onPress}
      style={styles.row}>
      <ThemedView type="backgroundSelected" style={styles.cover}>
        {document.coverPath && (
          <Image
            source={{ uri: toFileUri(document.coverPath) }}
            style={styles.coverImage}
            contentFit="contain"
          />
        )}
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.body}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {document.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {pages} · {formatDocumentDate(document.createdAt, t.locale)}
        </ThemedText>
        {document.pdfPath && (
          <ThemedView type="backgroundSelected" style={styles.chip}>
            <AppIcon ios="doc.richtext" android="picture_as_pdf" size={ICON_SIZE.small} />
            <ThemedText type="small">PDF</ThemedText>
          </ThemedView>
        )}
      </ThemedView>

      <ThemedPressable
        type="backgroundElement"
        pressedType="dangerSurface"
        accessibilityRole="button"
        accessibilityLabel={t.documents.deleteItem(document.name)}
        hitSlop={Spacing.two}
        disabled={disabled}
        onPress={onDelete}
        style={styles.deleteButton}>
        <AppIcon ios="trash" android="delete" size={ICON_SIZE.medium} color="danger" />
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
  cover: {
    width: LIST_COVER_WIDTH,
    aspectRatio: PAGE_ASPECT_RATIO,
    borderRadius: Spacing.one,
    overflow: 'hidden',
  },
  coverImage: {
    flex: 1,
  },
  body: {
    flex: 1,
    gap: Spacing.one,
    alignItems: 'flex-start',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
  },
  deleteButton: {
    padding: Spacing.two,
    borderRadius: Spacing.four,
  },
});
