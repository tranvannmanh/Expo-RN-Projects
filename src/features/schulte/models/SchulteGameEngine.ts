import { SchulteGameState } from '../types';
import { generateBoard } from '../utils';

export class SchulteGameEngine {
  private state: SchulteGameState;

  constructor(size = 5) {
    this.state = {
      status: 'idle',
      size,
      board: [],
      currentNumber: 1,
      startedAt: null,
      completedAt: null,
      elapsedMs: 0,
    };
  }

  start(): void {
    this.state = {
      status: 'playing',
      size: this.state.size,
      board: generateBoard(this.state.size),
      currentNumber: 1,
      startedAt: Date.now(),
      completedAt: null,
      elapsedMs: 0,
    };
  }

  selectNumber(number: number): boolean {
    if (this.state.status !== 'playing') {
      return false;
    }

    if (number !== this.state.currentNumber) {
      return false;
    }

    const isLastNumber = number === this.state.size * this.state.size;

    if (isLastNumber) {
      const completedAt = Date.now();

      this.state.status = 'completed';
      this.state.completedAt = completedAt;
      this.state.elapsedMs =
        completedAt - (this.state.startedAt ?? completedAt);

      return true;
    }

    this.state.currentNumber += 1;

    return true;
  }

  getElapsedMs(): number {
    if (
      this.state.status === 'completed' &&
      this.state.completedAt !== null &&
      this.state.startedAt !== null
    ) {
      return this.state.completedAt - this.state.startedAt;
    }

    if (this.state.status === 'playing' && this.state.startedAt !== null) {
      return Date.now() - this.state.startedAt;
    }

    return 0;
  }

  getState(): SchulteGameState {
    return {
      ...this.state,
      board: [...this.state.board],
    };
  }

  reset(): void {
    this.state = {
      status: 'idle',
      size: this.state.size,
      board: [],
      currentNumber: 1,
      startedAt: null,
      completedAt: null,
      elapsedMs: 0,
    };
  }
}
