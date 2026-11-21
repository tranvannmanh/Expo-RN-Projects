import { EffectPicker } from '@/features/photo-editor';

import { useCameraStore } from '../store/camera.store';

/** Lens / light filter chips; the viewfinder shows the result live. */
export function CameraEffectPicker() {
  const effects = useCameraStore((s) => s.effects);
  const setEffects = useCameraStore((s) => s.setEffects);
  return <EffectPicker value={effects} onChange={setEffects} />;
}
