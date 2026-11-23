import { StyleSheet, View } from 'react-native';

import { EditorColors, Spacing } from '@/constants/theme';

import { useIsLandscape } from '../hooks/useDeviceRotation';
import { useExposureDisplay } from '../hooks/useExposureDisplay';
import { shutterIsoInHeader, useHeaderCutout } from '../hooks/useHeaderCutout';
import { activeParams } from '../lib/exposure';
import { useCameraStore } from '../store/camera.store';
import type { ExposureParam } from '../types/camera.types';
import { ExposureValueButton } from './ExposureValueButton';

type ExposureReadoutProps = {
  /** The lens really runs S / M manually (false on lenses without manual control). */
  isManual: boolean;
  onEditExposure: (param: ExposureParam) => void;
};

/**
 * Sony-style info strip at the bottom of the viewfinder: shutter, EV and ISO,
 * each tappable to open its dial. Shutter / ISO move to the header when it has
 * room for them (held sideways, no punch-hole); EV shows only where it can be
 * set (not in M).
 */
export function ExposureReadout({ isManual, onEditExposure }: ExposureReadoutProps) {
  const display = useExposureDisplay();
  const mode = useCameraStore((s) => s.mode);
  const cutout = useHeaderCutout();
  const showShutterIso = !shutterIsoInHeader(useIsLandscape(), cutout);
  const params = activeParams(mode, isManual);
  const showEv = params.includes('ev');

  if (!showShutterIso && !showEv) return null;

  return (
    <View style={styles.bar} pointerEvents="box-none">
      {showShutterIso ? (
        <ExposureValueButton
          param="shutter"
          text={display.shutter}
          editable={params.includes('shutter')}
          variant="strip"
          onEdit={onEditExposure}
        />
      ) : null}
      {showEv ? (
        <ExposureValueButton param="ev" text={display.ev} editable variant="strip" onEdit={onEditExposure} />
      ) : null}
      {showShutterIso ? (
        <ExposureValueButton
          param="iso"
          text={display.iso}
          editable={params.includes('iso')}
          variant="strip"
          onEdit={onEditExposure}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: EditorColors.overlay,
  },
});
