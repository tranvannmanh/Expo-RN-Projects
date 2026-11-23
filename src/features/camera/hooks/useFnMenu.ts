import { describeEffects, getFilmPreset } from '@/features/photo-editor';

import { SELF_TIMER_ICONS, formatSelfTimer } from '../constants/camera.constants';
import { activeParams, formatEv, formatShutterValue } from '../lib/exposure';
import { useCameraStore } from '../store/camera.store';
import type { AspectOption, CameraPanel, CaptureMode, ExposureSettings } from '../types/camera.types';
import type { FnItem } from '../types/fn.types';

type FnMenuInput = {
  mode: CaptureMode;
  exposure: ExposureSettings;
  aspect: AspectOption;
  isManual: boolean;
  remeter: () => void;
  openPanel: (panel: CameraPanel) => void;
};

const OFF = 'OFF';
const ON = 'ON';

/**
 * Tiles of the Fn grid, in Sony-like order: exposure first, then camera toggles.
 * Mode, lens and flash have their own controls outside the grid.
 */
export function useFnMenu(input: FnMenuInput): FnItem[] {
  const filmId = useCameraStore((s) => s.filmId);
  const effects = useCameraStore((s) => s.effects);
  const selfTimer = useCameraStore((s) => s.selfTimer);
  const facing = useCameraStore((s) => s.facing);
  const showGrid = useCameraStore((s) => s.showGrid);
  const cycleSelfTimer = useCameraStore((s) => s.cycleSelfTimer);
  const flipFacing = useCameraStore((s) => s.flipFacing);
  const toggleGrid = useCameraStore((s) => s.toggleGrid);

  const { mode, exposure, openPanel } = input;
  const params = activeParams(mode, input.isManual);

  return [
    {
      id: 'shutter',
      label: 'SS',
      value: formatShutterValue(exposure.shutter),
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
      id: 'timer',
      icon: SELF_TIMER_ICONS[selfTimer],
      value: selfTimer ? formatSelfTimer(selfTimer) : OFF,
      onPress: cycleSelfTimer,
    },
    {
      id: 'facing',
      icon: 'flip_camera_android',
      value: facing === 'back' ? 'SAU' : 'TRƯỚC',
      onPress: flipFacing,
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
