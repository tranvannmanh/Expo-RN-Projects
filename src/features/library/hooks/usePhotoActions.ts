import { useMutation } from '@tanstack/react-query';

import { copyPhotoToClipboard, deleteLibraryFiles, sharePhoto } from '../api/library.api';
import { useLibraryStore } from '../store/library.store';
import type { LibraryPhoto } from '../types/library.types';

/** Share / copy / delete for one album photo. */
export function usePhotoActions(photo: LibraryPhoto | undefined) {
  const removePhoto = useLibraryStore((s) => s.removePhoto);

  const share = useMutation({ mutationFn: (uri: string) => sharePhoto(uri) });
  const copy = useMutation({ mutationFn: (uri: string) => copyPhotoToClipboard(uri) });

  const remove = () => {
    if (!photo) return;
    const others = useLibraryStore.getState().photos.filter((p) => p.id !== photo.id);
    deleteLibraryFiles(photo, others);
    removePhoto(photo.id);
  };

  return {
    share: () => photo && share.mutate(photo.uri),
    copy: () => photo && copy.mutate(photo.uri),
    remove,
    isCopied: copy.isSuccess,
    error: share.error ?? copy.error,
  };
}
