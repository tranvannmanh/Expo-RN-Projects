import DisplayCutout from '@modules/display-cutout';
import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';

import { EditorLayout } from '@/features/photo-editor';

import { CameraLayout } from '../constants/camera.constants';

/**
 * How the camera header shares the top edge with a punch-hole / notch:
 * - `full`  no cutout up there (e.g. Xperia): the header spans the whole width,
 * - `split` controls go left and right of the cutout, its area stays empty,
 * - `below` the cutout leaves too little room on a side: the header moves under it.
 */
export type HeaderCutout =
  | { kind: 'full' }
  | { kind: 'split'; left: number; gap: number }
  | { kind: 'below'; offset: number };

const FULL: HeaderCutout = { kind: 'full' };

/**
 * Held sideways, SS / ISO sit in the header only when it spans the full width;
 * next to a punch-hole there is no room, so they stay in the viewfinder strip.
 */
export const shutterIsoInHeader = (isLandscape: boolean, cutout: HeaderCutout) =>
  isLandscape && cutout.kind !== 'split';

export function useHeaderCutout(): HeaderCutout {
  const { width } = useWindowDimensions();
  const [layout, setLayout] = useState<HeaderCutout>(FULL);

  // Cutouts are known once the window is attached, so read them after mount.
  useEffect(() => {
    const cutout = DisplayCutout?.getCutouts().find(
      (r) => r.top <= CameraLayout.cutoutEdgeTolerance && r.bottom > 0,
    );
    if (!cutout) return setLayout(FULL);
    const margin = CameraLayout.cutoutMargin;
    const left = cutout.left - margin;
    const right = width - cutout.right - margin;
    if (cutout.bottom < EditorLayout.headerHeight && Math.min(left, right) >= CameraLayout.cutoutMinSide) {
      setLayout({ kind: 'split', left, gap: cutout.right - cutout.left + margin * 2 });
    } else {
      setLayout({ kind: 'below', offset: cutout.bottom });
    }
  }, [width]);

  return layout;
}
