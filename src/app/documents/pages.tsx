import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { StatusBanner } from '@/components/status-banner';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { PagePreviewer } from '@/features/document-scanner/components/PagePreviewer';
import { useDocument } from '@/features/document-scanner/hooks/useDocument';
import { useDocumentExport } from '@/features/document-scanner/hooks/useDocumentExport';
import { useDocumentPages } from '@/features/document-scanner/hooks/useDocumentPages';
import { toDocumentError } from '@/features/document-scanner/types/errors';

/** Full-screen page viewer of a scanned document (`?index=` is the 0-based start page). */
export default function DocumentPagesScreen() {
  const { id, index } = useLocalSearchParams<{ id: string; index?: string }>();
  const router = useRouter();
  const document = useDocument(id).data;
  const pages = useDocumentPages(id).data;
  const exporter = useDocumentExport(id, document?.name ?? '');
  const start = Math.min(Math.max(Number(index) || 0, 0), Math.max((pages?.length ?? 1) - 1, 0));

  return (
    <GestureHandlerRootView style={styles.fill}>
      {pages && pages.length > 0 ? (
        <PagePreviewer
          pages={pages}
          initialIndex={start}
          onClose={() => router.back()}
          onSharePage={exporter.sharePage}
          onSavePage={exporter.canSaveToPublicFolder ? exporter.savePage : undefined}
        />
      ) : (
        <ThemedView style={styles.fill} />
      )}
      {(exporter.error || exporter.notice) && (
        <View style={styles.banner} pointerEvents="none">
          {exporter.error ? (
            <StatusBanner variant="error" error={toDocumentError(exporter.error)} />
          ) : (
            exporter.notice && <StatusBanner variant="success" message={exporter.notice} />
          )}
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const BANNER_OFFSET = Spacing.six * 2;

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  banner: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    top: BANNER_OFFSET,
  },
});
