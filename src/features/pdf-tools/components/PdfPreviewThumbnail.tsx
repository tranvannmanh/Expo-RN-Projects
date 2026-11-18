import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedPressable } from '@/components/themed-pressable';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { BADGE_OPACITY, ICON } from '../constants';
import type { PdfFile } from '../types/pdfFile';
import { PdfThumbnail } from './PdfThumbnail';
import { useT } from '@/shared/i18n';

type PdfPreviewThumbnailProps = { file: PdfFile; width: number };

/**
 * First-page thumbnail that opens the continuous (vertical) viewer. Pages are rendered only
 * when they approach the screen, so even PDFs with hundreds of pages open instantly.
 */
export function PdfPreviewThumbnail({ file, width }: PdfPreviewThumbnailProps) {
  const t = useT();
  const router = useRouter();

  return (
    <View>
      <ThemedPressable
        type="backgroundElement"
        pressedType="backgroundSelected"
        accessibilityRole="imagebutton"
        accessibilityLabel={t.pdfTools.previewAll(file.pageCount)}
        onPress={() => router.push({ pathname: '/pdf-tools/viewer', params: { id: file.id } })}
        style={styles.frame}>
        <PdfThumbnail path={file.thumbnailPath} width={width} />
        <ThemedView type="scrim" style={styles.badge}>
          <AppIcon
            ios="arrow.up.left.and.arrow.down.right"
            android="open_in_full"
            size={ICON.small}
            color="onScrim"
          />
        </ThemedView>
      </ThemedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: Spacing.one,
  },
  badge: {
    position: 'absolute',
    right: Spacing.one,
    bottom: Spacing.one,
    padding: Spacing.one,
    borderRadius: Spacing.three,
    opacity: BADGE_OPACITY,
  },
});
