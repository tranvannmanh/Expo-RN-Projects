import { formatEv, formatIso, formatShutter, meterOffset } from '../lib/exposure';
import { useCameraStore } from '../store/camera.store';

/** Formatted shutter / EV / ISO the camera is shooting with, as shown on screen. */
export function useExposureDisplay() {
  const liveReading = useCameraStore((s) => s.reading);
  const manualExposure = useCameraStore((s) => s.manualExposure);
  const metered = useCameraStore((s) => s.metered);
  const mode = useCameraStore((s) => s.mode);
  const exposure = useCameraStore((s) => s.exposure);
  // In S / M show what the capture will use, not the faster viewfinder exposure.
  const reading = manualExposure ?? liveReading;

  // Real M shows the meter offset; every other mode shows the EV compensation in use
  // (M on a lens without manual control runs auto, so no manual exposure is set).
  const ev =
    mode === 'm' && manualExposure
      ? metered
        ? meterOffset(metered, exposure.iso, exposure.shutter)
        : 0
      : exposure.ev;

  return {
    shutter: reading ? formatShutter(reading.duration) : '--',
    ev: formatEv(ev),
    iso: reading ? formatIso(reading.iso) : 'ISO --',
  };
}
