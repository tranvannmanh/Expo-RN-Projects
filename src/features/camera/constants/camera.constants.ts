import * as Device from 'expo-device';
import { Dimensions } from 'react-native';
import { CommonResolutions, type TargetVideoPixelFormat } from 'react-native-vision-camera';

import type { AndroidIcon } from '@/features/photo-editor';

import type {
  AspectOption,
  CaptureMode,
  ExposureParam,
  ExposureSettings,
  FlashMode,
} from '../types/camera.types';

/**
 * Frame shapes offered when shooting. The sensor captures 4:3; other ratios are
 * a centered crop applied on save (and shown on the viewfinder).
 */
export const ASPECT_OPTIONS: AspectOption[] = [
  { id: '4:3', label: '4:3', ratio: 4 / 3, hint: 'Cảm biến' },
  { id: '3:2', label: '3:2', ratio: 3 / 2, hint: '35mm' },
  { id: '16:9', label: '16:9', ratio: 16 / 9, hint: 'Màn ảnh rộng' },
  { id: '1:1', label: '1:1', ratio: 1, hint: 'Vuông' },
  { id: 'xpan', label: '65:24', ratio: 65 / 24, hint: 'XPan' },
];
export const DEFAULT_ASPECT_ID = '4:3';
export const getAspectOption = (id: string): AspectOption =>
  ASPECT_OPTIONS.find((a) => a.id === id) ?? ASPECT_OPTIONS[0];

/**
 * Viewfinder frames only need to match the screen (capped at 1080 px wide):
 * smaller frames keep the per-frame shader + copy cheap on any phone.
 */
const PREVIEW_MAX_SHORT_EDGE = 1080;
const previewShortEdge = Math.min(
  PREVIEW_MAX_SHORT_EDGE,
  Math.round(Dimensions.get('screen').width * Dimensions.get('screen').scale),
);
export const PREVIEW_RESOLUTION = {
  width: previewShortEdge,
  height: Math.round((previewShortEdge * 4) / 3),
};
export const PHOTO_RESOLUTION = CommonResolutions.UHD_4_3;
export const PHOTO_QUALITY = 0.95;
/**
 * Photos follow how the phone is physically held (accelerometer), not the UI,
 * which stays locked to portrait: a shot taken sideways is saved upright landscape.
 */
export const PHOTO_ORIENTATION_SOURCE = 'device' as const;
/**
 * 'native' (GPU / PRIVATE buffers) is zero-copy into Skia. Some pipelines reject it
 * (e.g. emulators), so the viewfinder falls back to YUV when the session errors.
 */
export const PREVIEW_PIXEL_FORMAT: TargetVideoPixelFormat = Device.isDevice ? 'native' : 'yuv';
export const FALLBACK_PIXEL_FORMAT: TargetVideoPixelFormat = 'yuv';

/**
 * Emulators cannot map camera HardwareBuffers into Skia textures, so they get the
 * native (unfiltered) preview; the film is still applied to the captured photo.
 */
export const LIVE_FILM_PREVIEW = Device.isDevice;

export const FLASH_ICONS: Record<FlashMode, AndroidIcon> = {
  off: 'flash_off',
  auto: 'flash_auto',
  on: 'flash_on',
};

export const FLASH_ORDER: FlashMode[] = ['off', 'auto', 'on'];

export const CAPTURE_MODES: { id: CaptureMode; label: string; name: string; description: string }[] = [
  {
    id: 'auto',
    label: 'AUTO',
    name: 'Tự động',
    description: 'Máy tự chọn tốc độ màn trập và ISO. Phù hợp chụp nhanh.',
  },
  {
    id: 'p',
    label: 'P',
    name: 'Program',
    description: 'Máy tự phơi sáng, bạn bù sáng EV để ảnh sáng hoặc tối hơn.',
  },
  {
    id: 's',
    label: 'S',
    name: 'Ưu tiên tốc độ',
    description: 'Bạn chọn tốc độ màn trập và EV, máy tự tính ISO. Nhanh: bắt chuyển động; chậm: vệt mờ.',
  },
  {
    id: 'm',
    label: 'M',
    name: 'Thủ công',
    description: 'Bạn chọn ISO và tốc độ màn trập. Số EV trên khung ngắm báo ảnh sáng (+) hay tối (−) hơn đo sáng.',
  },
];

/** Shown under the mode picker when the camera cannot drive the sensor manually. */
export const MANUAL_UNSUPPORTED_NOTE = 'Camera này không hỗ trợ chỉnh ISO / tốc độ thủ công nên S và M bị tắt.';

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
  1 / 8, 1 / 6, 1 / 5, 1 / 4, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.3, 1.6, 2, 2.5, 3.2, 4, 5, 6, 8, 10,
  13, 15, 20, 25, 30,
];

/**
 * In S / M the viewfinder never exposes longer than this, so it stays fluid; the
 * chosen (longer) shutter is only applied for the actual capture. Brightness is
 * matched with ISO and, past the sensor's max ISO, a shader gain.
 */
export const PREVIEW_MAX_SHUTTER_SECONDS = 1 / 30;
/** How often to check that the sensor has switched to the capture exposure (ms). */
export const EXPOSURE_SETTLE_POLL_MS = 30;
/** Relative tolerance when comparing the sensor's exposure to the requested one. */
export const EXPOSURE_SETTLE_TOLERANCE = 0.1;

/** Longest shutter offered; the sensor's own maximum usually applies first. */
export const MAX_SHUTTER_SECONDS = 30;
/** Exposures at least this long (seconds) show the progress overlay. */
export const LONG_EXPOSURE_SECONDS = 1 / 4;

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
  /** Fixed height of the panel under the viewfinder (presets, Fn grid, pickers). */
  panelHeight: 156,
  fnTileHeight: 52,
  fnColumns: 6,
  fnButtonWidth: 64,
  fnButtonHeight: 32,
  gridLineWidth: 1,
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
  spinnerSize: 112,
  spinnerStroke: 5,
  /** Arc length of the busy spinner (degrees). */
  spinnerArc: 100,
} as const;

/** UI counter-rotation (degrees) that keeps overlays upright for each device orientation. */
export const ORIENTATION_UI_DEGREES = { up: 0, right: 90, down: 180, left: -90 } as const;

export const CameraMotion = {
  /** Overlay rotation when the phone is turned (ms). */
  rotate: 200,
  /** One turn of the busy spinner (ms). */
  spinnerTurn: 1000,
  /** White flash overlay when the shutter fires (ms). */
  shutterFlash: 220,
  focusRing: 600,
} as const;
