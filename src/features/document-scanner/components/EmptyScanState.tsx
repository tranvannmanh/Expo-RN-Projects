import { StyleSheet } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { ICON_SIZE } from '../constants';
import { useT } from '@/shared/i18n';

export function EmptyScanState() {
  const t = useT();
  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <AppIcon
        ios="doc.viewfinder"
        android="document_scanner"
        size={ICON_SIZE.hero}
        color="primary"
      />
      <ThemedText type="smallBold">{t.documents.emptyTitle}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
        {t.documents.emptyBody}
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
