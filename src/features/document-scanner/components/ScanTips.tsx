import { StyleSheet } from 'react-native';
import type { AndroidSymbol, SFSymbol } from 'expo-symbols';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { MAX_PAGE_LIMIT } from '@modules/document-scanner';

import { ICON_SIZE } from '../constants';
import { useT } from '@/shared/i18n';

const TIPS: { ios: SFSymbol; android: AndroidSymbol; key: 'edges' | 'pages' | 'gallery' | 'edit' }[] = [
  { ios: 'viewfinder', android: 'crop_free', key: 'edges' },
  { ios: 'doc.on.doc', android: 'library_books', key: 'pages' },
  { ios: 'photo.on.rectangle', android: 'photo_library', key: 'gallery' },
  { ios: 'slider.horizontal.3', android: 'tune', key: 'edit' },
];

export function ScanTips() {
  const t = useT();
  const text = (key: (typeof TIPS)[number]['key']) =>
    key === 'pages' ? t.scan.tips.pages(MAX_PAGE_LIMIT) : t.scan.tips[key];
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {TIPS.map((tip) => (
        <ThemedView key={tip.key} type="backgroundElement" style={styles.row}>
          <AppIcon ios={tip.ios} android={tip.android} size={ICON_SIZE.medium} color="primary" />
          <ThemedText type="small" style={styles.text}>
            {text(tip.key)}
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
