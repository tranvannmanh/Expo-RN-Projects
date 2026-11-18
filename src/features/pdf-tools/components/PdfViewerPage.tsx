import { Image } from 'expo-image';
import { memo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedPressable } from '@/components/themed-pressable';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/shared/i18n';

import { usePdfPageImage } from '../hooks/usePdfPageImage';
import type { PdfFile } from '../types/pdfFile';

type PdfViewerPageProps = {
  file: PdfFile;
  index: number;
  width: number;
  height: number;
  visible: boolean;
  settled: boolean;
  sharpWidth: number;
};

/** One page of the continuous viewer: white sheet, blurry-then-sharp image, retry on failure. */
export const PdfViewerPage = memo(function PdfViewerPage({
  file,
  index,
  width,
  height,
  visible,
  settled,
  sharpWidth,
}: PdfViewerPageProps) {
  const t = useT();
  const theme = useTheme();
  const image = usePdfPageImage(file, index, { visible, settled, sharpWidth });

  return (
    <View
      style={[styles.sheet, { width, height }]}
      accessibilityRole="image"
      accessibilityLabel={t.pages.page(index + 1)}>
      {image.uri ? (
        <Image
          source={{ uri: image.uri }}
          // Keeps the small image on screen while the sharp one decodes: no white flash.
          placeholder={image.lowUri ? { uri: image.lowUri } : undefined}
          placeholderContentFit="fill"
          contentFit="fill"
          transition={0}
          // Pages are local files already; a memory cache would keep off-screen bitmaps alive.
          cachePolicy="none"
          style={StyleSheet.absoluteFill}
        />
      ) : image.failed ? (
        <View style={styles.center}>
          <ThemedText type="small" style={styles.dark}>
            {t.pages.renderFailed(index + 1)}
          </ThemedText>
          <ThemedPressable
            type="backgroundSelected"
            pressedType="backgroundElement"
            accessibilityRole="button"
            onPress={image.retry}
            style={styles.retry}>
            <ThemedText type="smallBold">{t.common.tryAgain}</ThemedText>
          </ThemedPressable>
        </View>
      ) : (
        <View style={styles.center}>
          <ActivityIndicator color={theme.textSecondary} />
        </View>
      )}
    </View>
  );
});

const PAPER = '#FFFFFF';
const INK = '#14171F';

const styles = StyleSheet.create({
  // PDF pages are white paper in both themes.
  sheet: {
    backgroundColor: PAPER,
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  dark: {
    color: INK,
    textAlign: 'center',
  },
  retry: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
