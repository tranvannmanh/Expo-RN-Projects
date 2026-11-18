import { useRouter } from 'expo-router';
import { ActivityIndicator, Alert, StyleSheet } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { AppIcon } from '@/components/app-icon';
import { ScreenLayout } from '@/components/screen-layout';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { PdfFileListItem } from '@/features/pdf-tools/components/PdfFileListItem';
import { ICON, TOOL_ICONS } from '@/features/pdf-tools/constants';
import { usePdfFiles } from '@/features/pdf-tools/hooks/usePdfFiles';
import { useDeletePdf, useImportPdfs } from '@/features/pdf-tools/hooks/usePdfToolMutations';
import type { PdfFile } from '@/features/pdf-tools/types/pdfFile';
import { toAppError } from '@/shared/errors/appError';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/shared/i18n';

export default function PdfToolsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const t = useT();
  const files = usePdfFiles();
  const importPdfs = useImportPdfs();
  const remove = useDeletePdf();
  const list = files.data ?? [];
  const error = importPdfs.error ?? remove.error ?? files.error;

  const confirmDelete = (file: PdfFile) =>
    Alert.alert(t.pdfTools.deleteTitle, t.pdfTools.deleteMessage(file.name), [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.common.delete, style: 'destructive', onPress: () => remove.mutate(file.id) },
    ]);

  const startImport = () =>
    importPdfs.mutate(undefined, {
      onSuccess: (imported) => {
        if (imported.length === 1)
          router.push({ pathname: '/pdf-tools/[id]', params: { id: imported[0].id } });
      },
    });

  return (
    <ScreenLayout
      footer={
        <>
          <ActionButton
            label={t.pdfTools.merge}
            icon={TOOL_ICONS.merge}
            disabled={list.length < 2 || importPdfs.isPending}
            onPress={() => router.push('/pdf-tools/merge')}
          />
          <ActionButton
            label={importPdfs.isPending ? t.pdfTools.importing : t.pdfTools.import}
            variant="primary"
            icon={TOOL_ICONS.import}
            disabled={importPdfs.isPending}
            onPress={startImport}
          />
        </>
      }>
      {error && <StatusBanner variant="error" error={toAppError(error)} />}
      {importPdfs.data && importPdfs.data.length > 1 && (
        <StatusBanner variant="success" message={t.pdfTools.imported(importPdfs.data.length)} />
      )}

      {files.isPending && <ActivityIndicator color={theme.text} />}

      {!files.isPending && list.length === 0 && (
        <ThemedView type="backgroundElement" style={styles.empty}>
          <AppIcon {...TOOL_ICONS.tools} size={ICON.large * 1.5} color="primary" />
          <ThemedText type="smallBold">{t.pdfTools.emptyTitle}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            {t.pdfTools.emptyBody}
          </ThemedText>
        </ThemedView>
      )}

      {list.map((file) => (
        <PdfFileListItem
          key={file.id}
          file={file}
          disabled={remove.isPending}
          onDelete={() => confirmDelete(file)}
          onPress={() => router.push({ pathname: '/pdf-tools/[id]', params: { id: file.id } })}
        />
      ))}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.four,
  },
  center: {
    textAlign: 'center',
  },
});
