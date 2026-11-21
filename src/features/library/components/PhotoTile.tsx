import { Image } from 'expo-image';
import { Pressable, StyleSheet } from 'react-native';

import { EditorColors, Motion } from '@/constants/theme';

import { GRID_COLUMNS, LibraryLayout } from '../constants/library.constants';
import type { LibraryPhoto } from '../types/library.types';

type PhotoTileProps = {
  photo: LibraryPhoto;
  onPress: (photo: LibraryPhoto) => void;
};

const TILE_WIDTH = `${100 / GRID_COLUMNS}%` as const;

/** Square thumbnail (expo-image downsamples and caches the full JPEG). */
export function PhotoTile({ photo, onPress }: PhotoTileProps) {
  return (
    <Pressable
      onPress={() => onPress(photo)}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
      <Image
        source={{ uri: photo.uri }}
        style={styles.image}
        contentFit="cover"
        recyclingKey={photo.id}
        cachePolicy="memory-disk"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: TILE_WIDTH,
    aspectRatio: 1,
    padding: LibraryLayout.gridGap / 2,
  },
  image: {
    flex: 1,
    backgroundColor: EditorColors.surfaceHigh,
  },
  pressed: {
    opacity: Motion.pressedOpacity,
  },
});
