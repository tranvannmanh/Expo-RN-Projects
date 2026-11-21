import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_FILM_ID } from '@/features/photo-editor';
import { zustandMMKVStorage } from '@/shared/services/storage.service';

import { DEFAULT_ASPECT_ID, DEFAULT_EXPOSURE, FLASH_ORDER } from '../constants/camera.constants';
import type {
  CameraFacing,
  CapturedShot,
  CaptureTimings,
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
  /** Rule-of-thirds overlay on the viewfinder. */
  showGrid: boolean;
  aspectId: string;
  /** Session only: selected lens option id (null = main lens). */
  lensId: string | null;
  /** Session only: live sensor values. */
  reading: ExposureReading | null;
  /** Session only: last auto-exposure reading, the reference for S / M metering. */
  metered: ExposureReading | null;
  /** Session only: exposure the next S / M capture will use (the viewfinder runs faster). */
  manualExposure: ExposureReading | null;
  /** Session only: the most recent capture (not persisted). */
  lastShot: CapturedShot | null;
  /** Session only: a long exposure is being captured by the sensor (busy overlay). */
  isLongCapture: boolean;
  /** Session only: the last capture is being processed / saved (thumbnail spinner). */
  isSaving: boolean;
  /** Performance HUD over the viewfinder (debugging aid). */
  showPerfHud: boolean;
  /** Session only: stage timings of the last capture. */
  lastTimings: CaptureTimings | null;
  setFilm: (filmId: string) => void;
  cycleFlash: () => void;
  flipFacing: () => void;
  setMode: (mode: CaptureMode) => void;
  toggleGrid: () => void;
  setAspect: (aspectId: string) => void;
  setExposure: (patch: Partial<ExposureSettings>) => void;
  setLens: (lensId: string | null) => void;
  setReading: (reading: ExposureReading, isAuto: boolean) => void;
  setMetered: (reading: ExposureReading) => void;
  setManualExposure: (exposure: ExposureReading | null) => void;
  setLastShot: (shot: CapturedShot) => void;
  setLongCapture: (isLongCapture: boolean) => void;
  setSaving: (isSaving: boolean) => void;
  togglePerfHud: () => void;
  setLastTimings: (timings: CaptureTimings) => void;
};

export const useCameraStore = create<CameraState>()(
  persist(
    (set, get) => ({
      filmId: DEFAULT_FILM_ID,
      flashMode: 'off',
      facing: 'back',
      mode: 'auto',
      exposure: DEFAULT_EXPOSURE,
      showGrid: false,
      aspectId: DEFAULT_ASPECT_ID,
      lensId: null,
      reading: null,
      metered: null,
      manualExposure: null,
      lastShot: null,
      isLongCapture: false,
      isSaving: false,
      showPerfHud: false,
      lastTimings: null,
      setFilm: (filmId) => set({ filmId }),
      cycleFlash: () => {
        const index = FLASH_ORDER.indexOf(get().flashMode);
        set({ flashMode: FLASH_ORDER[(index + 1) % FLASH_ORDER.length] });
      },
      flipFacing: () =>
        set((s) => ({ facing: s.facing === 'back' ? 'front' : 'back', lensId: null, metered: null })),
      setMode: (mode) => set({ mode }),
      toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
      setAspect: (aspectId) => set({ aspectId }),
      setExposure: (patch) => set((s) => ({ exposure: { ...s.exposure, ...patch } })),
      setLens: (lensId) => set({ lensId, metered: null }),
      setReading: (reading, isAuto) =>
        set(isAuto ? { reading, metered: reading } : { reading }),
      setMetered: (metered) => set({ metered }),
      setManualExposure: (manualExposure) => set({ manualExposure }),
      setLongCapture: (isLongCapture) => set({ isLongCapture }),
      setSaving: (isSaving) => set({ isSaving }),
      togglePerfHud: () => set((s) => ({ showPerfHud: !s.showPerfHud })),
      setLastTimings: (lastTimings) => set({ lastTimings }),
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
        showGrid: s.showGrid,
        aspectId: s.aspectId,
        showPerfHud: s.showPerfHud,
      }),
    },
  ),
);
