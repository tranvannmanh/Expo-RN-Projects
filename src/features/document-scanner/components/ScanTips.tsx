import { StyleSheet } from 'react-native';
import type { AndroidSymbol, SFSymbol } from 'expo-symbols';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { MAX_PAGE_LIMIT } from '@modules/document-scanner';

import { ICON_SIZE } from '../constants';

const TIPS: { ios: SFSymbol; android: AndroidSymbol; text: string }[] = [
  { ios: 'viewfinder', android: 'crop_free', text: 'Edges are detected and captured automatically.' },
  { ios: 'doc.on.doc', android: 'library_books', text: `Scan up to ${MAX_PAGE_LIMIT} pages in one session.` },
  { ios: 'photo.on.rectangle', android: 'photo_library', text: 'Import existing photos from your gallery.' },
  { ios: 'slider.horizontal.3', android: 'tune', text: 'Crop, rotate and apply filters before saving.' },
];

export function ScanTips() {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {TIPS.map((tip) => (
        <ThemedView key={tip.text} type="backgroundElement" style={styles.row}>
          <AppIcon ios={tip.ios} android={tip.android} size={ICON_SIZE.medium} color="primary" />
          <ThemedText type="small" style={styles.text}>
            {tip.text}
          </ThemedText>
        </ThemedView>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  text: {
    flex: 1,
  },
});
