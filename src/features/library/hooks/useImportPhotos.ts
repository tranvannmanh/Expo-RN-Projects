import { useMutation } from '@tanstack/react-query';

import { importPhotos } from '../api/library.api';
import { useLibraryStore } from '../store/library.store';

/** Picks photos from the device gallery and adds copies to the album. */
export function useImportPhotos() {
  const addPhotos = useLibraryStore((s) => s.addPhotos);
  return useMutation({
    mutationFn: importPhotos,
    onSuccess: (photos) => {
      // Picker order is oldest → newest selection; show the last picked first.
      if (photos.length) addPhotos([...photos].reverse());
    },
  });
}
