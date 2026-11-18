import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { ActionButton } from '@/components/action-button';
import { DocumentSummaryCard } from '@/features/document-scanner/components/DocumentSummaryCard';
import { PageGrid } from '@/features/document-scanner/components/PageGrid';
import { PdfActionsCard } from '@/features/document-scanner/components/PdfActionsCard';
import { RenameDialog } from '@/components/rename-dialog';
import { StatusBanner } from '@/components/status-banner';
import { ThemedStackHeader } from '@/components/themed-stack-header';
import { useDocumentDetailScreen } from '@/features/document-scanner/hooks/useDocumentDetailScreen';
import { MAX_NAME_LENGTH } from '@/features/document-scanner/services/document.service';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/shared/i18n';

const SCREEN_PADDING = Spacing.four;

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const t = useT();
  const screen = useDocumentDetailScreen(id);
  const { document, reorder, exporter } = screen;

  return (
    <ThemedView style={styles.root}>
      <ThemedStackHeader title={document?.name ?? t.nav.document} />
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          {screen.error && <StatusBanner variant="error" error={screen.error} />}
          {screen.addCancelled && <StatusBanner variant="cancelled" />}
          {exporter.notice && <StatusBanner variant="success" message={exporter.notice} />}
          {screen.isLoading && <ActivityIndicator color={theme.text} />}
          {screen.notFound && (
            <ThemedText themeColor="textSecondary">{t.documents.notFound}</ThemedText>
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
                  onOpenInPdfTools={() =>
                    exporter.sendToPdfTools((pdfId) =>
                      router.push({ pathname: '/pdf-tools/[id]', params: { id: pdfId } }),
                    )
                  }
                />
              )}
              <ThemedText type="small" themeColor="textSecondary">
                {reorder.isReordering ? t.documents.hintReorder : t.documents.hintPreview}
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
                          index < screen.pages.length - 1
                            ? () => reorder.move(index, 1)
                            : undefined,
                      }
                    : {
                        mode: 'view',
                        onPress: () =>
                          router.push({
                            pathname: '/documents/pages',
                            params: { id, index: String(index) },
                          }),
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
                <ActionButton
                  label={t.common.cancel}
                  icon={{ ios: 'xmark', android: 'close' }}
                  disabled={screen.busy}
                  onPress={reorder.cancel}
                />
                <ActionButton
                  label={t.documents.saveOrder}
                  variant="primary"
                  icon={{ ios: 'checkmark', android: 'check' }}
                  disabled={screen.busy}
                  onPress={screen.actions.saveOrder}
                />
              </>
            ) : (
              <>
                <ActionButton
                  label={t.documents.reorder}
                  icon={{ ios: 'arrow.left.arrow.right', android: 'swap_horiz' }}
                  disabled={screen.busy || screen.savedPages.length < 2}
                  onPress={reorder.start}
                />
                <ActionButton
                  label={screen.isAddingPages ? t.documents.scanning : t.documents.addPages}
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

      {document && (
        <RenameDialog
          title={t.documents.renameTitle}
          maxLength={MAX_NAME_LENGTH}
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
