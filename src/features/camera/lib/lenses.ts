import type { CameraDevice } from 'react-native-vision-camera';

import type { LensOption } from '../types/camera.types';

export const MAIN_LENS_ID = 'main';

/** Fallback zoom ratios when a lens does not report its focal length. */
const ULTRA_WIDE_RATIO = 0.5;
const TELEPHOTO_RATIO = 2;

function formatRatio(ratio: number): string {
  const rounded = Math.round(ratio * 10) / 10;
  return `${rounded}x`;
}

function focalRatio(lens: CameraDevice, main: CameraDevice, fallback: number): number {
  return lens.focalLength && main.focalLength ? lens.focalLength / main.focalLength : fallback;
}

/**
 * Lenses on the selected side of the phone:
 * - a logical multi-camera whose zoom goes below 1x exposes the ultra-wide via zoom,
 * - phones that publish ultra-wide / telephoto as separate cameras are switched by device.
 */
export function buildLensOptions(main: CameraDevice, devices: CameraDevice[]): LensOption[] {
  const options: (LensOption & { ratio: number })[] = [
    { id: MAIN_LENS_ID, label: '1x', device: main, zoom: 1, ratio: 1 },
  ];

  if (main.minZoom < 1) {
    options.push({
      id: 'zoom-wide',
      label: formatRatio(main.minZoom),
      device: main,
      zoom: main.minZoom,
      ratio: main.minZoom,
    });
  }

  for (const lens of devices) {
    if (lens.id === main.id || lens.position !== main.position) continue;
    if (lens.type === 'ultra-wide-angle' && main.minZoom >= 1) {
      const ratio = focalRatio(lens, main, ULTRA_WIDE_RATIO);
      options.push({ id: lens.id, label: formatRatio(ratio), device: lens, zoom: 1, ratio });
    } else if (lens.type === 'telephoto') {
      const ratio = focalRatio(lens, main, TELEPHOTO_RATIO);
      options.push({ id: lens.id, label: formatRatio(ratio), device: lens, zoom: 1, ratio });
    }
  }

  return options
    .sort((a, b) => a.ratio - b.ratio)
    .map(({ ratio: _ratio, ...option }) => option);
}
