import { useLibraryStore } from '../store/library.store';

/** All album photos, newest first. */
export function useLibraryPhotos() {
  return useLibraryStore((s) => s.photos);
}

export function useLibraryPhoto(id: string | undefined) {
  return useLibraryStore((s) => s.photos.find((p) => p.id === id));
}
