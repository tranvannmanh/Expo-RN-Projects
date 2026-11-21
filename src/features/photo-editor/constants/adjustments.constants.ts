import type {
  AdjustmentDefinition,
  AdjustmentGroup,
  AdjustmentKey,
  Adjustments,
} from '../types/editor.types';
import { FILTER_AMOUNT_DEFINITION, LENS_AMOUNT_DEFINITION } from './effects.constants';

const percent = (key: AdjustmentKey, label: string, min = -100): AdjustmentDefinition => ({
  key,
  label,
  min,
  max: 100,
  defaultValue: 0,
  step: 1,
  decimals: 0,
});

export const ADJUSTMENT_GROUPS: AdjustmentGroup[] = [
  {
    id: 'light',
    label: 'Ánh sáng',
    items: [
      { key: 'exposure', label: 'Phơi sáng', min: -2, max: 2, defaultValue: 0, step: 0.01, decimals: 2 },
      percent('brightness', 'Độ sáng'),
      percent('contrast', 'Tương phản'),
      percent('highlights', 'Vùng sáng'),
      percent('shadows', 'Vùng tối'),
      percent('whites', 'Trắng'),
      percent('blacks', 'Đen'),
    ],
  },
  {
    id: 'color',
    label: 'Màu',
    items: [
      percent('temperature', 'Độ ấm'),
      percent('tint', 'Sắc độ'),
      percent('saturation', 'Bão hòa'),
      percent('vibrance', 'Rực rỡ'),
    ],
  },
  {
    id: 'detail',
    label: 'Chi tiết',
    items: [percent('sharpen', 'Độ nét', 0), percent('clarity', 'Rõ nét')],
  },
  {
    id: 'effects',
    label: 'Hiệu ứng',
    items: [
      percent('vignette', 'Vignette'),
      percent('grain', 'Hạt phim', 0),
      { key: 'grainSize', label: 'Cỡ hạt', min: 0, max: 100, defaultValue: 25, step: 1, decimals: 0 },
      percent('fade', 'Fade', 0),
    ],
  },
];

export const FILM_STRENGTH_DEFINITION: AdjustmentDefinition = {
  key: 'filmStrength',
  label: 'Cường độ',
  min: 0,
  max: 100,
  defaultValue: 100,
  step: 1,
  decimals: 0,
};

const ALL_DEFINITIONS = [
  ...ADJUSTMENT_GROUPS.flatMap((g) => g.items),
  FILM_STRENGTH_DEFINITION,
  LENS_AMOUNT_DEFINITION,
  FILTER_AMOUNT_DEFINITION,
];

export const DEFAULT_ADJUSTMENTS = Object.fromEntries(
  ALL_DEFINITIONS.map((d) => [d.key, d.defaultValue]),
) as Adjustments;
