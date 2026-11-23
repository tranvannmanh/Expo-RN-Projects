import { describeEffects, getFilmPreset } from '@/features/photo-editor';

import {
  CAPTURE_MODES,
  FLASH_ICONS,
  MANUAL_MODES,
  MODE_PARAMS,
} from '../constants/camera.constants';
import { formatEv, formatShutter } from '../lib/exposure';
import { useCameraStore } from '../store/camera.store';
import type {
  AspectOption,
  CameraPanel,
  CaptureMode,
  ExposureSettings,
  LensOption,
} from '../types/camera.types';
import type { FnItem } from '../types/fn.types';

type FnMenuInput = {
  mode: CaptureMode;
  exposure: ExposureSettings;
  hasFlash: boolean;
  aspect: AspectOption;
  isManual: boolean;
  lenses: LensOption[];
  lensId: string | null;
  selectLens: (lensId: string) => void;
  remeter: () => void;
  openPanel: (panel: CameraPanel) => void;
};

const OFF = 'OFF';
const ON = 'ON';

/** Tiles of the Fn grid, in Sony-like order: exposure first, then camera toggles. */
export function useFnMenu(input: FnMenuInput): FnItem[] {
  const filmId = useCameraStore((s) => s.filmId);
  const effects = useCameraStore((s) => s.effects);
  const flashMode = useCameraStore((s) => s.flashMode);
  const facing = useCameraStore((s) => s.facing);
  const showGrid = useCameraStore((s) => s.showGrid);
  const cycleFlash = useCameraStore((s) => s.cycleFlash);
  const flipFacing = useCameraStore((s) => s.flipFacing);
  const toggleGrid = useCameraStore((s) => s.toggleGrid);

  const { mode, exposure, lenses, lensId, openPanel } = input;
  // A lens without manual sensor control runs S / M as auto: don't offer dials that do nothing.
  const params = MANUAL_MODES.includes(mode) && !input.isManual ? MODE_PARAMS.auto : MODE_PARAMS[mode];
  const lensIndex = Math.max(0, lenses.findIndex((l) => l.id === lensId));

  return [
    {
      id: 'mode',
      label: 'MODE',
      value: CAPTURE_MODES.find((m) => m.id === mode)?.label,
      onPress: () => openPanel('mode'),
    },
    {
      id: 'shutter',
      label: 'SS',
      value: formatShutter(exposure.shutter),
      disabled: !params.includes('shutter'),
      onPress: () => openPanel('shutter'),
    },
    {
      id: 'iso',
      label: 'ISO',
      value: params.includes('iso') ? String(exposure.iso) : 'AUTO',
      disabled: !params.includes('iso'),
      onPress: () => openPanel('iso'),
    },
    {
      id: 'ev',
      icon: 'exposure',
      value: formatEv(params.includes('ev') ? exposure.ev : 0),
      disabled: !params.includes('ev'),
      onPress: () => openPanel('ev'),
    },
    {
      id: 'film',
      icon: 'photo_filter',
      value: getFilmPreset(filmId).name,
      onPress: () => openPanel('filmPicker'),
    },
    {
      id: 'effects',
      icon: 'camera',
      value: describeEffects(effects) ?? OFF,
      onPress: () => openPanel('effects'),
    },
    {
      id: 'grid',
      icon: showGrid ? 'grid_on' : 'grid_off',
      value: showGrid ? ON : OFF,
      onPress: toggleGrid,
    },
    {
      id: 'flash',
      icon: FLASH_ICONS[input.hasFlash ? flashMode : 'off'],
      value: input.hasFlash ? flashMode.toUpperCase() : OFF,
      disabled: !input.hasFlash,
      onPress: cycleFlash,
    },
    {
      id: 'facing',
      icon: 'flip_camera_android',
      value: facing === 'back' ? 'SAU' : 'TRƯỚC',
      onPress: flipFacing,
    },
    {
      id: 'lens',
      label: 'LENS',
      value: lenses[lensIndex]?.label ?? '1x',
      disabled: lenses.length < 2,
      onPress: () => {
        const next = lenses[(lensIndex + 1) % lenses.length];
        if (next) input.selectLens(next.id);
      },
    },
    {
      id: 'aspect',
      icon: 'aspect_ratio',
      value: input.aspect.label,
      onPress: () => openPanel('aspect'),
    },
    {
      id: 'meter',
      icon: 'center_focus_strong',
      value: 'ĐO SÁNG',
      disabled: !input.isManual,
      onPress: input.remeter,
    },
  ];
}
