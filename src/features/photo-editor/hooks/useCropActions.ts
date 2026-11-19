import type { SharedValue } from 'react-native-reanimated';

import { ASPECT_RATIOS, DEFAULT_GEOMETRY } from '../constants/editor.constants';
import { centeredCrop, orientedSize, rotateCropClockwise } from '../lib/geometry';
import { useEditorStore } from '../store/editor.store';
import type { AspectRatioOption, Geometry, Rotation, Size } from '../types/editor.types';

/** Pixel aspect (w/h) of an aspect option for the given frame, null = free. */
export function resolveAspect(option: AspectRatioOption | undefined, frame: Size): number | null {
  if (!option || option.ratio === null) return null;
  return option.ratio === 0 ? frame.width / frame.height : option.ratio;
}

/** Rotate / flip / aspect / straighten commands for the crop tool. */
export function useCropActions(source: Size, geometry: SharedValue<Geometry>) {
  const current = useEditorStore((s) => s.recipe.geometry);
  const aspectId = useEditorStore((s) => s.aspectId);
  const apply = useEditorStore((s) => s.apply);
  const setAspectId = useEditorStore((s) => s.setAspectId);

  const frame = orientedSize(source, current.rotation);
  const aspectOption = ASPECT_RATIOS.find((a) => a.id === aspectId);
  const aspect = resolveAspect(aspectOption, frame);

  const applyGeometry = (next: Geometry) => apply({ geometry: next });

  const rotate = () =>
    applyGeometry({
      ...current,
      rotation: ((current.rotation + 1) % 4) as Rotation,
      crop: rotateCropClockwise(current.crop),
    });

  const flipHorizontal = () =>
    applyGeometry({
      ...current,
      flipH: !current.flipH,
      straighten: -current.straighten,
      crop: { ...current.crop, x: 1 - current.crop.x - current.crop.width },
    });

  const flipVertical = () =>
    applyGeometry({
      ...current,
      flipV: !current.flipV,
      straighten: -current.straighten,
      crop: { ...current.crop, y: 1 - current.crop.y - current.crop.height },
    });

  const selectAspect = (option: AspectRatioOption) => {
    setAspectId(option.id);
    const ratio = resolveAspect(option, frame);
    if (ratio !== null) applyGeometry({ ...current, crop: centeredCrop(frame, ratio) });
  };

  const reset = () => {
    setAspectId('free');
    applyGeometry(DEFAULT_GEOMETRY);
  };

  /** Commits whatever the UI thread holds (after crop drag / straighten slide). */
  const commitLive = () => applyGeometry(geometry.get());

  return {
    aspectId,
    aspect,
    rotate,
    flipHorizontal,
    flipVertical,
    selectAspect,
    reset,
    commitLive,
  };
}
