import { Canvas, Circle, Group, Line, Path, Skia, vec } from '@shopify/react-native-skia';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { EditorColors, Spacing } from '@/constants/theme';

import { CURVE_CHANNELS } from '../constants/editor.constants';
import { EditorLayout } from '../constants/layout.constants';
import { useCurveEditor } from '../hooks/useCurveEditor';
import { sampleCurvePath } from '../lib/curve';
import type { CurveChannel, CurvePoint } from '../types/editor.types';
import { ChipButton } from './ChipButton';
import { IconButton } from './IconButton';

const BOX = EditorLayout.curveBoxSize;

const CHANNEL_COLORS: Record<CurveChannel, string> = {
  rgb: EditorColors.curveRgb,
  r: EditorColors.curveR,
  g: EditorColors.curveG,
  b: EditorColors.curveB,
};

const GRID = Array.from({ length: EditorLayout.curveGridDivisions - 1 }, (_, i) =>
  ((i + 1) * BOX) / EditorLayout.curveGridDivisions,
);

function curvePath(points: CurvePoint[]) {
  const builder = Skia.PathBuilder.Make();
  sampleCurvePath(points, EditorLayout.curveSamples).forEach((p, i) => {
    const x = p.x * BOX;
    const y = (1 - p.y) * BOX;
    if (i === 0) builder.moveTo(x, y);
    else builder.lineTo(x, y);
  });
  return builder.build();
}

export function CurveEditor() {
  const [channel, setChannel] = useState<CurveChannel>('rgb');
  const { points, curves, gesture, resetChannel } = useCurveEditor(channel, BOX);

  return (
    <View style={styles.container}>
      <View style={styles.channels}>
        {CURVE_CHANNELS.map((c) => (
          <ChipButton
            key={c.id}
            label={c.label}
            selected={c.id === channel}
            onPress={() => setChannel(c.id)}
          />
        ))}
        <IconButton icon="restart_alt" onPress={resetChannel} />
      </View>
      <GestureDetector gesture={gesture}>
        <Canvas style={styles.canvas}>
          {GRID.map((g) => (
            <Group key={g}>
              <Line p1={vec(g, 0)} p2={vec(g, BOX)} color={EditorColors.gridFaint} strokeWidth={1} />
              <Line p1={vec(0, g)} p2={vec(BOX, g)} color={EditorColors.gridFaint} strokeWidth={1} />
            </Group>
          ))}
          <Line p1={vec(0, BOX)} p2={vec(BOX, 0)} color={EditorColors.gridFaint} strokeWidth={1} />
          {CURVE_CHANNELS.filter((c) => c.id !== channel).map((c) => (
            <Path
              key={c.id}
              path={curvePath(curves[c.id])}
              style="stroke"
              strokeWidth={1}
              color={CHANNEL_COLORS[c.id]}
              opacity={0.25}
            />
          ))}
          <Path
            path={curvePath(points)}
            style="stroke"
            strokeWidth={EditorLayout.curveStroke}
            color={CHANNEL_COLORS[channel]}
          />
          {points.map((p, i) => (
            <Circle
              key={i}
              cx={p.x * BOX}
              cy={(1 - p.y) * BOX}
              r={EditorLayout.curvePointRadius}
              color={CHANNEL_COLORS[channel]}
            />
          ))}
        </Canvas>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  channels: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  canvas: {
    width: BOX,
    height: BOX,
    backgroundColor: EditorColors.surface,
  },
});
