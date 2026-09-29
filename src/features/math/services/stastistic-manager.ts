import { createMMKV } from 'react-native-mmkv';
import { GameStatistics } from '../types';

const storage = createMMKV({
  id: 'math-game',
});

const STATISTICS_KEY = 'math_game_statistics';

const DEFAULT_STATISTICS: GameStatistics = {
  gamesPlayed: 0,
  totalQuestions: 0,
  correctAnswers: 0,
  bestScore: 0,
  bestCombo: 0,
  highestLevel: 1,
};

export class StatisticsManager {
  getStatistics(): GameStatistics {
    const stored = storage.getString(STATISTICS_KEY);

    if (!stored) {
      return { ...DEFAULT_STATISTICS };
    }

    try {
      return JSON.parse(stored) as GameStatistics;
    } catch {
      return { ...DEFAULT_STATISTICS };
    }
  }

  recordGame(result: {
    score: number;
    bestCombo: number;
    totalQuestions: number;
    correctAnswers: number;
    highestLevel: number;
  }): GameStatistics {
    const current = this.getStatistics();

    const updated: GameStatistics = {
      gamesPlayed: current.gamesPlayed + 1,

      totalQuestions: current.totalQuestions + result.totalQuestions,

      correctAnswers: current.correctAnswers + result.correctAnswers,

      bestScore: Math.max(current.bestScore, result.score),

      bestCombo: Math.max(current.bestCombo, result.bestCombo),

      highestLevel: Math.max(current.highestLevel, result.highestLevel),
    };

    storage.set(STATISTICS_KEY, JSON.stringify(updated));

    return updated;
  }

  getAccuracy(): number {
    const statistics = this.getStatistics();

    if (statistics.totalQuestions === 0) {
      return 0;
    }

    return (statistics.correctAnswers / statistics.totalQuestions) * 100;
  }

  reset(): void {
    storage.remove(STATISTICS_KEY);
  }
}
