import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { EditorColors } from '@/constants/theme';

import { CameraLayout } from '../constants/camera.constants';

type ProgressRingProps = {
  /** 0 → 1, animated on the UI thread. */
  progress: SharedValue<number>;
  /** Content centered inside the ring. */
  children?: ReactNode;
};

const SIZE = CameraLayout.progressRingSize;
const STROKE = CameraLayout.progressRingStroke;
const INSET = STROKE / 2;

/** Circle drawn clockwise from 12 o'clock, so `end` maps straight to progress. */
const RING = Skia.PathBuilder.Make()
  .addArc(Skia.XYWHRect(INSET, INSET, SIZE - STROKE, SIZE - STROKE), -90, 360)
  .build();

export function ProgressRing({ progress, children }: ProgressRingProps) {
  return (
    <View style={styles.box}>
      <Canvas style={styles.canvas}>
        <Path path={RING} style="stroke" strokeWidth={STROKE} color={EditorColors.surfaceHigh} />
        <Path
          path={RING}
          style="stroke"
          strokeWidth={STROKE}
          strokeCap="round"
          color={EditorColors.accent}
          start={0}
          end={progress}
        />
      </Canvas>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: SIZE,
    height: SIZE,
  },
  canvas: {
    ...StyleSheet.absoluteFill,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
