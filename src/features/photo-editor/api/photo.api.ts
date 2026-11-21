import {
  FilterMode,
  MipmapMode,
  Skia,
  type SkData,
  type SkImage,
} from '@shopify/react-native-skia';
import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Asset, requestPermissionsAsync } from 'expo-media-library';

import PhotoExif from '@modules/photo-exif';

import type { SourcePhoto } from '../types/editor.types';

/** Opens the system photo picker. Returns null when the user cancels. */
export async function pickPhoto(): Promise<SourcePhoto | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
    exif: false,
  });
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, width: asset.width, height: asset.height };
}

/** Decodes an image file with Skia (EXIF orientation is applied by the codec). */
export async function decodeImage(uri: string): Promise<SkImage> {
  const data = await Skia.Data.fromURI(uri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) throw new Error('Không đọc được ảnh');
  return image;
}

/**
 * Downscales with mipmapped sampling so the long edge is at most `maxEdge`.
 * The result is a CPU-backed image, safe to share with the UI thread.
 */
export function resizeImage(image: SkImage, maxEdge: number): SkImage {
  const longEdge = Math.max(image.width(), image.height());
  if (longEdge <= maxEdge) return image.makeNonTextureImage() ?? image;

  const scale = maxEdge / longEdge;
  const width = Math.round(image.width() * scale);
  const height = Math.round(image.height() * scale);
  const surface = Skia.Surface.MakeOffscreen(width, height);
  if (!surface) throw new Error('Không đủ bộ nhớ GPU để thu nhỏ ảnh');

  surface
    .getCanvas()
    .drawImageRectOptions(
      image,
      Skia.XYWHRect(0, 0, image.width(), image.height()),
      Skia.XYWHRect(0, 0, width, height),
      FilterMode.Linear,
      MipmapMode.Linear,
    );
  surface.flush();
  const result = surface.makeImageSnapshot().makeNonTextureImage();
  surface.dispose();
  if (!result) throw new Error('Không thu nhỏ được ảnh');
  return result;
}

/** Reads an image file into Skia memory without blocking the JS thread. */
export function loadImageData(uri: string): Promise<SkData> {
  return Skia.Data.fromURI(uri);
}

/** EXIF to carry over from the original photo (see modules/photo-exif). */
export type ExifCopy = {
  sourceUri: string;
  /** Written only when the source has no value for the tag. */
  fallbacks: Record<string, string>;
  /** Always written (orientation, new size, software…). */
  overrides: Record<string, string>;
};

/** Smallest plausible JPEG; anything below means the encode or write failed. */
const MIN_JPEG_BYTES = 1024;

/**
 * Stores an already-encoded JPEG (base64) in the device gallery, with EXIF when
 * given. Never saves an empty file: each step is size-checked, and if adding
 * EXIF damages the file it is rewritten without metadata.
 */
export async function saveJpegToGallery(jpegBase64: string, exif?: ExifCopy): Promise<string> {
  const permission = await requestPermissionsAsync(true, ['photo']);
  if (!permission.granted) throw new Error('Chưa được cấp quyền lưu ảnh');
  if (jpegBase64.length < MIN_JPEG_BYTES) {
    throw new Error(`Không nén được ảnh (JPEG rỗng, ${jpegBase64.length} ký tự)`);
  }

  const file = new File(Paths.cache, `photo-${Date.now()}.jpg`);
  file.create();
  try {
    file.write(jpegBase64, { encoding: 'base64' });
    const written = file.size;
    if (written < MIN_JPEG_BYTES) throw new Error(`Không ghi được ảnh (${written} byte)`);

    if (exif && PhotoExif) {
      // Metadata is best-effort: a failure must never lose the photo itself.
      const exifError = await PhotoExif.copyExif(
        exif.sourceUri,
        file.uri,
        exif.fallbacks,
        exif.overrides,
      ).then(
        () => null,
        (e: unknown) => String(e),
      );
      const withExif = file.size;
      if (exifError || withExif < MIN_JPEG_BYTES) {
        console.warn(`[save] EXIF skipped (${exifError ?? `file ${withExif} B`}), saving without it`);
        file.write(jpegBase64, { encoding: 'base64' });
      }
    }

    if (__DEV__) console.log(`[save] base64 ${jpegBase64.length} chars → file ${file.size} B`);
    await Asset.create(file.uri);
  } finally {
    file.delete();
  }
  return file.uri;
}
