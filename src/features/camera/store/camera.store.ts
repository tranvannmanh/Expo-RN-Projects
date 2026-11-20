import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_FILM_ID } from '@/features/photo-editor';
import { zustandMMKVStorage } from '@/shared/services/storage.service';

import { DEFAULT_EXPOSURE, FLASH_ORDER } from '../constants/camera.constants';
import type {
  CameraFacing,
  CapturedShot,
  CaptureMode,
  ExposureReading,
  ExposureSettings,
  FlashMode,
} from '../types/camera.types';

type CameraState = {
  filmId: string;
  flashMode: FlashMode;
  facing: CameraFacing;
  mode: CaptureMode;
  exposure: ExposureSettings;
  /** Session only: selected lens option id (null = main lens). */
  lensId: string | null;
  /** Session only: live sensor values. */
  reading: ExposureReading | null;
  /** Session only: last auto-exposure reading, the reference for S / M metering. */
  metered: ExposureReading | null;
  /** Session only: the most recent capture (not persisted). */
  lastShot: CapturedShot | null;
  setFilm: (filmId: string) => void;
  cycleFlash: () => void;
  flipFacing: () => void;
  setMode: (mode: CaptureMode) => void;
  setExposure: (patch: Partial<ExposureSettings>) => void;
  setLens: (lensId: string | null) => void;
  setReading: (reading: ExposureReading, isAuto: boolean) => void;
  setMetered: (reading: ExposureReading) => void;
  setLastShot: (shot: CapturedShot) => void;
};

export const useCameraStore = create<CameraState>()(
  persist(
    (set, get) => ({
      filmId: DEFAULT_FILM_ID,
      flashMode: 'off',
      facing: 'back',
      mode: 'auto',
      exposure: DEFAULT_EXPOSURE,
      lensId: null,
      reading: null,
      metered: null,
      lastShot: null,
      setFilm: (filmId) => set({ filmId }),
      cycleFlash: () => {
        const index = FLASH_ORDER.indexOf(get().flashMode);
        set({ flashMode: FLASH_ORDER[(index + 1) % FLASH_ORDER.length] });
      },
      flipFacing: () =>
        set((s) => ({ facing: s.facing === 'back' ? 'front' : 'back', lensId: null, metered: null })),
      setMode: (mode) => set({ mode }),
      setExposure: (patch) => set((s) => ({ exposure: { ...s.exposure, ...patch } })),
      setLens: (lensId) => set({ lensId, metered: null }),
      setReading: (reading, isAuto) =>
        set(isAuto ? { reading, metered: reading } : { reading }),
      setMetered: (metered) => set({ metered }),
      setLastShot: (shot) => {
        get().lastShot?.thumb?.dispose();
        set({ lastShot: shot });
      },
    }),
    {
      name: 'camera.settings',
      storage: createJSONStorage(() => zustandMMKVStorage),
      partialize: (s) => ({
        filmId: s.filmId,
        flashMode: s.flashMode,
        facing: s.facing,
        mode: s.mode,
        exposure: s.exposure,
      }),
    },
  ),
);
