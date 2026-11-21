import { Image } from 'expo-image';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Spacing } from '@/constants/theme';
import { ORIGIN_LABELS, useLibraryPhoto, usePhotoActions } from '@/features/library';
import { EditorLayout, IconButton, getFilmPreset, useEditorStore } from '@/features/photo-editor';

const formatDate = (ms: number) =>
  new Date(ms).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });

export default function PhotoDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const photo = useLibraryPhoto(id);
  const actions = usePhotoActions(photo);
  const openPhoto = useEditorStore((s) => s.openPhoto);

  if (!photo) return <Redirect href="/album" />;

  // Reopens the original with its recipe; saving from the editor adds a new copy.
  const edit = () => {
    openPhoto(
      { uri: photo.sourceUri, width: photo.width, height: photo.height },
      photo.recipe ?? undefined,
    );
    router.push('/editor');
  };

  const confirmDelete = () =>
    Alert.alert('Xóa khỏi album?', 'Ảnh trong thư viện máy (nếu có) vẫn được giữ.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          actions.remove();
          router.back();
        },
      },
    ]);

  const film = photo.filmId === 'none' ? null : getFilmPreset(photo.filmId).name;
  const info = [
    formatDate(photo.createdAt),
    `${photo.width}×${photo.height}`,
    film,
    ORIGIN_LABELS[photo.origin],
  ].filter(Boolean);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <IconButton icon="arrow_back" onPress={() => router.back()} />
        <ThemedText type="small" numberOfLines={1} style={styles.info}>
          {info.join(' · ')}
        </ThemedText>
      </View>

      <Image source={{ uri: photo.uri }} style={styles.image} contentFit="contain" />

      {actions.error ? (
        <ThemedText type="small" style={styles.error}>
          {actions.error.message}
        </ThemedText>
      ) : null}

      <View style={styles.actions}>
        <IconButton icon="share" label="Chia sẻ" onPress={actions.share} />
        <IconButton
          icon={actions.isCopied ? 'check' : 'content_copy'}
          label={actions.isCopied ? 'Đã sao chép' : 'Sao chép'}
          onPress={actions.copy}
        />
        <IconButton icon="edit" label="Sửa bản sao" onPress={edit} />
        <IconButton icon="delete" label="Xóa" onPress={confirmDelete} />
      </View>
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
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  info: {
    flex: 1,
    color: EditorColors.textMuted,
  },
  image: {
    flex: 1,
  },
  error: {
    color: EditorColors.danger,
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.three,
  },
});
