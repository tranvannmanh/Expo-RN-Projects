import { StyleSheet } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { ICON_SIZE } from '../constants';

export function EmptyScanState() {
  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <AppIcon
        ios="doc.viewfinder"
        android="document_scanner"
        size={ICON_SIZE.hero}
        color="primary"
      />
      <ThemedText type="smallBold">No documents yet</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
        Tap “Scan document” to create one. Edges are detected automatically and you can import photos from your gallery.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.four,
  },
  centered: {
    textAlign: 'center',
  },
});
