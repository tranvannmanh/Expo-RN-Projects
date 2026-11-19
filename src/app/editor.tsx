import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Spacing } from '@/constants/theme';
import {
  EditorHeader,
  EditorToolbar,
  ExportSheet,
  PhotoCanvas,
  ToolPanel,
  getFilmPreset,
  useCropActions,
  useCurveLut,
  useEditorSharedValues,
  useEditorStore,
  usePhotoImages,
} from '@/features/photo-editor';

export default function EditorScreen() {
  const router = useRouter();
  const photo = useEditorStore((s) => s.photo);
  const tool = useEditorStore((s) => s.tool);
  const filmId = useEditorStore((s) => s.recipe.filmId);
  const curves = useEditorStore((s) => s.recipe.curves);
  const [exportVisible, setExportVisible] = useState(false);

  const images = usePhotoImages(photo);
  const shared = useEditorSharedValues();
  const film = getFilmPreset(filmId);
  const { lut, hasUserCurve } = useCurveLut(film, curves);
  const preview = images.data?.preview;
  const source = { width: preview?.width() ?? 1, height: preview?.height() ?? 1 };
  const cropActions = useCropActions(source, shared.geometry);

  if (!photo) return <Redirect href="/" />;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <EditorHeader
        compare={shared.compare}
        onClose={() => router.back()}
        onExport={() => setExportVisible(true)}
      />

      {images.data && lut ? (
        <>
          <PhotoCanvas
            image={images.data.preview}
            lut={lut}
            film={film}
            hasUserCurve={hasUserCurve}
            cropMode={tool === 'crop'}
            aspect={cropActions.aspect}
            shared={shared}
            onCropCommit={cropActions.commitLive}
          />
          <ToolPanel
            tool={tool}
            thumb={images.data.thumb}
            shared={shared}
            cropActions={cropActions}
          />
        </>
      ) : (
        <View style={styles.placeholder}>
          {images.error ? (
            <ThemedText style={styles.error}>{images.error.message}</ThemedText>
          ) : (
            <ActivityIndicator color={EditorColors.accent} />
          )}
        </View>
      )}

      <EditorToolbar />
      <ExportSheet visible={exportVisible} onClose={() => setExportVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: EditorColors.background,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  error: {
    color: EditorColors.danger,
    textAlign: 'center',
  },
});
