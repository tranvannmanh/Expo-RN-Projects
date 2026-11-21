import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Motion, Spacing } from '@/constants/theme';

import { LibraryLayout, RECENT_PHOTO_LIMIT } from '../constants/library.constants';
import type { LibraryPhoto } from '../types/library.types';
import { PhotoTile } from './PhotoTile';

type RecentPhotosProps = {
  photos: LibraryPhoto[];
  total: number;
  onOpen: (photo: LibraryPhoto) => void;
  onSeeAll: () => void;
};

/** Home section: the latest album photos in a 3×3 grid plus "See all". */
export function RecentPhotos({ photos, total, onOpen, onSeeAll }: RecentPhotosProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <ThemedText type="smallBold">{`Ảnh gần đây · ${total}`}</ThemedText>
        <Pressable
          hitSlop={Spacing.two}
          onPress={onSeeAll}
          style={({ pressed }) => pressed && styles.pressed}>
          <ThemedText type="small" themeColor="textSecondary">
            Xem tất cả ›
          </ThemedText>
        </Pressable>
      </View>
      <View style={styles.grid}>
        {photos.slice(0, RECENT_PHOTO_LIMIT).map((photo) => (
          <PhotoTile key={photo.id} photo={photo} onPress={onOpen} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -LibraryLayout.gridGap / 2,
  },
  pressed: {
    opacity: Motion.pressedOpacity,
  },
});
