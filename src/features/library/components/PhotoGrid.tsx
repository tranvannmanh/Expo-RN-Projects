import { FlatList, StyleSheet } from 'react-native';

import { GRID_COLUMNS, LibraryLayout } from '../constants/library.constants';
import type { LibraryPhoto } from '../types/library.types';
import { PhotoTile } from './PhotoTile';

type PhotoGridProps = {
  photos: LibraryPhoto[];
  onPress: (photo: LibraryPhoto) => void;
};

/** Virtualized album grid. */
export function PhotoGrid({ photos, onPress }: PhotoGridProps) {
  return (
    <FlatList
      data={photos}
      keyExtractor={(p) => p.id}
      numColumns={GRID_COLUMNS}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => <PhotoTile photo={item} onPress={onPress} />}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: LibraryLayout.gridGap / 2,
  },
});
