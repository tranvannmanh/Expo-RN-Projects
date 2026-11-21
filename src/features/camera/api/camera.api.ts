import type { CameraPhotoOutput } from 'react-native-vision-camera';

import type { SourcePhoto } from '@/features/photo-editor';

import type { FlashMode } from '../types/camera.types';

/** Captures a full-resolution photo to a temporary file. */
export async function capturePhoto(
  output: CameraPhotoOutput,
  flashMode: FlashMode,
): Promise<SourcePhoto> {
  const file = await output.capturePhotoToFile({ flashMode, enableShutterSound: true }, {});
  return { uri: `file://${file.filePath}`, width: file.width, height: file.height };
}
