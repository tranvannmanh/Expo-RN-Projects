import type { SkImage } from '@shopify/react-native-skia';
import type { CameraDevice, FlashMode } from 'react-native-vision-camera';

import type { SourcePhoto } from '@/features/photo-editor';

export type CameraFacing = 'back' | 'front';

/** Auto, Program (EV comp), Shutter priority, Manual. */
export type CaptureMode = 'auto' | 'p' | 's' | 'm';

export type ExposureParam = 'iso' | 'shutter' | 'ev';

/** What the control area under the viewfinder shows. */
export type CameraPanel = 'film' | 'fn' | 'mode' | 'filmPicker' | ExposureParam;

/** Sensor exposure: duration in seconds, ISO sensitivity. */
export type ExposureReading = {
  iso: number;
  duration: number;
};

export type ExposureSettings = {
  iso: number;
  shutter: number;
  ev: number;
};

export type LensOption = {
  id: string;
  /** Zoom factor relative to the main lens, e.g. "0.5x". */
  label: string;
  device: CameraDevice;
  zoom: number;
};

export type CapturedShot = {
  /** Unprocessed capture, reopened in the editor with the film pre-applied. */
  photo: SourcePhoto;
  filmId: string;
  /** Downscaled copy of the saved (filtered) photo. */
  thumb: SkImage | null;
};

export type { FlashMode };
