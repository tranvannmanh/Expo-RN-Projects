import { AnimatedThemedView, ThemedText } from '@/components';
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export type AnswerButtonState = 'idle' | 'correct' | 'wrong' | 'disabled';

type AnswerButtonProps = {
  value: number;
  state?: AnswerButtonState;
  onPress: (value: number) => void;
  disabled?: boolean;
};

export function AnswerButton({
  value,
  state = 'idle',
  onPress,
  disabled = false,
}: AnswerButtonProps) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const isCorrect = state === 'correct';
  const isWrong = state === 'wrong';
  const _disabled = disabled || isCorrect || isWrong;

  useEffect(() => {
    if (state === 'correct') {
      scale.value = withSequence(withSpring(1.08), withSpring(1));
    }

    if (state === 'wrong') {
      translateX.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [state, scale, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: scale.value,
      },
      {
        translateX: translateX.value,
      },
    ],
  }));

  return (
    <AnimatedThemedView
      style={[
        styles.container,
        isCorrect && styles.correct,
        isWrong && styles.wrong,
        _disabled && styles.disabled,
        animatedStyle,
      ]}
    >
      <Pressable
        style={styles.pressable}
        disabled={_disabled}
        onPress={() => onPress(value)}
      >
        <ThemedText style={styles.text}>{value}</ThemedText>

        {(isCorrect || isWrong) && (
          <ThemedText
            style={[styles.feedback, { color: isCorrect ? 'green' : 'red' }]}
          >
            {isCorrect ? '✓' : '💔'}
          </ThemedText>
        )}
      </Pressable>
    </AnimatedThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '47%',
    minHeight: 80,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },

  pressable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  correct: {
    borderWidth: 2,
    borderColor: 'rgba(17, 82, 38, 1)',
  },

  wrong: {
    borderWidth: 2,
    borderColor: 'rgba(150, 0, 0, 1)',
  },

  disabled: {
    opacity: 0.5,
  },

  text: {
    fontSize: 28,
    fontWeight: '700',
  },

  feedback: {
    position: 'absolute',
    right: 12,
    top: 8,
    fontSize: 22,
    fontWeight: '800',
  },
});
