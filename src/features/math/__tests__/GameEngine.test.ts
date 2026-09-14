import { describe, expect, it } from '@jest/globals';
import { GameEngine } from '../models/GameEngine';

describe('GameEngine', () => {
  it('should start the game correctly', () => {
    const game = new GameEngine();

    game.start();

    const state = game.getState();

    expect(state.status).toBe('playing');
    expect(state.score).toBe(0);
    expect(state.combo).toBe(0);
    expect(state.lives).toBe(3);
    expect(state.question).not.toBeNull();
  });

  it('should increase score when answer is correct', () => {
    const game = new GameEngine();

    game.start();

    const question = game.getState().question!;

    const result = game.submitAnswer(question.answer);

    expect(result).toEqual({ correct: true, earnedScore: 100 });

    const state = game.getState();

    expect(state.score).toBe(100);
    expect(state.combo).toBe(1);
    expect(state.lives).toBe(3);
  });

  it('should decrease life when answer is wrong', () => {
    const game = new GameEngine();

    game.start();

    const question = game.getState().question!;

    const wrongAnswer = question.options.find(
      (option) => option !== question.answer,
    )!;

    const result = game.submitAnswer(wrongAnswer);

    expect(result).toEqual({ correct: false, earnedScore: 0 });

    const state = game.getState();

    expect(state.score).toBe(0);
    expect(state.combo).toBe(0);
    expect(state.lives).toBe(2);
  });

  it('should give higher score at higher difficulty', () => {
    const engine = new GameEngine();

    engine.start();

    // Complete 10 questions → difficulty 2
    for (let i = 0; i < 10; i++) {
      const state = engine.getState();

      engine.submitAnswer(state.question!.answer);
    }

    const stateBeforeLevel2Answer = engine.getState();

    expect(stateBeforeLevel2Answer.difficulty).toBe(2);

    const result = engine.submitAnswer(
      stateBeforeLevel2Answer.question!.answer,
    );

    expect(result.correct).toBe(true);
    expect(result.earnedScore).toBeGreaterThan(100);
  });
});

describe('GameEngine - Difficulty Progression', () => {
  it('should start at difficulty 1', () => {
    const engine = new GameEngine();

    engine.start();

    const state = engine.getState();

    expect(state.status).toBe('playing');
    expect(state.difficulty).toBe(1);
    expect(state.question?.difficulty).toBe(1);
  });

  it('should increase to difficulty 2 after 10 questions', () => {
    const engine = new GameEngine();

    engine.start();

    for (let i = 0; i < 10; i++) {
      const state = engine.getState();

      expect(state.question).not.toBeNull();

      engine.submitAnswer(state.question!.answer);
    }

    const state = engine.getState();

    expect(state.totalQuestions).toBe(10);
    expect(state.difficulty).toBe(2);
    expect(state.question?.difficulty).toBe(2);
  });

  it('should increase to difficulty 3 after 20 questions', () => {
    const engine = new GameEngine();

    engine.start();

    for (let i = 0; i < 20; i++) {
      const state = engine.getState();

      expect(state.question).not.toBeNull();

      engine.submitAnswer(state.question!.answer);
    }

    const state = engine.getState();

    expect(state.totalQuestions).toBe(20);
    expect(state.difficulty).toBe(3);
    expect(state.question?.difficulty).toBe(3);
  });

  it('should increase to difficulty 4 after 30 questions', () => {
    const engine = new GameEngine();

    engine.start();

    for (let i = 0; i < 30; i++) {
      const state = engine.getState();

      expect(state.question).not.toBeNull();

      engine.submitAnswer(state.question!.answer);
    }

    const state = engine.getState();

    expect(state.totalQuestions).toBe(30);
    expect(state.difficulty).toBe(4);
    expect(state.question?.difficulty).toBe(4);
  });

  it('should not exceed maximum difficulty', () => {
    const engine = new GameEngine();

    engine.start();

    for (let i = 0; i < 50; i++) {
      const state = engine.getState();

      expect(state.question).not.toBeNull();

      engine.submitAnswer(state.question!.answer);
    }

    const state = engine.getState();

    expect(state.totalQuestions).toBe(50);
    expect(state.difficulty).toBe(4);
    expect(state.question?.difficulty).toBe(4);
  });

  it('should reset difficulty to 1 when game is reset', () => {
    const engine = new GameEngine();

    engine.start();

    for (let i = 0; i < 10; i++) {
      const state = engine.getState();
      engine.submitAnswer(state.question!.answer);
    }

    expect(engine.getState().difficulty).toBe(2);

    engine.reset();

    const state = engine.getState();

    expect(state.status).toBe('idle');
    expect(state.totalQuestions).toBe(0);
    expect(state.difficulty).toBe(1);
    expect(state.question).toBeNull();
  });
});

describe('GameEngine - Dynamic Timer Difficulty', () => {
  it('should have 10 seconds at difficulty 1', () => {
    const engine = new GameEngine();

    engine.start();

    const remaining = engine.getRemainingTimeMs();

    expect(remaining).toBeGreaterThan(9_500);
    expect(remaining).toBeLessThanOrEqual(10_000);
  });

  it('should have 9 seconds at difficulty 2', () => {
    const engine = new GameEngine();

    engine.start();

    for (let i = 0; i < 10; i++) {
      const state = engine.getState();

      engine.submitAnswer(state.question!.answer);
    }

    expect(engine.getState().difficulty).toBe(2);

    const remaining = engine.getRemainingTimeMs();

    expect(remaining).toBeGreaterThan(8_500);
    expect(remaining).toBeLessThanOrEqual(9_000);
  });

  it('should have 8 seconds at difficulty 3', () => {
    const engine = new GameEngine();

    engine.start();

    for (let i = 0; i < 20; i++) {
      const state = engine.getState();

      engine.submitAnswer(state.question!.answer);
    }

    expect(engine.getState().difficulty).toBe(3);

    const remaining = engine.getRemainingTimeMs();

    expect(remaining).toBeGreaterThan(7_500);
    expect(remaining).toBeLessThanOrEqual(8_000);
  });

  it('should have 7 seconds at difficulty 4', () => {
    const engine = new GameEngine();

    engine.start();

    for (let i = 0; i < 30; i++) {
      const state = engine.getState();

      engine.submitAnswer(state.question!.answer);
    }

    expect(engine.getState().difficulty).toBe(4);

    const remaining = engine.getRemainingTimeMs();

    expect(remaining).toBeGreaterThan(6_500);
    expect(remaining).toBeLessThanOrEqual(7_000);
  });

  it('should not exceed the maximum difficulty timer', () => {
    const engine = new GameEngine();

    engine.start();

    for (let i = 0; i < 50; i++) {
      const state = engine.getState();

      engine.submitAnswer(state.question!.answer);
    }

    expect(engine.getState().difficulty).toBe(4);

    const remaining = engine.getRemainingTimeMs();

    expect(remaining).toBeGreaterThan(6_500);
    expect(remaining).toBeLessThanOrEqual(7_000);
  });
});
