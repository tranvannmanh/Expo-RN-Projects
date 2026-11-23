import type { SkImage } from '@shopify/react-native-skia';

import { EffectPicker } from '@/features/photo-editor';

import { useCameraStore } from '../store/camera.store';

type CameraEffectPickerProps = {
  sample: SkImage | null;
};

/** Lens / light filter cards on the sample scene; the viewfinder shows the result live. */
export function CameraEffectPicker({ sample }: CameraEffectPickerProps) {
  const effects = useCameraStore((s) => s.effects);
  const setEffects = useCameraStore((s) => s.setEffects);
  if (!sample) return null;
  return <EffectPicker value={effects} onChange={setEffects} image={sample} />;
}
