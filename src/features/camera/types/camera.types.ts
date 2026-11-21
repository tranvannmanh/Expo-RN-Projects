import type { SkImage } from '@shopify/react-native-skia';
import type { CameraDevice, FlashMode } from 'react-native-vision-camera';

import type { EffectSelection, Geometry, SourcePhoto } from '@/features/photo-editor';

export type CameraFacing = 'back' | 'front';

/** Stage durations of the last capture (ms), shown in the performance HUD. */
export type CaptureTimings = {
  /** Switching the sensor to the capture exposure (S / M). */
  prepareMs: number;
  /** Sensor capture + camera JPEG written to disk. */
  captureMs: number;
  processMs: number;
  saveMs: number;
};


/** Auto, Program (EV comp), Shutter priority, Manual. */
export type CaptureMode = 'auto' | 'p' | 's' | 'm';

export type ExposureParam = 'iso' | 'shutter' | 'ev';

/** What the control area under the viewfinder shows. */
export type CameraPanel =
  | 'film'
  | 'fn'
  | 'mode'
  | 'filmPicker'
  | 'aspect'
  | 'effects'
  | ExposureParam;

export type AspectOption = {
  id: string;
  label: string;
  /** Long edge : short edge. */
  ratio: number;
  /** Optional note shown under the label, e.g. the camera it comes from. */
  hint?: string;
};

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
  /** Lens / light filter rendered into the photo, restored in the editor. */
  effects: EffectSelection;
  /** Crop applied when saving (aspect ratio), reused when opening in the editor. */
  geometry: Geometry;
  /** Downscaled copy of the saved (filtered) photo. */
  thumb: SkImage | null;
};

export type { FlashMode };
