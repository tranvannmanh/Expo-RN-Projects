import { storeLibraryPhoto } from '../api/library.api';
import { useLibraryStore } from '../store/library.store';
import type { NewLibraryPhoto } from '../types/library.types';

/** Stores a saved photo (capture or edit) in the album. */
export function useAddToLibrary() {
  const addPhotos = useLibraryStore((s) => s.addPhotos);
  return async (input: NewLibraryPhoto) => {
    const photo = await storeLibraryPhoto(input);
    addPhotos([photo]);
    return photo;
  };
}
