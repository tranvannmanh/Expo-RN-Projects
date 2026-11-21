import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Spacing } from '@/constants/theme';
import { PhotoGrid, useImportPhotos, useLibraryPhotos } from '@/features/library';
import { EditorLayout, IconButton } from '@/features/photo-editor';

export default function AlbumScreen() {
  const router = useRouter();
  const photos = useLibraryPhotos();
  const importer = useImportPhotos();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <IconButton icon="arrow_back" onPress={() => router.back()} />
        <ThemedText type="smallBold" style={styles.title}>
          {`Album · ${photos.length} ảnh`}
        </ThemedText>
        {importer.isPending ? (
          <ActivityIndicator color={EditorColors.accent} />
        ) : (
          <IconButton icon="add_photo_alternate" onPress={() => importer.mutate()} />
        )}
      </View>

      {importer.error ? (
        <ThemedText type="small" style={styles.error}>
          {importer.error.message}
        </ThemedText>
      ) : null}

      {photos.length ? (
        <PhotoGrid
          photos={photos}
          onPress={(photo) => router.push({ pathname: '/album/[id]', params: { id: photo.id } })}
        />
      ) : (
        <View style={styles.empty}>
          <ThemedText style={styles.emptyText}>
            Chưa có ảnh. Ảnh chụp hoặc lưu từ app sẽ xuất hiện ở đây, hoặc bấm + để nhập ảnh.
          </ThemedText>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: EditorColors.background,
  },
  header: {
    height: EditorLayout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
  },
  title: {
    color: EditorColors.text,
  },
  error: {
    color: EditorColors.danger,
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
  },
  emptyText: {
    color: EditorColors.textMuted,
    textAlign: 'center',
  },
});
