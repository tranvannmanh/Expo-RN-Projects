import {
  FilterMode,
  ImageFormat,
  MipmapMode,
  Skia,
  type SkImage,
} from '@shopify/react-native-skia';
import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Asset, requestPermissionsAsync } from 'expo-media-library';

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

/** Encodes to JPEG and stores it in the device gallery. */
export async function saveJpegToGallery(image: SkImage, quality: number): Promise<string> {
  const permission = await requestPermissionsAsync(true, ['photo']);
  if (!permission.granted) throw new Error('Chưa được cấp quyền lưu ảnh');

  const bytes = image.encodeToBytes(ImageFormat.JPEG, quality);
  const file = new File(Paths.cache, `photo-${Date.now()}.jpg`);
  file.create();
  file.write(bytes);
  try {
    await Asset.create(file.uri);
  } finally {
    file.delete();
  }
  return file.uri;
}
