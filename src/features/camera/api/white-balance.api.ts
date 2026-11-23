import type { CameraController, WhiteBalanceGains } from 'react-native-vision-camera';

import { getWhiteBalanceOption } from '../constants/camera.constants';
import type { WhiteBalanceSettings } from '../types/camera.types';
import { latest } from './command-queue';

const AUTO: WhiteBalanceGains = { redGain: 0, greenGain: 0, blueGain: 0 };

/** The camera offers fixed white balance by colour temperature (manual colour gains). */
export const supportsKelvin = (controller: CameraController) =>
  controller.device.supportsWhiteBalanceLocking;

/**
 * Gains understood by the patched VisionCamera `setWhiteBalanceLocked`:
 * all 0 = auto, `redGain < 0` = sensor preset `-redGain` (CONTROL_AWB_MODE_*),
 * positive = fixed gains (from the Kelvin value).
 */
function gainsFor(controller: CameraController, wb: WhiteBalanceSettings): WhiteBalanceGains {
  if (wb.preset === 'kelvin') {
    return supportsKelvin(controller)
      ? controller.convertWhiteBalanceTemperatureAndTintValues({ temperature: wb.kelvin, tint: 0 })
      : AUTO;
  }
  const { awbMode } = getWhiteBalanceOption(wb.preset);
  return awbMode ? { redGain: -awbMode, greenGain: 0, blueGain: 0 } : AUTO;
}

/** Applies the sensor part of the white balance; newer values replace waiting ones. */
export function applyWhiteBalance(controller: CameraController, wb: WhiteBalanceSettings) {
  const gains = gainsFor(controller, wb);
  return latest(controller, 'whiteBalance', () => controller.setWhiteBalanceLocked(gains));
}
