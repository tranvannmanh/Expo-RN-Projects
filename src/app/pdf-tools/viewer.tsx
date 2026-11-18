import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { StatusBanner } from '@/components/status-banner';
import { ThemedView } from '@/components/themed-view';
import { PdfDocumentViewer } from '@/features/pdf-tools/components/PdfDocumentViewer';
import { ViewerActionButton } from '@/features/pdf-tools/components/ViewerActionButton';
import { usePdfFile } from '@/features/pdf-tools/hooks/usePdfFiles';
import {
  useSavePdfToDocuments,
  useSavePdfWithPicker,
  useSharePdf,
} from '@/features/pdf-tools/hooks/usePdfToolMutations';
import { useT } from '@/shared/i18n';
import { canSaveToPublicFolder } from '@/shared/services/fileExport';

export default function PdfViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const file = usePdfFile(id).data;
  const share = useSharePdf();
  const saveToDocuments = useSavePdfToDocuments();
  const saveWithPicker = useSavePdfWithPicker();
  const [notice, setNotice] = useState<string | null>(null);

  // Android 10+: straight into Documents/ScannerApp; older: let the user pick a folder.
  const publicSave = canSaveToPublicFolder();
  const saving = saveToDocuments.isPending || saveWithPicker.isPending;
  const busy = share.isPending || saving;
  const error = share.error ?? saveToDocuments.error ?? saveWithPicker.error;

  const save = () => {
    setNotice(null);
    if (publicSave) {
      saveToDocuments.mutate(id, { onSuccess: (r) => setNotice(t.common.savedTo(r.displayPath)) });
    } else {
      saveWithPicker.mutate(id, {
        onSuccess: (r) => setNotice(r.cancelled ? null : t.common.savedToPicked),
      });
    }
  };

  return (
    <GestureHandlerRootView style={styles.fill}>
      {file ? (
        <PdfDocumentViewer
          file={file}
          onClose={() => router.back()}
          actions={
            <>
              <ViewerActionButton
                label={t.common.share}
                icon={{ ios: 'square.and.arrow.up', android: 'share' }}
                busy={share.isPending}
                disabled={busy}
                onPress={() => {
                  setNotice(null);
                  share.mutate(id);
                }}
              />
              <ViewerActionButton
                label={publicSave ? t.common.save : t.common.saveAs}
                icon={{ ios: 'square.and.arrow.down', android: 'download' }}
                busy={saving}
                disabled={busy}
                onPress={save}
              />
            </>
          }
          banner={
            error ? (
              <StatusBanner variant="error" error={error} />
            ) : (
              notice && <StatusBanner variant="success" message={notice} />
            )
          }
        />
      ) : (
        <ThemedView style={styles.fill} />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
