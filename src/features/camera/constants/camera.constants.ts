import * as Device from 'expo-device';
import { CommonResolutions, type TargetVideoPixelFormat } from 'react-native-vision-camera';

import type { AndroidIcon } from '@/features/photo-editor';

import type { CaptureMode, ExposureParam, ExposureSettings, FlashMode } from '../types/camera.types';

/** Preview and photo share 4:3 so the framing on screen matches the saved shot. */
export const CAMERA_ASPECT = 3 / 4;
export const PREVIEW_RESOLUTION = CommonResolutions.FHD_4_3;
export const PHOTO_RESOLUTION = CommonResolutions.UHD_4_3;
export const PHOTO_QUALITY = 0.95;
/** YUV is accepted by every CameraX ImageAnalysis pipeline (PRIVATE is not, e.g. on emulators). */
export const PREVIEW_PIXEL_FORMAT: TargetVideoPixelFormat = 'yuv';

/**
 * Emulators cannot map camera HardwareBuffers into Skia textures, so they get the
 * native (unfiltered) preview; the film is still applied to the captured photo.
 */
export const LIVE_FILM_PREVIEW = Device.isDevice;

/** Live frames feed the preset cards; refreshed at most this often (ms). */
export const SAMPLE_INTERVAL_MS = 1500;
export const SAMPLE_MAX_EDGE = 176;

export const FLASH_ICONS: Record<FlashMode, AndroidIcon> = {
  off: 'flash_off',
  auto: 'flash_auto',
  on: 'flash_on',
};

export const FLASH_ORDER: FlashMode[] = ['off', 'auto', 'on'];

export const CAPTURE_MODES: { id: CaptureMode; label: string }[] = [
  { id: 'auto', label: 'AUTO' },
  { id: 'p', label: 'P' },
  { id: 's', label: 'S' },
  { id: 'm', label: 'M' },
];

/** Which exposure values the user controls in each mode. */
export const MODE_PARAMS: Record<CaptureMode, ExposureParam[]> = {
  auto: [],
  p: ['ev'],
  s: ['shutter', 'ev'],
  m: ['iso', 'shutter'],
};

/** Modes that drive the sensor manually (AE off). */
export const MANUAL_MODES: CaptureMode[] = ['s', 'm'];

/** 1/3-stop shutter speeds (seconds); filtered by the sensor's range at runtime. */
export const SHUTTER_STOPS = [
  1 / 8000, 1 / 6400, 1 / 5000, 1 / 4000, 1 / 3200, 1 / 2500, 1 / 2000, 1 / 1600, 1 / 1250,
  1 / 1000, 1 / 800, 1 / 640, 1 / 500, 1 / 400, 1 / 320, 1 / 250, 1 / 200, 1 / 160, 1 / 125,
  1 / 100, 1 / 80, 1 / 60, 1 / 50, 1 / 40, 1 / 30, 1 / 25, 1 / 20, 1 / 15, 1 / 13, 1 / 10,
  1 / 8, 1 / 6, 1 / 5, 1 / 4, 0.3, 0.4, 0.5, 0.6, 0.8, 1,
];

/** 1/3-stop ISO values; filtered by the sensor's range at runtime. */
export const ISO_STOPS = [
  50, 64, 80, 100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250, 1600, 2000, 2500,
  3200, 4000, 5000, 6400, 8000, 10000, 12800,
];

export const EV_STEP = 1 / 3;
/** Exposure compensation offered in the UI (±3 EV, like most cameras). */
export const EV_LIMIT = 3;

export const DEFAULT_EXPOSURE: ExposureSettings = { iso: 100, shutter: 1 / 125, ev: 0 };

/** How often the live ISO / shutter readout refreshes (ms). */
export const EXPOSURE_POLL_MS = 400;
/** Time auto-exposure needs to settle before a meter reading (ms). */
export const METER_SETTLE_MS = 600;

export const CameraLayout = {
  shutterSize: 76,
  shutterInset: 6,
  shutterBorder: 3,
  thumbSize: 52,
  thumbBorder: 1.5,
  focusRingSize: 64,
  focusRingBorder: 1.5,
  noticeOpacity: 0.85,
  lensButtonSize: 36,
  pillHeight: 32,
  pickerHeight: 84,
  /** Horizontal drag distance (dp) per stop on the dials. */
  dialStepPx: 36,
  dialValueWidth: 84,
  dialGlowWidth: 64,
  dialGlowHeight: 2,
  evTickHeight: 8,
  evMajorTickHeight: 12,
  evTickWidth: 1.5,
  evMarkerSize: 22,
  /** Width of one EV tick slot; narrow enough for ±3 EV in 1/3 steps on a phone. */
  evSlotWidth: 14,
  evLabelRowHeight: 22,
} as const;

export const CameraMotion = {
  /** White flash overlay when the shutter fires (ms). */
  shutterFlash: 220,
  focusRing: 600,
} as const;
