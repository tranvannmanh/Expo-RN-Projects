import { SchulteGameEngine } from '../models/SchulteGameEngine';

describe('SchulteGameEngine', () => {
  it('should start a new game', () => {
    const engine = new SchulteGameEngine(5);

    engine.start();

    const state = engine.getState();

    expect(state.status).toBe('playing');
    expect(state.size).toBe(5);
    expect(state.board).toHaveLength(25);
    expect(state.currentNumber).toBe(1);
    expect(state.startedAt).not.toBeNull();
  });

  it('should generate all numbers from 1 to 25', () => {
    const engine = new SchulteGameEngine(5);

    engine.start();

    const state = engine.getState();

    expect([...state.board].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 25 }, (_, index) => index + 1),
    );
  });

  it('should accept the correct number', () => {
    const engine = new SchulteGameEngine(5);

    engine.start();

    expect(engine.selectNumber(1)).toBe(true);

    const state = engine.getState();

    expect(state.currentNumber).toBe(2);
  });

  it('should reject the wrong number', () => {
    const engine = new SchulteGameEngine(5);

    engine.start();

    expect(engine.selectNumber(5)).toBe(false);

    const state = engine.getState();

    expect(state.currentNumber).toBe(1);
  });

  it('should complete after selecting all numbers', () => {
    const engine = new SchulteGameEngine(3);

    engine.start();

    for (let number = 1; number <= 9; number++) {
      expect(engine.selectNumber(number)).toBe(true);
    }

    const state = engine.getState();

    expect(state.status).toBe('completed');
    expect(state.currentNumber).toBe(9);
    expect(state.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('should not allow selecting numbers after completion', () => {
    const engine = new SchulteGameEngine(2);

    engine.start();

    engine.selectNumber(1);
    engine.selectNumber(2);
    engine.selectNumber(3);
    engine.selectNumber(4);

    expect(engine.selectNumber(1)).toBe(false);
  });

  it('should reset the game', () => {
    const engine = new SchulteGameEngine(5);

    engine.start();
    engine.reset();

    const state = engine.getState();

    expect(state.status).toBe('idle');
    expect(state.board).toEqual([]);
    expect(state.currentNumber).toBe(1);
    expect(state.startedAt).toBeNull();
    expect(state.elapsedMs).toBe(0);
  });
});
