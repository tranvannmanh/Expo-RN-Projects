export type SchulteStatus = 'idle' | 'playing' | 'completed';

export type SchulteGameState = {
  status: SchulteStatus;
  size: number;
  board: number[];
  currentNumber: number;
  startedAt: number | null;
  completedAt: number | null;
  elapsedMs: number;
};
