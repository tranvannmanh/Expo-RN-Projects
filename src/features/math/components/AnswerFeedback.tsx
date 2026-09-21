import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  result: 'correct' | 'wrong';
  answer: number;
};

export function AnswerFeedback({ result, answer }: Props) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = 0;
    scale.value = 0.7;
    translateX.value = 0;

    opacity.value = withSequence(
      withTiming(1, {
        duration: 100,
      }),
      withTiming(1, {
        duration: 350,
      }),
      withTiming(0, {
        duration: 200,
      }),
    );

    if (result === 'correct') {
      scale.value = withSequence(
        withTiming(1.15, {
          duration: 180,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(1, {
          duration: 120,
        }),
      );
    } else {
      translateX.value = withSequence(
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [result, answer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
  }));

  const isCorrect = result === 'correct';

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        isCorrect ? styles.correct : styles.wrong,
        animatedStyle,
      ]}
    >
      <Text style={styles.icon}>{isCorrect ? '✓' : '✕'}</Text>

      <Text style={styles.answer}>{answer}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    top: '42%',

    minWidth: 100,
    paddingHorizontal: 24,
    paddingVertical: 14,

    borderRadius: 20,

    alignItems: 'center',
    justifyContent: 'center',

    zIndex: 50,
  },

  correct: {
    backgroundColor: 'rgba(46, 125, 50, 0.95)',
  },

  wrong: {
    backgroundColor: 'rgba(198, 40, 40, 0.95)',
  },

  icon: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  answer: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
