import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

import { WB_SHIFT_STEPS } from '../constants/camera.constants';
import { formatShift } from '../lib/white-balance';
import { useCameraStore } from '../store/camera.store';
import { StopDial } from './StopDial';

const indexOf = (step: number) => Math.max(0, WB_SHIFT_STEPS.indexOf(step));

/** White-balance fine shift, like Sony's AB / GM adjust (±7 steps each). */
export function WhiteBalanceShiftPicker() {
  const ab = useCameraStore((s) => s.whiteBalance.ab);
  const gm = useCameraStore((s) => s.whiteBalance.gm);
  const setWhiteBalance = useCameraStore((s) => s.setWhiteBalance);

  return (
    <View style={styles.container}>
      <StopDial
        label="A – B"
        values={WB_SHIFT_STEPS}
        index={indexOf(ab)}
        format={(v) => formatShift(v, 'A', 'B')}
        onChange={(value) => setWhiteBalance({ ab: value })}
      />
      <StopDial
        label="G – M"
        values={WB_SHIFT_STEPS}
        index={indexOf(gm)}
        format={(v) => formatShift(v, 'G', 'M')}
        onChange={(value) => setWhiteBalance({ gm: value })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
});
