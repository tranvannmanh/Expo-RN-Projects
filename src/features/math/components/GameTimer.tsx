import { AnimatedThemedText } from '@/components';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import {
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from 'react-native-reanimated';

type GameTimerProps = {
  remainingTimeMs: number;
  status: 'idle' | 'playing' | 'game_over';
};

export function GameTimer({ remainingTimeMs, status }: GameTimerProps) {
  const seconds = Math.ceil(remainingTimeMs / 1000);

  const scale = useSharedValue(1);

  const isPlaying = status === 'playing';
  const isWarning = isPlaying && seconds <= 5;
  const isCritical = isPlaying && seconds <= 3;

  useEffect(() => {
    if (!isCritical) {
      scale.value = withTiming(1, {
        duration: 150,
      });

      return;
    }

    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, {
          duration: 250,
        }),
        withTiming(1, {
          duration: 250,
        }),
      ),
      -1,
      false,
    );

    return () => {
      scale.value = 1;
    };
  }, [isCritical, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: scale.value,
      },
    ],
  }));

  return (
    <AnimatedThemedText
      style={[
        styles.timer,
        isWarning && styles.warning,
        isCritical && styles.critical,
        animatedStyle,
      ]}
    >
      {seconds}
    </AnimatedThemedText>
  );
}

const styles = StyleSheet.create({
  timer: {
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
  },

  warning: {
    // giữ style cơ bản ở đây
    color: 'rgba(234, 175, 65, 1)',
    fontWeight: '600',
  },

  critical: {
    fontWeight: '900',
    color: 'red',
  },
});
