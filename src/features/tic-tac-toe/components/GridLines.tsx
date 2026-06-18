import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

interface GridLinesProps {
  boardSize: number;
}

const LINE_DURATION = 350;
const STAGGER = 80;

export function GridLines({ boardSize }: GridLinesProps) {
  const theme = useTheme();
  const cellSize = boardSize / 3;

  const w1 = useSharedValue(0);
  const w2 = useSharedValue(0);
  const h1 = useSharedValue(0);
  const h2 = useSharedValue(0);

  useEffect(() => {
    const easing = Easing.out(Easing.quad);
    w1.value = withDelay(0, withTiming(boardSize, { duration: LINE_DURATION, easing }));
    w2.value = withDelay(STAGGER, withTiming(boardSize, { duration: LINE_DURATION, easing }));
    h1.value = withDelay(STAGGER * 2, withTiming(boardSize, { duration: LINE_DURATION, easing }));
    h2.value = withDelay(STAGGER * 3, withTiming(boardSize, { duration: LINE_DURATION, easing }));
  }, [boardSize]);

  const hLine1Style = useAnimatedStyle(() => ({ width: w1.value }));
  const hLine2Style = useAnimatedStyle(() => ({ width: w2.value }));
  const vLine1Style = useAnimatedStyle(() => ({ height: h1.value }));
  const vLine2Style = useAnimatedStyle(() => ({ height: h2.value }));

  return (
    <>
      <Animated.View
        style={[
          styles.hLine,
          { top: cellSize - 1, backgroundColor: theme.textSecondary },
          hLine1Style,
        ]}
      />
      <Animated.View
        style={[
          styles.hLine,
          { top: cellSize * 2 - 1, backgroundColor: theme.textSecondary },
          hLine2Style,
        ]}
      />
      <Animated.View
        style={[
          styles.vLine,
          { left: cellSize - 1, backgroundColor: theme.textSecondary },
          vLine1Style,
        ]}
      />
      <Animated.View
        style={[
          styles.vLine,
          { left: cellSize * 2 - 1, backgroundColor: theme.textSecondary },
          vLine2Style,
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  hLine: {
    position: 'absolute',
    left: 0,
    height: 2,
  },
  vLine: {
    position: 'absolute',
    top: 0,
    width: 2,
  },
});
