import { useCallback } from 'react';
import { Alert, StyleSheet, TouchableOpacity } from 'react-native';

import {
  ThemedSafeAreaView,
  ThemedScrollView,
  ThemedText,
  ThemedView,
} from '@/components';
import { useFocusEffect } from 'expo-router';
import { StatisticCard } from '../components/StatisticCard';
import { useStatistics } from '../hooks/useStatistic';

export function StatisticsScreen() {
  const { statistics, accuracy, reset, refresh } = useStatistics();

  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset Statistics',
      'Are you sure you want to reset all statistics?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: reset,
        },
      ],
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <ThemedSafeAreaView style={styles.safeArea}>
      <ThemedScrollView
        showsVerticalScrollIndicator={false}
        style={styles.content}
      >
        <ThemedView style={styles.header}>
          <ThemedText style={styles.title}>📊 Statistics</ThemedText>

          <ThemedText style={styles.subtitle}>Your performance</ThemedText>
        </ThemedView>

        <ThemedView style={styles.grid}>
          <StatisticCard
            icon="🏆"
            title="Best Score"
            value={statistics.bestScore}
          />

          <StatisticCard
            icon="🔥"
            title="Best Combo"
            value={statistics.bestCombo}
          />
        </ThemedView>

        <ThemedView style={styles.grid}>
          <StatisticCard
            icon="🎯"
            title="Accuracy"
            value={`${accuracy.toFixed(1)}%`}
          />

          <StatisticCard
            icon="❓"
            title="Questions"
            value={statistics.totalQuestions}
          />
        </ThemedView>

        <ThemedView style={styles.grid}>
          <StatisticCard
            icon="🎮"
            title="Games Played"
            value={statistics.gamesPlayed}
          />

          <StatisticCard
            icon="📈"
            title="Highest Level"
            value={`Level ${statistics.highestLevel}`}
          />
        </ThemedView>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleReset}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.resetText}>Reset Statistics</ThemedText>
        </TouchableOpacity>
      </ThemedScrollView>
    </ThemedSafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    alignItems: 'center',
    marginBottom: 28,
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
  },

  subtitle: {
    marginTop: 6,
    fontSize: 15,
    opacity: 0.6,
  },

  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },

  resetButton: {
    marginTop: 20,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 80, 80, 0.12)',
  },

  resetText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E53935',
  },
});
