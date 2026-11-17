import { useRouter } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedThemedButton } from '@/components/animated-themed-button';
import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { DocumentListItem } from '@/features/document-scanner/components/DocumentListItem';
import { EmptyScanState } from '@/features/document-scanner/components/EmptyScanState';
import { StatusBanner } from '@/features/document-scanner/components/StatusBanner';
import { ICON_SIZE } from '@/features/document-scanner/constants';
import { useDeleteDocument } from '@/features/document-scanner/hooks/useDeleteDocument';
import { useDocuments } from '@/features/document-scanner/hooks/useDocuments';
import type { DocumentSummary } from '@/features/document-scanner/types/document';
import { toDocumentError } from '@/features/document-scanner/types/errors';
import { useTheme } from '@/hooks/use-theme';

const SCREEN_PADDING = Spacing.four;

export default function DocumentListScreen() {
  const theme = useTheme();
  const documents = useDocuments();
  const router = useRouter();
  const remove = useDeleteDocument();
  const error = remove.error ?? documents.error;

  const confirmDelete = (document: DocumentSummary) =>
    Alert.alert('Delete document?', `“${document.name}” and its files will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(document.id) },
    ]);

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">Documents</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Scanned and stored on this device — fully offline.
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
            accessibilityLabel="Scan document"
            onPress={() => router.push('/scan')}
            style={styles.scanButton}>
            <AppIcon
              ios="doc.viewfinder"
              android="document_scanner"
              size={ICON_SIZE.medium}
              color="onPrimary"
            />
            <ThemedText type="smallBold" themeColor="onPrimary">
              Scan document
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
