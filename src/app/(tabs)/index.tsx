import { useRouter } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedThemedButton } from '@/components/animated-themed-button';
import { AppIcon } from '@/components/app-icon';
import { ThemedPressable } from '@/components/themed-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { DocumentListItem } from '@/features/document-scanner/components/DocumentListItem';
import { EmptyScanState } from '@/features/document-scanner/components/EmptyScanState';
import { StatusBanner } from '@/components/status-banner';
import { ICON_SIZE } from '@/features/document-scanner/constants';
import { useDeleteDocument } from '@/features/document-scanner/hooks/useDeleteDocument';
import { useDocuments } from '@/features/document-scanner/hooks/useDocuments';
import type { DocumentSummary } from '@/features/document-scanner/types/document';
import { toDocumentError } from '@/features/document-scanner/types/errors';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/shared/i18n';

const SCREEN_PADDING = Spacing.four;

export default function DocumentListScreen() {
  const theme = useTheme();
  const t = useT();
  const documents = useDocuments();
  const router = useRouter();
  const remove = useDeleteDocument();
  const error = remove.error ?? documents.error;

  const confirmDelete = (document: DocumentSummary) =>
    Alert.alert(t.documents.deleteTitle, t.documents.deleteMessage(document.name), [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.common.delete, style: 'destructive', onPress: () => remove.mutate(document.id) },
    ]);

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemedView style={styles.titleRow}>
            <ThemedText type="subtitle" numberOfLines={1} style={styles.title}>
              {t.documents.title}
            </ThemedText>
            <ThemedPressable
              type="backgroundElement"
              pressedType="backgroundSelected"
              accessibilityRole="button"
              accessibilityLabel={t.documents.openPdfTools}
              onPress={() => router.push('/pdf-tools')}
              style={styles.toolsButton}>
              <AppIcon ios="wrench.and.screwdriver" android="handyman" size={ICON_SIZE.small} color="primary" />
              <ThemedText type="smallBold" themeColor="primary">
                {t.nav.pdfTools}
              </ThemedText>
            </ThemedPressable>
          </ThemedView>
          <ThemedText type="small" themeColor="textSecondary">
            {t.documents.subtitle}
          </ThemedText>
        </ThemedView>

        <FlatList
          data={documents.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              {error && <StatusBanner variant="error" error={toDocumentError(error)} />}
            </>
          }
          ListEmptyComponent={
            documents.isPending ? <ActivityIndicator color={theme.text} /> : <EmptyScanState />
          }
          renderItem={({ item }) => (
            <DocumentListItem
              document={item}
              disabled={remove.isPending}
              onPress={() => router.push({ pathname: '/documents/[id]', params: { id: item.id } })}
              onDelete={() => confirmDelete(item)}
            />
          )}
        />

        <ThemedView style={styles.footer}>
          <AnimatedThemedButton
            type="primary"
            pressedType="primaryPressed"
            accessibilityLabel={t.documents.scanDocument}
            onPress={() => router.push('/scan')}
            style={styles.scanButton}>
            <AppIcon
              ios="doc.viewfinder"
              android="document_scanner"
              size={ICON_SIZE.medium}
              color="onPrimary"
            />
            <ThemedText type="smallBold" themeColor="onPrimary">
              {t.documents.scanDocument}
            </ThemedText>
          </AnimatedThemedButton>
        </ThemedView>
      </SafeAreaView>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  header: {
    gap: Spacing.one,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
  },
  toolsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
  },
  list: {
    gap: Spacing.two,
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: Spacing.four,
  },
  footer: {
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: Spacing.three,
  },
  scanButton: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
});
