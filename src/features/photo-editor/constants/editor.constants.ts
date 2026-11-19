import type {
  AndroidIcon,
  AspectRatioOption,
  CurveChannel,
  EditorTool,
  ExportSettings,
  ExportSize,
  Geometry,
} from '../types/editor.types';

/** Long edge of the GPU preview texture. Keeps live editing at 60fps. */
export const PREVIEW_MAX_EDGE = 2048;
/** Long edge of the film strip thumbnails. */
export const THUMB_MAX_EDGE = 192;

export const EXPORT_MAX_EDGE: Record<ExportSize, number> = {
  original: 8192,
  large: 4096,
  medium: 2048,
};

export const EXPORT_SIZE_LABELS: Record<ExportSize, string> = {
  original: 'Gốc',
  large: '4K',
  medium: '2K',
};

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = { size: 'original', quality: 95 };

export const EXPORT_QUALITY_OPTIONS = [80, 90, 95, 100] as const;

export const MAX_HISTORY = 50;

export const STRAIGHTEN_LIMIT = 45;
/** Minimal crop side, in normalized units. */
export const MIN_CROP = 0.08;

export const MAX_ZOOM = 8;
export const DOUBLE_TAP_ZOOM = 2.5;

export const DEFAULT_GEOMETRY: Geometry = {
  rotation: 0,
  flipH: false,
  flipV: false,
  straighten: 0,
  crop: { x: 0, y: 0, width: 1, height: 1 },
};

export const ASPECT_RATIOS: AspectRatioOption[] = [
  { id: 'free', label: 'Tự do', ratio: null },
  { id: 'original', label: 'Gốc', ratio: 0 },
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '4:5', label: '4:5', ratio: 4 / 5 },
  { id: '3:2', label: '3:2', ratio: 3 / 2 },
  { id: '2:3', label: '2:3', ratio: 2 / 3 },
  { id: '16:9', label: '16:9', ratio: 16 / 9 },
  { id: '9:16', label: '9:16', ratio: 9 / 16 },
];

export const EDITOR_TOOLS: { id: EditorTool; label: string; icon: AndroidIcon }[] = [
  { id: 'film', label: 'Film', icon: 'photo_filter' },
  { id: 'adjust', label: 'Chỉnh', icon: 'tune' },
  { id: 'curve', label: 'Curve', icon: 'show_chart' },
  { id: 'crop', label: 'Cắt', icon: 'crop' },
];

export const CURVE_CHANNELS: { id: CurveChannel; label: string }[] = [
  { id: 'rgb', label: 'RGB' },
  { id: 'r', label: 'R' },
  { id: 'g', label: 'G' },
  { id: 'b', label: 'B' },
];

export const CURVE_MAX_POINTS = 12;
/** Touch radius used to grab an existing curve point, in normalized units. */
export const CURVE_HIT_RADIUS = 0.08;
export const LUT_SIZE = 256;

