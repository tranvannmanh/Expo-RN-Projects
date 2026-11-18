import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

import type { WatermarkOptions } from '@modules/pdf-tools';

import { PdfThumbnail } from './PdfThumbnail';
import { useT } from '@/shared/i18n';

/** Preview width (dp) and the PDF page width it represents (A4 = 595 pt). */
const PREVIEW_WIDTH = 180;
const PAGE_WIDTH_PT = 595;
const SCALE = PREVIEW_WIDTH / PAGE_WIDTH_PT;
/** Matches the native renderer: diagonal follows the A4 diagonal, tiles use 30°. */
const DIAGONAL_DEGREES = 54.7;
const TILE_DEGREES = 30;
const TILE_ROWS = [0, 1, 2, 3, 4, 5];

type WatermarkPreviewProps = { thumbnailPath: string | null; options: WatermarkOptions };

/**
 * Approximation of the native watermark on the first page, so users can judge size, angle,
 * colour and opacity before writing a new PDF.
 */
export function WatermarkPreview({ thumbnailPath, options }: WatermarkPreviewProps) {
  const t = useT();
  const text = options.text.trim() || t.pdfTools.watermark.placeholderText;
  const textStyle = {
    color: options.color,
    opacity: options.opacity,
    fontSize: Math.max(options.fontSize * SCALE, 6),
    lineHeight: Math.max(options.fontSize * SCALE, 6) * 1.2,
  };

  return (
    <View style={styles.wrapper} accessibilityLabel={t.pdfTools.watermark.previewA11y}>
      <PdfThumbnail path={thumbnailPath} width={PREVIEW_WIDTH} />
      <View style={styles.overlay} pointerEvents="none">
        {options.position === 'tiled' ? (
          <View style={[styles.tiles, { transform: [{ rotate: `-${TILE_DEGREES}deg` }] }]}>
            {TILE_ROWS.map((row) => (
              <ThemedText key={row} numberOfLines={1} style={[styles.text, textStyle]}>
                {`${text}   ${text}   ${text}`}
              </ThemedText>
            ))}
          </View>
        ) : (
          <ThemedText
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[
              styles.text,
              textStyle,
              options.position === 'bottom'
                ? styles.bottom
                : { transform: [{ rotate: `-${DIAGONAL_DEGREES}deg` }] },
            ]}>
            {text}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: Spacing.one,
  },
  tiles: {
    gap: Spacing.three,
    alignItems: 'center',
  },
  text: {
    fontWeight: 400,
    textAlign: 'center',
    maxWidth: PREVIEW_WIDTH * 1.1,
  },
  bottom: {
    position: 'absolute',
    bottom: Spacing.two,
    maxWidth: PREVIEW_WIDTH - Spacing.three,
  },
});
