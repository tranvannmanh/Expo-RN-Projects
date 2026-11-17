import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { ActionButton } from '@/features/document-scanner/components/ActionButton';
import { DocumentSummaryCard } from '@/features/document-scanner/components/DocumentSummaryCard';
import { PageGrid } from '@/features/document-scanner/components/PageGrid';
import { PagePreviewModal } from '@/features/document-scanner/components/PagePreviewModal';
import { PdfActionsCard } from '@/features/document-scanner/components/PdfActionsCard';
import { RenameDocumentDialog } from '@/features/document-scanner/components/RenameDocumentDialog';
import { StatusBanner } from '@/features/document-scanner/components/StatusBanner';
import { useDocumentDetailScreen } from '@/features/document-scanner/hooks/useDocumentDetailScreen';
import { useTheme } from '@/hooks/use-theme';

const SCREEN_PADDING = Spacing.four;

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const screen = useDocumentDetailScreen(id);
  const { document, reorder, exporter } = screen;

  return (
    <ThemedView style={styles.root}>
      <Stack.Screen options={{ title: document?.name ?? 'Document' }} />
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          {screen.error && <StatusBanner variant="error" error={screen.error} />}
          {screen.addCancelled && <StatusBanner variant="cancelled" />}
          {exporter.notice && <StatusBanner variant="success" message={exporter.notice} />}
          {screen.isLoading && <ActivityIndicator color={theme.text} />}
          {screen.notFound && (
            <ThemedText themeColor="textSecondary">This document no longer exists.</ThemedText>
          )}

          {document && (
            <>
              <DocumentSummaryCard
                document={document}
                disabled={screen.busy || reorder.isReordering}
                onRename={screen.rename.open}
              />
              {!reorder.isReordering && (
                <PdfActionsCard
                  canSaveToDocuments={exporter.canSaveToPublicFolder}
                  busy={exporter.busy}
                  disabled={screen.busy}
                  onShare={exporter.sharePdf}
                  onSaveToDocuments={exporter.savePdfToDocuments}
                  onChooseLocation={exporter.savePdfWithPicker}
                />
              )}
              <ThemedText type="small" themeColor="textSecondary">
                {reorder.isReordering
                  ? 'Use the arrows to move pages, then save the new order.'
                  : 'Tap a page to preview it.'}
              </ThemedText>
              <PageGrid
                pages={screen.pages}
                horizontalInset={SCREEN_PADDING * 2}
                disabled={screen.busy}
                actionsFor={(page, index) =>
                  reorder.isReordering
                    ? {
                        mode: 'reorder',
                        onMoveEarlier: index > 0 ? () => reorder.move(index, -1) : undefined,
                        onMoveLater:
                          index < screen.pages.length - 1 ? () => reorder.move(index, 1) : undefined,
                      }
                    : {
                        mode: 'view',
                        onPress: () => screen.preview.openPreview(index),
                        onDelete: () => screen.actions.confirmDeletePage(page),
                      }
                }
              />
            </>
          )}
        </ScrollView>

        {document && (
          <ThemedView style={styles.toolbar}>
            {reorder.isReordering ? (
              <>
                <ActionButton label="Cancel" icon={{ ios: 'xmark', android: 'close' }} disabled={screen.busy} onPress={reorder.cancel} />
                <ActionButton label="Save order" variant="primary" icon={{ ios: 'checkmark', android: 'check' }} disabled={screen.busy} onPress={screen.actions.saveOrder} />
              </>
            ) : (
              <>
                <ActionButton
                  label="Reorder"
                  icon={{ ios: 'arrow.left.arrow.right', android: 'swap_horiz' }}
                  disabled={screen.busy || screen.savedPages.length < 2}
                  onPress={reorder.start}
                />
                <ActionButton
                  label={screen.isAddingPages ? 'Scanning…' : 'Add pages'}
                  variant="primary"
                  icon={{ ios: 'doc.badge.plus', android: 'add_a_photo' }}
                  disabled={screen.busy}
                  onPress={screen.actions.addPages}
                />
              </>
            )}
          </ThemedView>
        )}
      </SafeAreaView>

      <PagePreviewModal
        pages={screen.savedPages}
        initialIndex={screen.preview.previewIndex}
        onClose={screen.preview.closePreview}
        onSharePage={exporter.sharePage}
        onSavePage={exporter.canSaveToPublicFolder ? exporter.savePage : undefined}
      />
      {document && (
        <RenameDocumentDialog
          visible={screen.rename.visible}
          initialName={document.name}
          saving={screen.rename.saving}
          onCancel={screen.rename.close}
          onSave={screen.rename.save}
        />
      )}
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
  content: {
    gap: Spacing.three,
    padding: SCREEN_PADDING,
  },
  toolbar: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: Spacing.three,
  },
});
