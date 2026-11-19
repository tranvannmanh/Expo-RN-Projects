import type { SymbolViewProps } from 'expo-symbols';

export type AdjustmentKey =
  | 'exposure'
  | 'brightness'
  | 'contrast'
  | 'highlights'
  | 'shadows'
  | 'whites'
  | 'blacks'
  | 'temperature'
  | 'tint'
  | 'saturation'
  | 'vibrance'
  | 'sharpen'
  | 'clarity'
  | 'fade'
  | 'vignette'
  | 'grain'
  | 'grainSize'
  | 'filmStrength';

export type Adjustments = Record<AdjustmentKey, number>;

export type AdjustmentGroupId = 'light' | 'color' | 'detail' | 'effects';

export type AdjustmentDefinition = {
  key: AdjustmentKey;
  label: string;
  min: number;
  max: number;
  defaultValue: number;
  step: number;
  decimals: number;
};

export type AdjustmentGroup = {
  id: AdjustmentGroupId;
  label: string;
  items: AdjustmentDefinition[];
};

/** A control point of a tone curve, both axes normalized to 0..1. */
export type CurvePoint = { x: number; y: number };

export type CurveChannel = 'rgb' | 'r' | 'g' | 'b';

export type CurveSet = Record<CurveChannel, CurvePoint[]>;

export type Vec3 = [number, number, number];

export type FilmPreset = {
  id: string;
  name: string;
  /** Rows of a 3x3 channel mixer applied before the film tone curve. */
  matrix: [Vec3, Vec3, Vec3];
  curves: CurveSet;
  /** Additive color pushed into shadows / highlights (split toning). */
  shadowTint: Vec3;
  highlightTint: Vec3;
  /** 1 = unchanged, 0 = monochrome. */
  saturation: number;
};

/** Normalized crop rectangle in the oriented + straightened frame. */
export type CropRect = { x: number; y: number; width: number; height: number };

export type Rotation = 0 | 1 | 2 | 3;

export type Geometry = {
  /** Quarter turns clockwise. */
  rotation: Rotation;
  flipH: boolean;
  flipV: boolean;
  /** Fine rotation in degrees, -45..45. */
  straighten: number;
  crop: CropRect;
};

export type EditRecipe = {
  adjustments: Adjustments;
  filmId: string;
  curves: CurveSet;
  geometry: Geometry;
};

export type SourcePhoto = {
  uri: string;
  width: number;
  height: number;
};

export type EditorTool = 'film' | 'adjust' | 'curve' | 'crop';

export type AspectRatioOption = {
  id: string;
  label: string;
  /** width / height; null = free. 0 = original aspect. */
  ratio: number | null;
};

export type ExportSize = 'original' | 'large' | 'medium';

export type ExportSettings = {
  size: ExportSize;
  quality: number;
};

export type Size = { width: number; height: number };

/** Uniform block consumed by the photo shader. Keys must match the SkSL source. */
export type PhotoUniforms = {
  outSize: [number, number];
  bypass: number;
  exposure: number;
  brightness: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  temperature: number;
  tint: number;
  saturation: number;
  vibrance: number;
  sharpen: number;
  clarity: number;
  needLocal: number;
  detailScale: number;
  fade: number;
  vignette: number;
  grain: number;
  grainSize: number;
  filmR: Vec3;
  filmG: Vec3;
  filmB: Vec3;
  shadowTint: Vec3;
  highlightTint: Vec3;
  filmSat: number;
  filmStrength: number;
  userCurve: number;
};

/** Material Symbols name accepted by expo-symbols on Android. */
export type AndroidIcon = NonNullable<
  Extract<SymbolViewProps['name'], { android?: unknown }>['android']
>;
