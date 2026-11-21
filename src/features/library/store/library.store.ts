import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandMMKVStorage } from '@/shared/services/storage.service';

import type { LibraryPhoto } from '../types/library.types';

type LibraryState = {
  /** Newest first. */
  photos: LibraryPhoto[];
  addPhotos: (photos: LibraryPhoto[]) => void;
  removePhoto: (id: string) => void;
};

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set) => ({
      photos: [],
      addPhotos: (photos) => set((s) => ({ photos: [...photos, ...s.photos] })),
      removePhoto: (id) => set((s) => ({ photos: s.photos.filter((p) => p.id !== id) })),
    }),
    {
      name: 'library.photos',
      storage: createJSONStorage(() => zustandMMKVStorage),
    },
  ),
);
