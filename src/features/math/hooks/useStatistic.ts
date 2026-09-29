import { useCallback, useMemo, useState } from 'react';
import { StatisticsManager } from '../services/stastistic-manager';
import { GameStatistics } from '../types';

export function useStatistics() {
  const manager = useMemo(() => new StatisticsManager(), []);

  const [statistics, setStatistics] = useState<GameStatistics>(() =>
    manager.getStatistics(),
  );

  const accuracy = useMemo(() => {
    if (statistics.totalQuestions === 0) {
      return 0;
    }

    return (statistics.correctAnswers / statistics.totalQuestions) * 100;
  }, [statistics.correctAnswers, statistics.totalQuestions]);

  const refresh = useCallback(() => {
    setStatistics(manager.getStatistics());
  }, [manager]);

  const reset = useCallback(() => {
    manager.reset();
    setStatistics(manager.getStatistics());
  }, [manager]);

  return {
    statistics,
    accuracy,
    refresh,
    reset,
  };
}
