import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withSequence,
	withTiming,
} from 'react-native-reanimated';

type GameHeaderProps = {
  score: number;
  lives: number;
};

export function GameHeader({ score, lives }: GameHeaderProps) {
  const previousLivesRef = useRef(lives);

  const lifeScale = useSharedValue(1);
  const lifeTranslateX = useSharedValue(0);

  useEffect(() => {
    const previousLives = previousLivesRef.current;

    if (lives < previousLives) {
      lifeScale.value = withSequence(
        withTiming(1.25, {
          duration: 120,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(1, {
          duration: 120,
        }),
      );

      lifeTranslateX.value = withSequence(
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }

    previousLivesRef.current = lives;
  }, [lives]);

  const lifeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: lifeScale.value },
      { translateX: lifeTranslateX.value },
    ],
  }));

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.score}>⭐ {score}</ThemedText>

      <Animated.Text style={[styles.lives, lifeAnimatedStyle]}>
        {'❤️'.repeat(lives)}
      </Animated.Text>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  score: {
    fontSize: 24,
    fontWeight: '700',
  },

  lives: {
    fontSize: 20,
  },
});
