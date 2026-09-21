import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedThemedView, ThemedText, ThemedView } from '@/components';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GAME_CONFIG } from '../constants/GameConfigs';

type QuestionProgressProps = {
  level: number;
  totalQuestions: number;
};

export function QuestionProgress({
  level,
  totalQuestions,
}: QuestionProgressProps) {
  const questionsPerLevel = GAME_CONFIG.difficulty.questionsPerLevel;

  const questionInLevel = (totalQuestions % questionsPerLevel) + 1;

  const progress = (totalQuestions % questionsPerLevel) / questionsPerLevel;

  const progressValue = useSharedValue(progress);

  useEffect(() => {
    progressValue.value = withTiming(progress, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
  }, [progress]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.level}>LEVEL {level}</ThemedText>

        <ThemedText style={styles.question}>
          Question {questionInLevel} / {questionsPerLevel}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.track}>
        <AnimatedThemedView style={[styles.progress, animatedProgressStyle]} />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 4,
    marginBottom: 12,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  level: {
    fontSize: 14,
    fontWeight: '800',
  },

  question: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },

  track: {
    height: 8,
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },

  progress: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#4CAF50',
  },
});
