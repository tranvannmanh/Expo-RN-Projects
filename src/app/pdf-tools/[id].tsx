import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { AppIcon } from '@/components/app-icon';
import { RenameDialog } from '@/components/rename-dialog';
import { ScreenLayout } from '@/components/screen-layout';
import { StatusBanner } from '@/components/status-banner';
import { ThemedPressable } from '@/components/themed-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { pdfFileSummary } from '@/features/pdf-tools/components/PdfFileListItem';
import { PdfPreviewThumbnail } from '@/features/pdf-tools/components/PdfPreviewThumbnail';
import { ToolTile } from '@/features/pdf-tools/components/ToolTile';
import { HEADER_THUMB_WIDTH, ICON, TOOL_ICONS } from '@/features/pdf-tools/constants';
import { usePdfDetailScreen } from '@/features/pdf-tools/hooks/usePdfDetailScreen';
import { MAX_PDF_NAME_LENGTH } from '@/features/pdf-tools/services/pdfTools.service';
import { canSaveToPublicFolder } from '@/shared/services/fileExport';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/shared/i18n';

export default function PdfDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const t = useT();
  const screen = usePdfDetailScreen(id);
  const { file, actions, busy } = screen;
  const publicSave = canSaveToPublicFolder();

  return (
    <ScreenLayout
      title={file?.name ?? t.nav.pdf}
      footer={
        file && (
          <>
            <ActionButton
              label={t.common.share}
              icon={{ ios: 'square.and.arrow.up', android: 'share' }}
              disabled={busy}
              onPress={actions.share}
            />
            <ActionButton
              label={publicSave ? t.common.save : t.common.saveAs}
              variant="primary"
              icon={{ ios: 'square.and.arrow.down', android: 'download' }}
              disabled={busy}
              onPress={publicSave ? actions.save : actions.saveAs}
            />
          </>
        )
      }>
      {screen.error && <StatusBanner variant="error" error={screen.error} />}
      {screen.notice && <StatusBanner variant="success" message={screen.notice} />}
      {screen.isLoading && <ActivityIndicator color={theme.text} />}
      {screen.notFound && (
        <ThemedText themeColor="textSecondary">{t.pdfTools.notFound}</ThemedText>
      )}

      {file && (
        <>
          <ThemedView type="backgroundElement" style={styles.header}>
            <PdfPreviewThumbnail file={file} width={HEADER_THUMB_WIDTH} />
            <ThemedView type="backgroundElement" style={styles.info}>
              <ThemedText type="smallBold" numberOfLines={3}>
                {file.name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {pdfFileSummary(file, t)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t.pdfTools.source[file.source]}
              </ThemedText>
              <ThemedPressable
                type="backgroundElement"
                pressedType="backgroundSelected"
                accessibilityRole="button"
                disabled={busy}
                onPress={screen.rename.open}
                style={styles.link}>
                <AppIcon ios="pencil" android="edit" size={ICON.small} color="primary" />
                <ThemedText type="smallBold" themeColor="primary">
                  {t.common.rename}
                </ThemedText>
              </ThemedPressable>
            </ThemedView>
          </ThemedView>

          <ThemedText type="smallBold">{t.pdfTools.tools}</ThemedText>
          <ThemedView style={styles.grid}>
            <ToolTile
              icon={TOOL_ICONS.compress}
              title={t.pdfTools.tool.compress}
              subtitle={t.pdfTools.tool.compressSub}
              disabled={busy}
              onPress={() => actions.openTool('compress')}
            />
            <ToolTile
              icon={TOOL_ICONS.watermark}
              title={t.pdfTools.tool.watermark}
              subtitle={t.pdfTools.tool.watermarkSub}
              disabled={busy}
              onPress={() => actions.openTool('watermark')}
            />
            <ToolTile
              icon={TOOL_ICONS.split}
              title={t.pdfTools.tool.split}
              subtitle={file.pageCount > 1 ? t.pdfTools.tool.splitSub : t.pdfTools.tool.splitNeedsPages}
              disabled={busy || file.pageCount < 2}
              onPress={() => actions.openTool('split')}
            />
            <ToolTile
              icon={TOOL_ICONS.merge}
              title={t.pdfTools.tool.merge}
              subtitle={t.pdfTools.tool.mergeSub}
              disabled={busy}
              onPress={actions.merge}
            />
          </ThemedView>

          {publicSave && (
            <ThemedPressable
              type="background"
              pressedType="backgroundElement"
              accessibilityRole="button"
              disabled={busy}
              onPress={actions.saveAs}
              style={styles.center}>
              <ThemedText type="smallBold" themeColor="primary">
                {t.pdfTools.saveElsewhere}
              </ThemedText>
            </ThemedPressable>
          )}
          <ThemedPressable
            type="background"
            pressedType="dangerSurface"
            accessibilityRole="button"
            disabled={busy}
            onPress={actions.confirmDelete}
            style={[styles.center, styles.row]}>
            <AppIcon ios="trash" android="delete" size={ICON.small} color="danger" />
            <ThemedText type="smallBold" themeColor="danger">
              {t.pdfTools.deleteFromTools}
            </ThemedText>
          </ThemedPressable>

          <RenameDialog
            title={t.pdfTools.renameTitle}
            maxLength={MAX_PDF_NAME_LENGTH}
            visible={screen.rename.visible}
            initialName={file.name}
            saving={screen.rename.saving}
            onCancel={screen.rename.close}
            onSave={screen.rename.save}
          />
        </>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.four,
  },
  info: {
    flex: 1,
    gap: Spacing.one,
    alignItems: 'flex-start',
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.one,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  center: {
    alignSelf: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
});
