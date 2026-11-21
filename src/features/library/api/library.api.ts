import * as Clipboard from 'expo-clipboard';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';

import type { LibraryPhoto, NewLibraryPhoto } from '../types/library.types';

/** App-private album folder (not visible to other apps, survives cache clears). */
const libraryDir = () => {
  const dir = new Directory(Paths.document, 'library');
  dir.create({ idempotent: true, intermediates: true });
  return dir;
};

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const isInLibrary = (uri: string) => uri.startsWith(libraryDir().uri);

/**
 * Stores the finished JPEG (and, when it lives elsewhere, a copy of its
 * original) in the album folder and returns the album entry.
 */
export async function storeLibraryPhoto(input: NewLibraryPhoto): Promise<LibraryPhoto> {
  const dir = libraryDir();
  const id = newId();
  const target = new File(dir, `${id}.jpg`);
  const file = new File(input.fileUri);
  if (input.moveFile) await file.move(target);
  else await file.copy(target);

  let sourceUri = input.sourceUri;
  if (input.sourceUri === input.fileUri) {
    sourceUri = target.uri;
  } else if (!isInLibrary(input.sourceUri)) {
    const original = new File(dir, `${id}-src.jpg`);
    await new File(input.sourceUri).copy(original);
    sourceUri = original.uri;
  }

  return {
    id,
    uri: target.uri,
    sourceUri,
    width: input.width,
    height: input.height,
    createdAt: Date.now(),
    origin: input.origin,
    filmId: input.filmId,
    recipe: input.recipe,
  };
}

/** Lets the user pick photos from the device gallery and copies them into the album. */
export async function importPhotos(): Promise<LibraryPhoto[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: 0,
    quality: 1,
  });
  if (result.canceled) return [];
  const stored: LibraryPhoto[] = [];
  for (const asset of result.assets) {
    stored.push(
      await storeLibraryPhoto({
        fileUri: asset.uri,
        sourceUri: asset.uri,
        moveFile: false,
        width: asset.width,
        height: asset.height,
        origin: 'import',
        filmId: 'none',
        recipe: null,
      }),
    );
  }
  return stored;
}

/** Deletes the photo's files unless another album entry still uses them. */
export function deleteLibraryFiles(photo: LibraryPhoto, others: LibraryPhoto[]) {
  const inUse = new Set(others.flatMap((p) => [p.uri, p.sourceUri]));
  for (const uri of new Set([photo.uri, photo.sourceUri])) {
    if (inUse.has(uri) || !isInLibrary(uri)) continue;
    const file = new File(uri);
    if (file.exists) file.delete();
  }
}

export async function sharePhoto(uri: string) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Thiết bị không hỗ trợ chia sẻ');
  await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: 'Chia sẻ ảnh' });
}

export async function copyPhotoToClipboard(uri: string) {
  await Clipboard.setImageAsync(await new File(uri).base64());
}
