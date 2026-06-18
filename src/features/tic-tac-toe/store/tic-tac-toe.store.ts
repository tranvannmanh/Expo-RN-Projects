import { create } from 'zustand';

import type { CellValue, GameStatus, Player, Players, WinResult } from '../types';

const WIN_COMBINATIONS: [number, number, number][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWinner(board: CellValue[]): WinResult | null {
  for (let i = 0; i < WIN_COMBINATIONS.length; i++) {
    const [a, b, c] = WIN_COMBINATIONS[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, line: [a, b, c], lineIndex: i };
    }
  }
  return null;
}

const EMPTY_BOARD: CellValue[] = Array(9).fill(null);

interface TicTacToeStore {
  board: CellValue[];
  currentPlayer: Player;
  status: GameStatus;
  winResult: WinResult | null;
  players: Players;
  scores: Record<Player, number>;
  setPlayers: (players: Players) => void;
  startGame: () => void;
  makeMove: (index: number) => void;
  resetGame: () => void;
  resetAll: () => void;
}

export const useTicTacToeStore = create<TicTacToeStore>((set, get) => ({
  board: [...EMPTY_BOARD],
  currentPlayer: 'X',
  status: 'setup',
  winResult: null,
  players: { X: 'Player 1', O: 'Player 2' },
  scores: { X: 0, O: 0 },

  setPlayers: (players) => set({ players }),

  startGame: () =>
    set({
      board: [...EMPTY_BOARD],
      currentPlayer: 'X',
      status: 'playing',
      winResult: null,
    }),

  makeMove: (index) => {
    const { board, currentPlayer, status } = get();
    if (status !== 'playing' || board[index] !== null) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;

    const winResult = checkWinner(newBoard);
    const isDraw = !winResult && newBoard.every((cell) => cell !== null);
    const newStatus: GameStatus = winResult ? 'won' : isDraw ? 'draw' : 'playing';

    set({
      board: newBoard,
      currentPlayer: currentPlayer === 'X' ? 'O' : 'X',
      status: newStatus,
      winResult: winResult ?? null,
      ...(winResult && {
        scores: {
          ...get().scores,
          [winResult.winner]: get().scores[winResult.winner] + 1,
        },
      }),
    });
  },

  resetGame: () =>
    set({
      board: [...EMPTY_BOARD],
      currentPlayer: 'X',
      status: 'playing',
      winResult: null,
    }),

  resetAll: () =>
    set({
      board: [...EMPTY_BOARD],
      currentPlayer: 'X',
      status: 'setup',
      winResult: null,
      scores: { X: 0, O: 0 },
    }),
}));
