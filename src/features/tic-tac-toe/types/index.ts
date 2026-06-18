export type Player = 'X' | 'O';
export type CellValue = Player | null;
export type GameStatus = 'setup' | 'playing' | 'won' | 'draw';

export interface WinResult {
  winner: Player;
  line: [number, number, number];
  lineIndex: number;
}

export interface Players {
  X: string;
  O: string;
}
