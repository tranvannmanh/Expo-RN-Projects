import type { EditRecipe } from '@/features/photo-editor';

/** How a photo entered the album. */
export type PhotoOrigin = 'camera' | 'edit' | 'import';

export type LibraryPhoto = {
  id: string;
  /** Finished JPEG (film applied) inside the app's library folder. */
  uri: string;
  /** Unprocessed original; reopened with `recipe` for non-destructive edits. */
  sourceUri: string;
  width: number;
  height: number;
  createdAt: number;
  origin: PhotoOrigin;
  filmId: string;
  /** Edit recipe that produced `uri` from `sourceUri`; null for imports. */
  recipe: EditRecipe | null;
};

export type NewLibraryPhoto = {
  /** File to store (moved when `moveFile`, otherwise copied). */
  fileUri: string;
  sourceUri: string;
  moveFile: boolean;
  width: number;
  height: number;
  origin: PhotoOrigin;
  filmId: string;
  recipe: EditRecipe | null;
};
