import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { toFileUri } from '@/shared/services/appFiles';

import { A4_ASPECT, ICON, TOOL_ICONS } from '../constants';

type PdfThumbnailProps = { path: string | null; width: number };

/** First-page preview, or a PDF icon when the file could not be rendered. */
export function PdfThumbnail({ path, width }: PdfThumbnailProps) {
  return (
    <ThemedView type="backgroundSelected" style={[styles.frame, { width }]}>
      {path ? (
        <Image source={{ uri: toFileUri(path) }} style={styles.image} contentFit="contain" />
      ) : (
        <AppIcon {...TOOL_ICONS.pdf} size={ICON.large} color="textSecondary" />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  frame: {
    aspectRatio: A4_ASPECT,
    borderRadius: Spacing.one,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
