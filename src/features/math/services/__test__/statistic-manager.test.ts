import { beforeEach, describe, expect, it } from '@jest/globals';
import { StatisticsManager } from '../stastistic-manager';

describe('StatisticsManager', () => {
  let manager: StatisticsManager;

  beforeEach(() => {
    manager = new StatisticsManager();
    manager.reset();
  });

  it('should return default statistics', () => {
    expect(manager.getStatistics()).toEqual({
      gamesPlayed: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      bestScore: 0,
      bestCombo: 0,
      highestLevel: 1,
    });
  });

  it('should record a completed game', () => {
    manager.recordGame({
      score: 1000,
      bestCombo: 5,
      totalQuestions: 20,
      correctAnswers: 15,
      highestLevel: 2,
    });

    expect(manager.getStatistics()).toEqual({
      gamesPlayed: 1,
      totalQuestions: 20,
      correctAnswers: 15,
      bestScore: 1000,
      bestCombo: 5,
      highestLevel: 2,
    });
  });

  it('should accumulate game statistics', () => {
    manager.recordGame({
      score: 1000,
      bestCombo: 5,
      totalQuestions: 20,
      correctAnswers: 15,
      highestLevel: 2,
    });

    manager.recordGame({
      score: 2000,
      bestCombo: 8,
      totalQuestions: 30,
      correctAnswers: 25,
      highestLevel: 3,
    });

    expect(manager.getStatistics()).toEqual({
      gamesPlayed: 2,
      totalQuestions: 50,
      correctAnswers: 40,
      bestScore: 2000,
      bestCombo: 8,
      highestLevel: 3,
    });
  });

  it('should keep best values', () => {
    manager.recordGame({
      score: 2000,
      bestCombo: 10,
      totalQuestions: 20,
      correctAnswers: 15,
      highestLevel: 3,
    });

    manager.recordGame({
      score: 1000,
      bestCombo: 5,
      totalQuestions: 10,
      correctAnswers: 8,
      highestLevel: 2,
    });

    expect(manager.getStatistics()).toEqual({
      gamesPlayed: 2,
      totalQuestions: 30,
      correctAnswers: 23,
      bestScore: 2000,
      bestCombo: 10,
      highestLevel: 3,
    });
  });

  it('should calculate accuracy', () => {
    manager.recordGame({
      score: 1000,
      bestCombo: 5,
      totalQuestions: 20,
      correctAnswers: 15,
      highestLevel: 2,
    });

    expect(manager.getAccuracy()).toBe(75);
  });

  it('should return zero accuracy when there are no questions', () => {
    expect(manager.getAccuracy()).toBe(0);
  });

  it('should record a timeout game', () => {
    manager.recordGame({
      score: 500,
      bestCombo: 3,
      totalQuestions: 10,
      correctAnswers: 7,
      highestLevel: 1,
    });

    const statistics = manager.getStatistics();

    expect(statistics.gamesPlayed).toBe(1);
    expect(statistics.totalQuestions).toBe(10);
    expect(statistics.correctAnswers).toBe(7);
  });
});
